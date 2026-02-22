// Note type matching the Supabase schema
export interface Note {
  id: string;
  userId: string;
  tags: string[];
  hashTags: string[];
  fields: Record<string, string>;
  title: string;
  notes: string;
  raw: string;
  timestamp: number;
  createdAt?: string;
}

// Category definitions
export type CategoryKey = 'read' | 'watch' | 'eat' | 'do' | 'buy' | 'other';

export interface Category {
  name: string;
  aliases: string[];
}

export const CATEGORIES: Record<CategoryKey | 'all', Category> = {
  all: { name: 'All', aliases: [] },
  read: { name: 'Read', aliases: ['read', 'book', 'books', 'article', 'articles', 'link', 'links'] },
  watch: { name: 'Watch', aliases: ['watch', 'movie', 'movies', 'film', 'films', 'show', 'shows', 'tv', 'series', 'youtube', 'video', 'videos'] },
  eat: { name: 'Eat', aliases: ['eat', 'restaurant', 'restaurants', 'drink', 'drinks', 'beer', 'wine', 'cocktail', 'cafe', 'bar', 'food'] },
  do: { name: 'Do', aliases: ['do', 'activity', 'activities', 'event', 'events', 'hike', 'hiking', 'trail', 'concert', 'gig', 'festival', 'museum', 'gallery', 'theater', 'theatre'] },
  buy: { name: 'Buy', aliases: ['buy', 'shop', 'shopping', 'want'] },
  other: { name: 'Other', aliases: [] },
};

// User type
export interface User {
  uid: string;
  email: string | null;
}
