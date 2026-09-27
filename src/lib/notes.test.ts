import { describe, it, expect } from 'vitest';
import type { Note } from '@/types';
import { CATEGORIES } from '@/types';
import {
  SHELVES, SHELF_TYPES, isShelf, lookupAlias, resolveShelf, resolveType, matchesSearch, normalizeDraft,
  stripHomeState, locationKey, formatLocation, knownLocations, DONE_LABELS, isFinished, groupByPlace,
} from './notes';

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
  it('prefers the explicit shelf field', () => {
    expect(resolveShelf(note({ shelf: 'buy', tags: ['gift'] }))).toBe('buy');
  });

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

  it('matches shelf and type names', () => {
    expect(matchesSearch(note({ shelf: 'watch', type: 'film', title: 'Dune' }), 'movie')).toBe(true);
    expect(matchesSearch(note({ shelf: 'watch', title: 'Dune' }), 'watch dune')).toBe(true);
  });

  it('ignores stale raw text', () => {
    expect(matchesSearch(note({ title: 'Nobu Downtown', raw: 'eat: Nobu Uptown' }), 'uptown')).toBe(false);
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
    expect(SHELF_TYPES.buy).toEqual(['gift']);
    expect(SHELF_TYPES.other).toEqual([]);
  });
});

describe('normalizeDraft', () => {
  it('cleans every part of a draft', () => {
    expect(normalizeDraft({
      shelf: 'watch',
      type: 'Film',
      title: '  Dune ',
      notes: ', , loved it, ',
      fields: { ' Author ': ' Herbert ', empty: '  ', '': 'x' },
      hashTags: ['#SciFi', 'scifi', ' epic '],
    })).toEqual({
      shelf: 'watch',
      type: 'movie',
      title: 'Dune',
      notes: 'loved it',
      fields: { author: 'Herbert' },
      hashTags: ['scifi', 'epic'],
    });
  });

  it('omits an empty type', () => {
    expect(normalizeDraft({ shelf: 'eat', type: '', title: 'x', notes: '', fields: {}, hashTags: [] }))
      .not.toHaveProperty('type');
  });

  it('keeps commas inside field values (no re-parse on save)', () => {
    const d = normalizeDraft({ shelf: 'eat', title: 'x', notes: '', fields: { location: 'Portland, ME' }, hashTags: [] });
    expect(d.fields.location).toBe('Portland, ME');
  });
});

describe('locations', () => {
  it('strips the home state', () => {
    expect(stripHomeState('Newton MA')).toBe('Newton');
    expect(stripHomeState('Newton, MA')).toBe('Newton');
    expect(stripHomeState('chestnut hill ma')).toBe('chestnut hill');
    expect(stripHomeState('cabot VT')).toBe('cabot VT');
    expect(stripHomeState('MA')).toBe('MA');
  });

  it('treats case, spacing, and home state as the same place', () => {
    expect(locationKey('Newton MA')).toBe('newton');
    expect(locationKey(' NEWTON ')).toBe('newton');
    expect(locationKey('chestnut  hill')).toBe('chestnut hill');
  });

  it('formats for display', () => {
    expect(formatLocation('chestnut hill')).toBe('Chestnut Hill');
    expect(formatLocation('cabot vt')).toBe('Cabot VT');
    expect(formatLocation('Newton MA')).toBe('Newton');
    expect(formatLocation('DC')).toBe('DC');
    expect(formatLocation('cape cod')).toBe('Cape Cod');
  });

  it('lists distinct places, most used first', () => {
    const notes = [
      { fields: { location: 'newton' } },
      { fields: { location: 'Newton MA' } },
      { fields: { location: 'needham' } },
      { fields: {} },
    ];
    expect(knownLocations(notes)).toEqual(['newton', 'needham']);
  });

  it('strips the home state when saving', () => {
    const d = normalizeDraft({ shelf: 'eat', title: 'x', notes: '', fields: { location: 'Needham MA' }, hashTags: [] });
    expect(d.fields.location).toBe('Needham');
  });
});

describe('isFinished', () => {
  it('is false for active notes', () => {
    expect(isFinished(note({ shelf: 'read' }))).toBe(false);
    expect(isFinished(note({ shelf: 'read', done: false }))).toBe(false);
  });

  it('is true for done notes on Read / Watch / Buy / Other', () => {
    for (const shelf of ['read', 'watch', 'buy', 'other'] as const) {
      expect(isFinished(note({ shelf, done: true }))).toBe(true);
    }
  });

  it('keeps done Eat / Do notes in the list ("been there")', () => {
    expect(isFinished(note({ shelf: 'eat', done: true }))).toBe(false);
    expect(isFinished(note({ shelf: 'do', done: true }))).toBe(false);
  });

  it('uses the legacy tags fallback for the shelf', () => {
    expect(isFinished(note({ tags: ['eat'], done: true }))).toBe(false);
    expect(isFinished(note({ tags: ['book'], done: true }))).toBe(true);
  });
});

describe('DONE_LABELS', () => {
  it('has a label for every shelf', () => {
    for (const shelf of SHELVES) expect(DONE_LABELS[shelf]).toBeTruthy();
  });
});

describe('groupByPlace', () => {
  const at = (id: string, location?: string) => note({ id, fields: location ? { location } : {} });

  it('groups by place, biggest first, ties alphabetical, no place last', () => {
    const groups = groupByPlace([at('1', 'newton'), at('2'), at('3', 'needham'), at('4', 'Newton MA'), at('5', 'boston')]);
    expect(groups.map(g => [g.label, g.notes.map(n => n.id)])).toEqual([
      ['Newton', ['1', '4']],
      ['Boston', ['5']],
      ['Needham', ['3']],
      ['No place', ['2']],
    ]);
  });

  it('keeps state suffixes in the label', () => {
    expect(groupByPlace([at('1', 'cabot vt')])[0].label).toBe('Cabot VT');
  });

  it('omits the No place group when every note has one', () => {
    expect(groupByPlace([at('1', 'newton')]).map(g => g.label)).toEqual(['Newton']);
  });
});
