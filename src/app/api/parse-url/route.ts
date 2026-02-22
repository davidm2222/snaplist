import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Verifies a Firebase ID token using the Firebase REST API.
// No service account / firebase-admin needed — just the project's API key.
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

export interface ParseUrlResponse {
  shelf: string;
  title: string;
  fields: Record<string, string>;
  hashtags: string[];
}

export async function POST(req: NextRequest) {
  // 1. Require a valid Firebase ID token in the Authorization header.
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = await verifyFirebaseToken(idToken);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate the URL from the request body.
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

  // 3. Fetch the page server-side (avoids CORS, hides origin from client).
  let headHtml = '';
  try {
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SnapList/1.0; +https://snaplist.app)' },
      signal: AbortSignal.timeout(6000),
    });
    const text = await pageRes.text();
    // Extract <head> only — keeps the prompt small and focused on metadata.
    const match = text.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    headHtml = (match?.[1] ?? text).slice(0, 4000);
  } catch {
    // Non-fatal — Claude can still attempt a classification from the URL alone.
    headHtml = '';
  }

  // 4. Call Claude to classify and extract metadata.
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a metadata extractor for a personal bookmarking app called SnapList.

Classify this page into one shelf and extract key metadata.

Shelves:
- read   → articles, blog posts, documentation, books, links to read
- watch  → YouTube videos, movies, TV shows, films, video content
- eat    → restaurants, cafes, bars, recipes, food places
- do     → activities, events, places to visit, concerts, hikes, museums
- buy    → products, shopping items, gear, tools
- other  → anything that doesn't fit above

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "shelf": "<shelf key>",
  "title": "<short clear title, max 60 chars>",
  "fields": {
    "author": "<author name, if applicable>",
    "site": "<site/publication name>"
  },
  "hashtags": ["<tag1>", "<tag2>"]
}

Rules:
- "fields" should only include keys that have real values (omit empty ones)
- "hashtags" should be 1-3 lowercase single-word tags describing the content
- "title" should be the actual title of the content, not the URL

URL: ${url}
Page <head> HTML:
${headHtml}`;

  let parsed: ParseUrlResponse;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    // Extract JSON even if Claude wraps it in backticks.
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Claude parse error:', err);
    return NextResponse.json({ error: 'Failed to parse page' }, { status: 500 });
  }

  return NextResponse.json(parsed);
}
