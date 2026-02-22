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
  }

  // If no category match, treat whole text as content
  return { category: 'other', remainder: text.trim() };
}

// Extract a URL from text
function extractUrl(text: string): { url: string | null; cleanText: string } {
  const match = text.match(/https?:\/\/[^\s,]+/);
  if (!match) return { url: null, cleanText: text };
  const url = match[0].replace(/[.,;)]+$/, ''); // trim trailing punctuation
  const cleanText = text.replace(match[0], '').replace(/,\s*,/g, ',').trim();
  return { url, cleanText };
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

  // Step 2: Extract URL
  const { url, cleanText: textWithoutUrl } = extractUrl(remainder);

  // Step 3: Extract hashtags
  const { hashTags, cleanText: textWithoutTags } = extractHashtags(textWithoutUrl);

  // Step 4: Split by comma to get parts
  const parts = textWithoutTags.split(',').map(p => p.trim()).filter(Boolean);

  // Step 5: First part is usually the title
  const title = parts[0] || '';
  const restParts = parts.slice(1).join(', ');

  // Step 6: Extract fields from remaining parts
  const { fields, cleanText: notes } = extractFields(restParts);

  if (url) fields.url = url;

  return {
    category,
    title,
    fields,
    hashTags,
    notes: notes.replace(/,\s*$/, '').trim(),
    tags: [category]
  };
}
