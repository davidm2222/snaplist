import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

async function verifyFirebaseToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.users?.[0]?.localId as string) ?? null;
  } catch {
    return null;
  }
}

// Extract metadata from raw HTML using regex — no dependencies, instant, free.
function extractMetadata(html: string, url: string) {
  const get = (...patterns: RegExp[]) => {
    for (const p of patterns) {
      const m = html.match(p)?.[1]?.trim();
      if (m) return m;
    }
    return '';
  };

  const title = get(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<title[^>]*>([^<]+)<\/title>/i
  );

  const description = get(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i
  );

  const author = get(
    /<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']author["']/i,
    /<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["']/i
  );

  const siteName = get(
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i
  ) || (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } })();

  return { title, description, author, siteName };
}

export interface ParseUrlResponse {
  shelf: string;
  title: string;
  fields: Record<string, string>;
  hashtags: string[];
}

export async function POST(req: NextRequest) {
  // 1. Verify Firebase ID token.
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = await verifyFirebaseToken(idToken);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Validate URL.
  let url: string;
  try {
    const body = await req.json();
    url = body.url;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!url || !/^https?:\/\/.+/.test(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // 3. Fetch the page and extract metadata with regex (hybrid step 1 — no AI needed).
  let meta = { title: '', description: '', author: '', siteName: '' };
  try {
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SnapList/1.0)' },
      signal: AbortSignal.timeout(6000),
    });
    const html = await pageRes.text();
    const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html.slice(0, 5000);
    meta = extractMetadata(head, url);
  } catch {
    // Non-fatal — Claude can still classify from the URL alone.
  }

  // 4. Call Claude only for shelf classification + hashtag suggestions (hybrid step 2).
  // Much smaller prompt than sending full HTML.
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Classify this web page and suggest hashtags for a personal bookmarking app.

Shelves:
- read   → articles, blog posts, books, documentation, links to read
- watch  → YouTube, movies, TV shows, video content
- eat    → restaurants, cafes, bars, recipes, food
- do     → activities, events, places to visit, concerts, hikes
- buy    → products, shopping, gear, tools
- other  → anything else

Page info:
Title: ${meta.title || '(none)'}
Description: ${meta.description || '(none)'}
URL: ${url}

Return ONLY valid JSON, no markdown:
{"shelf":"<shelf>","hashtags":["<tag1>","<tag2>"]}

Rules: 1-3 lowercase single-word hashtags. Pick the most relevant shelf.`;

  let shelf = 'other';
  let hashtags: string[] = [];

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      shelf = parsed.shelf ?? 'other';
      hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    }
  } catch (err) {
    console.error('Claude classification error:', err);
    // Fall through with defaults — still return the metadata we extracted.
  }

  const fields: Record<string, string> = {};
  if (meta.author) fields.author = meta.author;
  if (meta.siteName) fields.site = meta.siteName;

  const response: ParseUrlResponse = {
    shelf,
    title: meta.title || url,
    fields,
    hashtags,
  };

  return NextResponse.json(response);
}
