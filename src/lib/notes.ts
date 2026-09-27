// Shelf/type/search logic shared by the parser, components, and (later) server routes.
import { CATEGORIES, CategoryKey, Note, NoteDraft } from '@/types';

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

// Prefer the explicit shelf (all notes since the F3 migration). The tags[0] fallback covers
// notes written by older code; pre-redesign values ("book", "drink") resolve via aliases.
export function resolveShelf(note: Pick<Note, 'tags' | 'shelf'>): CategoryKey {
  if (isShelf(note.shelf)) return note.shelf;
  const tag = note.tags?.[0];
  if (!tag) return 'other';
  if (isShelf(tag)) return tag;
  return lookupAlias(tag)?.shelf ?? 'other';
}

// "Done" means different things per shelf. On Eat and Do it's "been there": the note stays in
// the list with a check, because you'd go back. Elsewhere it's finished and moves to Finished.
export const DONE_LABELS: Record<CategoryKey, string> = {
  read: 'Read it', watch: 'Watched', eat: 'Been here', do: 'Did it', buy: 'Bought', other: 'Done',
};

export function doneStaysInList(shelf: CategoryKey): boolean {
  return shelf === 'eat' || shelf === 'do';
}

export function isFinished(note: Pick<Note, 'tags' | 'shelf' | 'done'>): boolean {
  return !!note.done && !doneStaysInList(resolveShelf(note));
}

// Canonical type ("book", "cafe"), or null when only the shelf is known.
// Older notes may store a synonym ("film") or keep the type in tags[0]; both normalize.
export function resolveType(note: Pick<Note, 'tags' | 'type'>): string | null {
  const tag = note.tags?.[0];
  const raw = note.type || (tag && !isShelf(tag) ? tag : null);
  if (!raw) return null;
  return lookupAlias(raw)?.type ?? raw;
}

// Every whitespace-separated term must appear somewhere in the note.
// Searches current content only — not `raw`, which can be stale after edits.
export function matchesSearch(note: Note, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = [
    note.title,
    note.notes,
    resolveShelf(note),
    resolveType(note) ?? '',
    ...note.hashTags,
    ...Object.keys(note.fields),
    ...Object.values(note.fields),
  ].join(' ').toLowerCase();
  return terms.every(term => text.includes(term));
}

// Locations are free-text place names; the state is only written when it's not the home state.
export const HOME_STATE = 'MA';

// "Newton MA" / "Newton, MA" -> "Newton". Keeps a lone "MA" (the whole state) intact.
export function stripHomeState(location: string): string {
  const trimmed = location.trim().replace(/\s+/g, ' ');
  return trimmed.replace(new RegExp(`([^\\s,])[\\s,]+${HOME_STATE}$`, 'i'), '$1');
}

// Standardized form for matching: "Newton MA", "newton", " NEWTON " all -> "newton"
export function locationKey(location: string): string {
  return stripHomeState(location).toLowerCase();
}

// Display form: "chestnut hill" -> "Chestnut Hill", "cabot vt" -> "Cabot VT", "dc" -> "DC"
export function formatLocation(location: string): string {
  const words = locationKey(location).split(' ');
  return words
    .map((w, i) => w.length === 2 && i === words.length - 1 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Distinct location keys in use, most frequent first — for @ autocomplete and parsing
export function knownLocations(notes: Pick<Note, 'fields'>[]): string[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    const loc = note.fields.location;
    if (!loc) continue;
    const key = locationKey(loc);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key);
}

// Clean a draft before saving: canonical type, trimmed title, lowercase unique hashtags,
// no empty fields, no orphan commas in notes, no home state on location.
export function normalizeDraft(draft: NoteDraft): NoteDraft {
  const fields = Object.fromEntries(
    Object.entries(draft.fields)
      .map(([k, v]) => [k.trim().toLowerCase(), v.trim()])
      .filter(([k, v]) => k && v)
  );
  if (fields.location) fields.location = stripHomeState(fields.location);
  const hashTags = [...new Set(
    draft.hashTags.map(t => t.trim().replace(/^#/, '').toLowerCase()).filter(Boolean)
  )];
  const result: NoteDraft = {
    shelf: draft.shelf,
    title: draft.title.trim(),
    notes: draft.notes.split(',').map(p => p.trim()).filter(Boolean).join(', '),
    fields,
    hashTags,
  };
  const type = draft.type?.trim().toLowerCase();
  if (type) result.type = lookupAlias(type)?.type ?? type;
  return result;
}
