// F3 migration: give every note an explicit `shelf`, a canonical `type`, and `updatedAt`.
// Pure (no database access) so it can be unit-tested; scripts/migrate-shelf.ts applies it.
import type { Note } from '@/types';
import { resolveShelf, resolveType } from './notes';

// Field → new value; null means "delete this field"
export type NoteChanges = Record<string, string | number | null>;

type StoredNote = Pick<Note, 'tags' | 'type' | 'timestamp'> & { shelf?: string; updatedAt?: number };

export function planShelfMigration(note: StoredNote): NoteChanges {
  const changes: NoteChanges = {};

  const shelf = resolveShelf({ tags: note.tags }); // from tags, the pre-migration source
  if (note.shelf !== shelf) changes.shelf = shelf;

  const type = resolveType(note);
  if (type && note.type !== type) changes.type = type;
  if (!type && note.type !== undefined) changes.type = null;

  if (note.updatedAt === undefined) changes.updatedAt = note.timestamp;

  return changes;
}
