// Site-specific extraction for URLs whose pages give a server-side fetch nothing useful
// (JS-rendered or bot-blocking sites). Pure functions except fetchYouTubeOEmbed.

export interface Extracted {
  title?: string;
  address?: string; // context for the classifier; not saved as a field
  fields: Record<string, string>;
}

// Titles that describe the site, not the thing — treat as missing
const GENERIC_TITLES = new Set([
  'google maps', 'youtube', 'amazon.com', 'amazon', 'instagram', 'tiktok', 'facebook',
  'x', 'twitter',
]);

// Bot-block / interstitial pages, often suffixed with the site name ("Please hold a moment… – The Atlantic")
const BLOCK_PAGE = /^(just a moment|please hold a moment|access denied|your access has been blocked|robot check|attention required|are you a robot)/;

export function isGenericTitle(title: string, siteName = ''): boolean {
  const t = title.trim().toLowerCase();
  if (!t) return true;
  if (siteName && t === siteName.trim().toLowerCase()) return true;
  return GENERIC_TITLES.has(t) || BLOCK_PAGE.test(t) || /^amazon\.com\s*:?\s*$/.test(t);
}

// Google Maps place URLs carry "Name, street, town, ST zip" in the path:
//   /maps/place/Coco+Ramen,+757+Beacon+St,+Newton+Centre,+MA+02459/data=...
export function extractGoogleMaps(url: URL): Extracted | null {
  if (!/(^|\.)google\.[a-z.]+$/.test(url.hostname)) return null;
  const m = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (!m) return null;

  const parts = decodeURIComponent(m[1].replace(/\+/g, ' '))
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length === 0 || /^-?\d+(\.\d+)?$/.test(parts[0])) return null; // dropped pin = coordinates

  const fields: Record<string, string> = {};
  const title = parts[0];

  // Need at least name, street, town, region to find the town reliably
  if (parts.length >= 4) {
    const last = parts[parts.length - 1];
    const town = parts[parts.length - 2].replace(/\b\d{4,}\b/g, '').trim();
    const state = last.match(/^([A-Z]{2})\s+\d{5}/)?.[1]; // US: "MA 02459"
    const location = state ? `${town} ${state}` : `${town} ${last.replace(/\b\d{4,}\b/g, '').trim()}`;
    if (town) fields.location = location.trim();
  }

  return { title, address: parts.slice(1).join(', ') || undefined, fields };
}

// Amazon product URLs usually carry a readable slug: /Some-Product-Name/dp/B0XXXX
export function extractAmazon(url: URL): Extracted | null {
  if (!/(^|\.)amazon\.[a-z.]+$/.test(url.hostname)) return null;
  const m = url.pathname.match(/^\/([^/]+)\/dp\//);
  if (!m) return null;
  return { title: decodeURIComponent(m[1]).replace(/-/g, ' '), fields: {} };
}

export async function fetchYouTubeOEmbed(url: URL): Promise<Extracted | null> {
  if (!/(^|\.)(youtube\.com|youtu\.be)$/.test(url.hostname)) return null;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const fields: Record<string, string> = {};
    if (data.author_name) fields.channel = String(data.author_name);
    return { title: data.title ? String(data.title) : undefined, fields };
  } catch {
    return null;
  }
}

export async function extractFromUrl(url: URL): Promise<Extracted | null> {
  return extractGoogleMaps(url) ?? extractAmazon(url) ?? (await fetchYouTubeOEmbed(url));
}
