// Shelf/type/search logic shared by the parser, components, and (later) server routes.
import { CATEGORIES, CategoryKey, Note } from '@/types';

// Display order for tabs and pickers
export const SHELVES: CategoryKey[] = ['read', 'watch', 'eat', 'do', 'buy', 'other'];

export function isShelf(value: unknown): value is CategoryKey {
  return typeof value === 'string' && (SHELVES as string[]).includes(value);
}

// Canonical types per shelf, in picker order
export const SHELF_TYPES = Object.fromEntries(
  SHELVES.map(shelf => [shelf, Object.keys(CATEGORIES[shelf].types)])
) as Record<CategoryKey, string[]>;

// Resolve a typed prefix ("eat", "Book", "film") to its shelf and canonical type
export function lookupAlias(word: string): { shelf: CategoryKey; type?: string } | null {
  const w = word.trim().toLowerCase();
  for (const shelf of SHELVES) {
    const { aliases, types } = CATEGORIES[shelf];
    if (aliases.includes(w)) return { shelf };
    for (const [type, synonyms] of Object.entries(types)) {
      if (w === type || synonyms.includes(w)) return { shelf, type };
    }
  }
  return null;
}

// The shelf lives in tags[0]. Notes from before the shelf redesign (2026-02-21) store
// the old category there instead ("book", "drink"), so resolve it through the aliases.
export function resolveShelf(note: Pick<Note, 'tags'>): CategoryKey {
  const tag = note.tags?.[0];
  if (!tag) return 'other';
  if (isShelf(tag)) return tag;
  return lookupAlias(tag)?.shelf ?? 'other';
}

// Canonical type ("book", "cafe"), or null when only the shelf is known.
// Older notes may store a synonym ("film") or keep the type in tags[0]; both normalize.
export function resolveType(note: Pick<Note, 'tags' | 'type'>): string | null {
  const tag = note.tags?.[0];
  const raw = note.type || (tag && !isShelf(tag) ? tag : null);
  if (!raw) return null;
  return lookupAlias(raw)?.type ?? raw;
}

// Every whitespace-separated term must appear somewhere in the note
export function matchesSearch(note: Note, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = [
    note.title,
    note.notes,
    note.raw,
    ...note.tags,
    ...note.hashTags,
    ...Object.keys(note.fields),
    ...Object.values(note.fields),
  ].join(' ').toLowerCase();
  return terms.every(term => text.includes(term));
}
