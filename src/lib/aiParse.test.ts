import { describe, it, expect } from 'vitest';
import { buildTextPrompt, readAiDraft } from './aiParse';

describe('buildTextPrompt', () => {
  it('includes the text and every shelf with its types', () => {
    const p = buildTextPrompt('carly wants a bop it');
    expect(p).toContain('carly wants a bop it');
    expect(p).toContain('- buy (types: gift)');
    expect(p).toContain('- other');
  });
});

describe('readAiDraft', () => {
  it('reads a clean reply', () => {
    const reply = '{"shelf":"read","type":"book","title":"The Sun Also Rises","notes":"Mike Broshi recommended","author":"Ernest Hemingway","location":"","cuisine":"","hashtags":["fiction"]}';
    expect(readAiDraft(reply)).toEqual({
      shelf: 'read',
      type: 'book',
      title: 'The Sun Also Rises',
      notes: 'Mike Broshi recommended',
      fields: { author: 'Ernest Hemingway' },
      hashtags: ['fiction'],
    });
  });

  it('tolerates text around the JSON', () => {
    expect(readAiDraft('Here you go: {"shelf":"watch","title":"Oppenheimer"}')?.title).toBe('Oppenheimer');
  });

  it('keeps only fields that belong to the shelf', () => {
    const d = readAiDraft('{"shelf":"read","title":"X","author":"A","location":"Newton","cuisine":"thai"}');
    expect(d?.fields).toEqual({ author: 'A' });
  });

  it('drops a type from another shelf and normalizes synonyms', () => {
    expect(readAiDraft('{"shelf":"read","type":"movie","title":"X"}')?.type).toBe('');
    expect(readAiDraft('{"shelf":"watch","type":"film","title":"X"}')?.type).toBe('movie');
  });

  it('strips the home state from location', () => {
    expect(readAiDraft('{"shelf":"eat","title":"X","location":"Needham MA"}')?.fields).toEqual({ location: 'Needham' });
  });

  it('falls back to other for an unknown shelf', () => {
    expect(readAiDraft('{"shelf":"listen","title":"X"}')?.shelf).toBe('other');
  });

  it('returns null for no or broken JSON', () => {
    expect(readAiDraft('sorry')).toBeNull();
    expect(readAiDraft('{"shelf":')).toBeNull();
  });
});
