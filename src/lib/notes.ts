// Shelf/type/search logic shared by the parser, components, and (later) server routes.
import { CATEGORIES, CategoryKey, Note } from '@/types';

// Display order for tabs and pickers
export const SHELVES: CategoryKey[] = ['read', 'watch', 'eat', 'do', 'buy', 'other'];

export function isShelf(value: unknown): value is CategoryKey {
  return typeof value === 'string' && (SHELVES as string[]).includes(value);
}

// Curated types offered per shelf in the edit picker
export const SHELF_TYPES: Record<CategoryKey, string[]> = {
  read: ['book', 'article', 'link'],
  watch: ['movie', 'show', 'video'],
  eat: ['restaurant', 'cafe', 'bar', 'drink'],
  do: ['activity', 'event', 'concert', 'hike', 'museum'],
  buy: [],
  other: [],
};

// Resolve a typed prefix ("book", "Movie", "eat") to its shelf.
// type is the alias itself when it differs from the shelf key.
export function lookupAlias(word: string): { shelf: CategoryKey; type?: string } | null {
  const w = word.trim().toLowerCase();
  for (const shelf of SHELVES) {
    if (CATEGORIES[shelf].aliases.includes(w)) {
      return { shelf, type: w !== shelf ? w : undefined };
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

// Specific type label ("book", "cafe"), or null when only the shelf is known
export function resolveType(note: Pick<Note, 'tags' | 'type'>): string | null {
  if (note.type) return note.type;
  const tag = note.tags?.[0];
  if (tag && !isShelf(tag)) return tag; // legacy note: tags[0] is the old category
  return null;
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
