import { describe, it, expect } from 'vitest';
import { planShelfMigration } from './migrateNote';

const base = { timestamp: 1000 };

describe('planShelfMigration', () => {
  it('copies a current shelf out of tags', () => {
    expect(planShelfMigration({ ...base, tags: ['eat'] })).toEqual({ shelf: 'eat', updatedAt: 1000 });
  });

  it('resolves legacy tags into shelf + type', () => {
    expect(planShelfMigration({ ...base, tags: ['book'] }))
      .toEqual({ shelf: 'read', type: 'book', updatedAt: 1000 });
    expect(planShelfMigration({ ...base, tags: ['drink'] }))
      .toEqual({ shelf: 'eat', type: 'drink', updatedAt: 1000 });
  });

  it('canonicalizes stored synonym types', () => {
    expect(planShelfMigration({ ...base, tags: ['eat'], type: 'beer' }))
      .toEqual({ shelf: 'eat', type: 'drink', updatedAt: 1000 });
  });

  it('keeps an already-canonical type', () => {
    expect(planShelfMigration({ ...base, tags: ['read'], type: 'article' }))
      .toEqual({ shelf: 'read', updatedAt: 1000 });
  });

  it('files unknown tags under other', () => {
    expect(planShelfMigration({ ...base, tags: [] })).toEqual({ shelf: 'other', updatedAt: 1000 });
  });

  it('is idempotent — a migrated note needs no changes', () => {
    const migrated = { ...base, tags: ['book'], shelf: 'read', type: 'book', updatedAt: 1000 };
    expect(planShelfMigration(migrated)).toEqual({});
  });
});
