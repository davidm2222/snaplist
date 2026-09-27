// Free-form text -> Haiku -> note draft pieces. Used by /api/parse-url for input without a shelf prefix.
// Pure functions (prompt + response cleanup) so they can be unit-tested without calling the API.

import type { CategoryKey } from '@/types';
import { SHELVES, SHELF_TYPES, isShelf, lookupAlias, stripHomeState } from './notes';

// Details Haiku may fill, per shelf. Everything else it knows goes in notes/hashtags.
export const AI_FIELDS: Record<CategoryKey, string[]> = {
  read: ['author'],
  watch: [],
  eat: ['location', 'cuisine'],
  do: ['location'],
  buy: [],
  other: [],
};

export interface AiDraft {
  shelf: CategoryKey;
  type: string;
  title: string;
  notes: string;
  fields: Record<string, string>;
  hashtags: string[];
}

export function buildTextPrompt(text: string): string {
  const shelfLines = SHELVES.map(s => {
    const types = SHELF_TYPES[s].length ? ` (types: ${SHELF_TYPES[s].join(', ')})` : '';
    return `- ${s}${types}`;
  }).join('\n');

  return `You file quick notes for a personal app of things to read, watch, eat, do, and buy. The user typed:

<note>
${text}
</note>

Shelves:
${shelfLines}

Return ONLY valid JSON, no markdown:
{"shelf":"","type":"","title":"","notes":"","author":"","location":"","cuisine":"","hashtags":[]}

Rules:
- title: just the name of the thing, properly capitalized ("The Sun Also Rises", "Le Petit Four", "Bop It"). Never include who, why, or where; that goes in notes or location ("six flags with zach" -> title "Six Flags", notes "with Zach"). If there's no name, a short description ("Dumpling place"); never "".
- notes: anything else worth keeping, in the user's words, as a short phrase: who recommended it, who it's for, who to go with, why ("Mike Broshi recommended", "for Carly", "with Zach", "best croissants"). "" if nothing.
- type: one of the chosen shelf's types if it clearly fits, else "". On buy, "gift" means it's for someone else.
- author (read only): who wrote it.
- location (eat and do only): the town, adding the state only if not Massachusetts ("Newton", "Cabot VT").
- cuisine (eat only): one or two lowercase words ("french bakery", "sichuan", "ramen").
- author, location, cuisine: use what the user said, or a fact you know for certain about this specific thing. If you would be guessing (a small place you don't recognize, a name with several locations), use "". A blank is better than a wrong answer.
- hashtags: 0-2 lowercase single words for topic or genre. Don't repeat the shelf, type, or other fields ("restaurant", "book", "dumplings" are already covered).`;
}

// Parse Haiku's reply into a draft, dropping anything that doesn't fit the shelf.
export function readAiDraft(reply: string): AiDraft | null {
  const json = reply.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const shelf = isShelf(parsed.shelf) ? parsed.shelf : 'other';
  const type = lookupAlias(str(parsed.type))?.type ?? '';
  const fields: Record<string, string> = {};
  for (const key of AI_FIELDS[shelf]) {
    const value = str(parsed[key]);
    if (value) fields[key] = key === 'location' ? stripHomeState(value) : value;
  }

  return {
    shelf,
    type: SHELF_TYPES[shelf].includes(type) ? type : '',
    title: str(parsed.title),
    notes: str(parsed.notes),
    fields,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(str).filter(Boolean) : [],
  };
}
