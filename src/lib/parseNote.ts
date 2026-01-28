import { CATEGORIES, CategoryKey } from '@/types';

interface ParsedNote {
  category: CategoryKey;
  title: string;
  fields: Record<string, string>;
  hashTags: string[];
  notes: string;
  tags: string[];
}

// Find category from input text
function findCategory(text: string): { category: CategoryKey; remainder: string } {
  const colonIndex = text.indexOf(':');
  if (colonIndex === -1) {
    return { category: 'other', remainder: text.trim() };
  }

  const possibleCategory = text.slice(0, colonIndex).trim().toLowerCase();
  const remainder = text.slice(colonIndex + 1).trim();

  // Check each category's aliases
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (key === 'all') continue;

    if (cat.aliases.includes(possibleCategory)) {
      return { category: key as CategoryKey, remainder };
    }

    // Check subtypes
    if (cat.subtypes) {
      for (const [subtypeKey, subtype] of Object.entries(cat.subtypes)) {
        if (subtype.aliases.includes(possibleCategory)) {
          return { category: key as CategoryKey, remainder };
        }
      }
    }
  }

  // If no category match, treat whole text as content
  return { category: 'other', remainder: text.trim() };
}

// Extract hashtags from text
function extractHashtags(text: string): { hashTags: string[]; cleanText: string } {
  const hashTags: string[] = [];
  const cleanText = text.replace(/#(\w+)/g, (_, tag) => {
    hashTags.push(tag.toLowerCase());
    return '';
  }).trim();

  return { hashTags, cleanText };
}

// Extract key:value fields from text
function extractFields(text: string): { fields: Record<string, string>; cleanText: string } {
  const fields: Record<string, string> = {};

  // Match key:value patterns (not part of URLs)
  const cleanText = text.replace(/(?<![/:])(\w+):([^,\s][^,]*?)(?=,|$|\s+\w+:)/g, (match, key, value) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !key.match(/^https?$/i)) {
      fields[key.toLowerCase()] = trimmedValue;
      return '';
    }
    return match;
  }).trim();

  return { fields, cleanText };
}

export function parseNote(raw: string): ParsedNote {
  // Step 1: Find category
  const { category, remainder } = findCategory(raw);

  // Step 2: Extract hashtags
  const { hashTags, cleanText: textWithoutTags } = extractHashtags(remainder);

  // Step 3: Split by comma to get parts
  const parts = textWithoutTags.split(',').map(p => p.trim()).filter(Boolean);

  // Step 4: First part is usually the title
  const title = parts[0] || '';
  const restParts = parts.slice(1).join(', ');

  // Step 5: Extract fields from remaining parts
  const { fields, cleanText: notes } = extractFields(restParts);

  // Determine tags based on category and subtypes
  const tags: string[] = [category];

  // Check if any subtype matches
  const categoryData = CATEGORIES[category];
  if (categoryData.subtypes) {
    const inputLower = raw.toLowerCase();
    for (const [subtypeKey, subtype] of Object.entries(categoryData.subtypes)) {
      if (subtype.aliases.some(alias => inputLower.includes(alias))) {
        if (!tags.includes(subtypeKey)) {
          tags.push(subtypeKey);
        }
      }
    }
  }

  return {
    category,
    title,
    fields,
    hashTags,
    notes: notes.replace(/,\s*$/, '').trim(),
    tags
  };
}
