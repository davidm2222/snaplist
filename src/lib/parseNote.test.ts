import { describe, it, expect } from 'vitest';
import { parseNote, isBareUrl } from './parseNote';

describe('parseNote — shelf and type', () => {
  it('uses the shelf name directly, with no type', () => {
    const r = parseNote('eat: Nobu');
    expect(r.category).toBe('eat');
    expect(r.type).toBeUndefined();
    expect(r.tags).toEqual(['eat']);
  });

  it('maps an alias to its shelf and keeps it as the type', () => {
    const r = parseNote('book: The Hobbit');
    expect(r.category).toBe('read');
    expect(r.type).toBe('book');
  });

  it('is case-insensitive on the prefix', () => {
    expect(parseNote('Movie: Dune').category).toBe('watch');
  });

  it('falls back to other when there is no prefix', () => {
    const r = parseNote('Some random thing');
    expect(r.category).toBe('other');
    expect(r.title).toBe('Some random thing');
  });

  it('falls back to other when the prefix is not a known alias', () => {
    const r = parseNote('podcast: Hardcore History');
    expect(r.category).toBe('other');
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
      category: 'eat',
      title: 'Coco Ramen',
      fields: { location: 'Newton Centre MA', url: 'https://maps.app.goo.gl/abc?g_st=ac' },
      notes: 'great tonkotsu',
      hashTags: ['ramen'],
    });
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
