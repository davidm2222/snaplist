import { describe, it, expect } from 'vitest';
import { parseNote, isBareUrl, hasKnownPrefix } from './parseNote';

describe('parseNote — shelf and type', () => {
  it('uses the shelf name directly, with no type', () => {
    const r = parseNote('eat: Nobu');
    expect(r.shelf).toBe('eat');
    expect(r.type).toBeUndefined();
  });

  it('maps an alias to its shelf and keeps it as the type', () => {
    const r = parseNote('book: The Hobbit');
    expect(r.shelf).toBe('read');
    expect(r.type).toBe('book');
  });

  it('stores the canonical type for synonyms', () => {
    expect(parseNote('film: Dune')).toMatchObject({ shelf: 'watch', type: 'movie' });
    expect(parseNote('tv: Severance')).toMatchObject({ shelf: 'watch', type: 'show' });
    expect(parseNote('beer: Heady Topper')).toMatchObject({ shelf: 'eat', type: 'drink' });
    expect(parseNote('books: Dune')).toMatchObject({ shelf: 'read', type: 'book' });
  });

  it('files shelf aliases with no type', () => {
    const r = parseNote('food: Tacos');
    expect(r.shelf).toBe('eat');
    expect(r.type).toBeUndefined();
  });

  it('is case-insensitive on the prefix', () => {
    expect(parseNote('Movie: Dune').shelf).toBe('watch');
  });

  it('falls back to other when there is no prefix', () => {
    const r = parseNote('Some random thing');
    expect(r.shelf).toBe('other');
    expect(r.title).toBe('Some random thing');
  });

  it('falls back to other when the prefix is not a known alias', () => {
    const r = parseNote('podcast: Hardcore History');
    expect(r.shelf).toBe('other');
    expect(r.title).toBe('podcast: Hardcore History');
  });
});

describe('parseNote — title, fields, notes', () => {
  it('parses fields after the title', () => {
    const r = parseNote('book: The Hobbit, author:Tolkien');
    expect(r.title).toBe('The Hobbit');
    expect(r.fields).toEqual({ author: 'Tolkien' });
    expect(r.notes).toBe('');
  });

  it('lowercases field keys and allows spaces in values', () => {
    const r = parseNote('eat: Coco Ramen, Location:Newton Centre MA');
    expect(r.fields).toEqual({ location: 'Newton Centre MA' });
  });

  it('puts leftover text into notes', () => {
    const r = parseNote('eat: Nobu, great omakase');
    expect(r.notes).toBe('great omakase');
  });

  it('does not leave orphan commas in notes when fields are removed', () => {
    const r = parseNote('eat: Nobu, city:NYC, rating:5, great omakase, go early');
    expect(r.fields).toEqual({ city: 'NYC', rating: '5' });
    expect(r.notes).toBe('great omakase, go early');
  });

  it('handles notes before and after fields', () => {
    const r = parseNote('read: Dune, loved it, author:Herbert');
    expect(r.fields).toEqual({ author: 'Herbert' });
    expect(r.notes).toBe('loved it');
  });
});

describe('parseNote — hashtags and URLs', () => {
  it('extracts lowercase hashtags from anywhere', () => {
    const r = parseNote('watch: Severance #Thriller #apple');
    expect(r.title).toBe('Severance');
    expect(r.hashTags).toEqual(['thriller', 'apple']);
  });

  it('moves a URL into fields.url and out of the title', () => {
    const r = parseNote('buy: Aeron chair https://hermanmiller.com/aeron');
    expect(r.title).toBe('Aeron chair');
    expect(r.fields.url).toBe('https://hermanmiller.com/aeron');
  });

  it('trims trailing punctuation from URLs', () => {
    expect(parseNote('read: see https://example.com/a.').fields.url).toBe('https://example.com/a');
  });

  it('does not treat https: as a field', () => {
    const r = parseNote('read: Article, https://example.com/x');
    expect(Object.keys(r.fields)).toEqual(['url']);
  });

  it('round-trips the review-modal string format', () => {
    const r = parseNote(
      'eat: Coco Ramen, location:Newton Centre MA, great tonkotsu #ramen https://maps.app.goo.gl/abc?g_st=ac'
    );
    expect(r).toMatchObject({
      shelf: 'eat',
      title: 'Coco Ramen',
      fields: { location: 'Newton Centre MA', url: 'https://maps.app.goo.gl/abc?g_st=ac' },
      notes: 'great tonkotsu',
      hashTags: ['ramen'],
    });
  });
});

