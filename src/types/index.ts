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
export type CategoryKey = 'book' | 'movie' | 'show' | 'restaurant' | 'drink' | 'activity' | 'other';

export interface Subtype {
  name: string;
  icon: string;
  aliases: string[];
}

export interface Category {
  name: string;
  icon: string;
  aliases: string[];
  subtypes?: Record<string, Subtype>;
}

export const CATEGORIES: Record<CategoryKey | 'all', Category> = {
  all: { name: 'All', icon: '📋', aliases: [] },
  book: { name: 'Books', icon: '📚', aliases: ['book', 'books'] },
  movie: { name: 'Movies', icon: '🎬', aliases: ['movie', 'movies', 'film', 'films'] },
  show: { name: 'Shows', icon: '📺', aliases: ['show', 'shows', 'tv', 'series'] },
  restaurant: { name: 'Restaurants', icon: '🍽️', aliases: ['restaurant', 'restaurants'] },
  drink: {
    name: 'Drinks',
    icon: '🍹',
    aliases: ['drink', 'drinks'],
    subtypes: {
      beer: { name: 'Beer', icon: '🍺', aliases: ['beer', 'ipa', 'lager', 'ale', 'stout', 'porter'] },
      wine: { name: 'Wine', icon: '🍷', aliases: ['wine', 'red', 'white', 'rosé', 'champagne'] },
      cocktail: { name: 'Cocktail', icon: '🍸', aliases: ['cocktail', 'mixed drink', 'martini'] }
    }
  },
  activity: {
    name: 'Activities',
    icon: '🎯',
    aliases: ['activity', 'activities', 'event'],
    subtypes: {
      hike: { name: 'Hike', icon: '🥾', aliases: ['hike', 'hiking', 'trail'] },
      concert: { name: 'Concert', icon: '🎸', aliases: ['concert', 'show', 'gig', 'festival'] },
      museum: { name: 'Museum', icon: '🏛️', aliases: ['museum', 'gallery', 'exhibit'] },
      theater: { name: 'Theater', icon: '🎭', aliases: ['theater', 'theatre', 'play'] }
    }
  },
  other: { name: 'Other', icon: '📝', aliases: [] }
};

// User type
export interface User {
  uid: string;
  email: string | null;
}
