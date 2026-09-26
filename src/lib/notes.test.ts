import { describe, it, expect } from 'vitest';
import type { Note } from '@/types';
import { CATEGORIES } from '@/types';
import { SHELVES, SHELF_TYPES, isShelf, lookupAlias, resolveShelf, resolveType, matchesSearch } from './notes';

const note = (over: Partial<Note>): Note => ({
  id: '1', userId: 'u', tags: ['other'], hashTags: [], fields: {}, title: '', notes: '', raw: '', timestamp: 0,
  ...over,
});

describe('isShelf', () => {
  it('accepts shelf keys only', () => {
    expect(isShelf('eat')).toBe(true);
    expect(isShelf('book')).toBe(false);
    expect(isShelf('all')).toBe(false);
    expect(isShelf(undefined)).toBe(false);
  });
});

describe('lookupAlias', () => {
  it('maps aliases to shelf + type', () => {
    expect(lookupAlias('book')).toEqual({ shelf: 'read', type: 'book' });
    expect(lookupAlias('Eat')).toEqual({ shelf: 'eat' });
    expect(lookupAlias('film')).toEqual({ shelf: 'watch', type: 'movie' });
    expect(lookupAlias('podcast')).toBeNull();
  });
});

describe('resolveShelf', () => {
  it('reads the shelf from tags[0]', () => {
    expect(resolveShelf(note({ tags: ['watch'] }))).toBe('watch');
  });

  it.each([
    ['book', 'read'], ['movie', 'watch'], ['show', 'watch'],
    ['restaurant', 'eat'], ['drink', 'eat'], ['activity', 'do'],
  ])('maps legacy tag %s → %s', (tag, shelf) => {
    expect(resolveShelf(note({ tags: [tag] }))).toBe(shelf);
  });

  it('falls back to other for missing or unknown tags', () => {
    expect(resolveShelf(note({ tags: [] }))).toBe('other');
    expect(resolveShelf(note({ tags: ['mystery'] }))).toBe('other');
  });
});

describe('resolveType', () => {
  it('prefers the stored type', () => {
    expect(resolveType(note({ tags: ['read'], type: 'article' }))).toBe('article');
  });

  it('uses a legacy tag as the type', () => {
    expect(resolveType(note({ tags: ['book'] }))).toBe('book');
  });

  it('normalizes stored synonyms to the canonical type', () => {
    expect(resolveType(note({ tags: ['watch'], type: 'film' }))).toBe('movie');
    expect(resolveType(note({ tags: ['eat'], type: 'beer' }))).toBe('drink');
  });

  it('keeps unknown stored types as-is', () => {
    expect(resolveType(note({ tags: ['do'], type: 'kayak' }))).toBe('kayak');
  });

  it('returns null when only the shelf is known', () => {
    expect(resolveType(note({ tags: ['eat'] }))).toBeNull();
  });
});

describe('matchesSearch', () => {
  const n = note({
    title: 'Coco Ramen', notes: 'great tonkotsu', hashTags: ['ramen'],
    fields: { location: 'Newton Centre MA' }, tags: ['eat'],
  });

  it('requires every term to match somewhere', () => {
    expect(matchesSearch(n, 'coco newton')).toBe(true);
    expect(matchesSearch(n, 'ramen tonkotsu')).toBe(true);
    expect(matchesSearch(n, 'coco boston')).toBe(false);
  });

  it('matches everything for an empty query', () => {
    expect(matchesSearch(n, '   ')).toBe(true);
  });
});

describe('CATEGORIES', () => {
  it('has no prefix that maps to two places', () => {
    const seen = new Map<string, string>();
    for (const shelf of SHELVES) {
      const { aliases, types } = CATEGORIES[shelf];
      const words = [...aliases, ...Object.keys(types), ...Object.values(types).flat()];
      for (const w of words) {
        expect(seen.has(w), `"${w}" is in both ${seen.get(w)} and ${shelf}`).toBe(false);
        seen.set(w, shelf);
      }
    }
  });

  it('exposes canonical types per shelf', () => {
    expect(SHELF_TYPES.watch).toEqual(['movie', 'show', 'video']);
    expect(SHELF_TYPES.buy).toEqual([]);
  });
});