describe('parseNote — #tags and @place end the title', () => {
  it('ends the title at a hashtag with no comma', () => {
    const r = parseNote('eat: sichuan gourmet #spicy food was really good');
    expect(r.title).toBe('sichuan gourmet');
    expect(r.hashTags).toEqual(['spicy']);
    expect(r.notes).toBe('food was really good');
  });

  it('skips hashtags placed before the title', () => {
    const r = parseNote('read: #scifi Dune #great loved it');
    expect(r.title).toBe('Dune');
    expect(r.hashTags).toEqual(['scifi', 'great']);
    expect(r.notes).toBe('loved it');
  });

  it('takes one word after @ when the place is unknown', () => {
    const r = parseNote('eat: sichuan gourmet @needham food was really good');
    expect(r).toMatchObject({
      title: 'sichuan gourmet',
      fields: { location: 'needham' },
      notes: 'food was really good',
    });
  });

  it('matches a known multi-word place', () => {
    const r = parseNote('eat: Tatte @chestnut hill great pastries', ['newton', 'chestnut hill']);
    expect(r.fields.location).toBe('chestnut hill');
    expect(r.notes).toBe('great pastries');
  });

  it('prefers the longest known match', () => {
    const r = parseNote('do: walk @newton centre', ['newton', 'newton centre']);
    expect(r.fields.location).toBe('newton centre');
  });

  it('does not match a known place that is only the start of a word', () => {
    const r = parseNote('eat: Tatte @newtonville', ['newton']);
    expect(r.fields.location).toBe('newtonville');
  });

  it('takes only one word for an unknown place, even before a comma', () => {
    const r = parseNote('eat: Tatte @needham food was great, loved it');
    expect(r.fields.location).toBe('needham');
    expect(r.notes).toBe('food was great, loved it');
  });

  it('handles @place and hashtags together', () => {
    const r = parseNote('eat: sichuan gourmet #spicy @needham food was great #datenight');
    expect(r).toMatchObject({
      title: 'sichuan gourmet',
      hashTags: ['spicy', 'datenight'],
      fields: { location: 'needham' },
      notes: 'food was great',
    });
  });

  it('lets an explicit location: field win over @', () => {
    expect(parseNote('eat: Nobu @nyc, location:Boston').fields.location).toBe('Boston');
  });

  it('leaves email addresses alone', () => {
    const r = parseNote('ask sam@example.com about it');
    expect(r.title).toBe('ask sam@example.com about it');
    expect(r.fields.location).toBeUndefined();
  });

  it('ignores a bare @', () => {
    expect(parseNote('eat: Nobu @, great').fields.location).toBeUndefined();
  });

  it('does not treat # inside a URL as a hashtag', () => {
    const r = parseNote('read: Guide https://example.com/page#section');
    expect(r.hashTags).toEqual([]);
    expect(r.fields.url).toBe('https://example.com/page#section');
  });
});

describe('isBareUrl', () => {
  it.each([
    'https://example.com',
    'read: https://example.com/a',
    'https://example.com #news #tech',
  ])('true for %s', (s) => expect(isBareUrl(s)).toBe(true));

  it.each([
    'read: My Article, https://example.com',
    'book: The Hobbit',
  ])('false for %s', (s) => expect(isBareUrl(s)).toBe(false));
});

describe('hasKnownPrefix', () => {
  it.each(['eat: Nobu', 'Book: Dune', 'film: Heat', 'read:x'])('prefixed: %j', (t) =>
    expect(hasKnownPrefix(t)).toBe(true)
  );

  it.each(['le petit four in wellesley', 'note: call mom', 'https://example.com', ': nothing'])('not prefixed: %j', (t) =>
    expect(hasKnownPrefix(t)).toBe(false)
  );
});
