// A note as stored in Firestore
export interface Note {
  id: string;
  userId: string;
  shelf?: CategoryKey;     // set on every note since the F3 migration (2026-09-26)
  tags: string[];          // legacy: [shelf]; still written for rollback safety, to be removed
  hashTags: string[];
  fields: Record<string, string>;
  title: string;
  notes: string;
  raw: string;             // original input at creation; never updated, not searched
  timestamp: number;       // created, ms
  updatedAt?: number;      // ms
  createdAt?: string;      // legacy (Supabase import)
  done?: boolean;
  type?: string;           // canonical type within the shelf ("book", "cafe")
}

// The editable content of a note. Every screen builds one of these; useNotes saves it.
export interface NoteDraft {
  shelf: CategoryKey;
  type?: string;
  title: string;
  notes: string;
  fields: Record<string, string>;
  hashTags: string[];
}

// Category definitions
export type CategoryKey = 'read' | 'watch' | 'eat' | 'do' | 'buy' | 'other';

export interface Category {
  name: string;
  aliases: string[];               // prefixes that file to this shelf with no specific type
  types: Record<string, string[]>; // canonical type → synonyms that also select it
}

// Single source for shelves, types, and the prefixes the parser accepts.
// Typing a synonym ("film:") stores the canonical type ("movie").
export const CATEGORIES: Record<CategoryKey | 'all', Category> = {
  all: { name: 'All', aliases: [], types: {} },
  read: {
    name: 'Read',
    aliases: ['read'],
    types: { book: ['books'], article: ['articles'], link: ['links'] },
  },
  watch: {
    name: 'Watch',
    aliases: ['watch'],
    types: { movie: ['movies', 'film', 'films'], show: ['shows', 'tv', 'series'], video: ['videos', 'youtube'] },
  },
  eat: {
    name: 'Eat',
    aliases: ['eat', 'food'],
    types: { restaurant: ['restaurants'], cafe: [], bar: [], drink: ['drinks', 'beer', 'wine', 'cocktail'] },
  },
  do: {
    name: 'Do',
    aliases: ['do'],
    types: {
      activity: ['activities'],
      event: ['events', 'festival', 'theater', 'theatre'],
      concert: ['gig'],
      hike: ['hiking', 'trail'],
      museum: ['gallery'],
    },
  },
  buy: { name: 'Buy', aliases: ['buy', 'shop', 'shopping', 'want'], types: { gift: ['gifts'] } },
  other: { name: 'Other', aliases: [], types: {} },
};

// User type
export interface User {
  uid: string;
  email: string | null;
}
