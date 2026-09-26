import { CategoryKey, NoteDraft } from '@/types';
import { lookupAlias } from './notes';

// Find category from input text
function findCategory(text: string): { category: CategoryKey; alias?: string; remainder: string } {
  const colonIndex = text.indexOf(':');
  if (colonIndex === -1) {
    return { category: 'other', remainder: text.trim() };
  }

  const possibleCategory = text.slice(0, colonIndex).trim().toLowerCase();
  const remainder = text.slice(colonIndex + 1).trim();

  const match = lookupAlias(possibleCategory);
  if (match) return { category: match.shelf, alias: match.type, remainder };

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

// Placeholder left where a #tag or @place was removed. It marks the end of the title.
const MARK = '\u0001';

// Extract hashtags, leaving a marker in their place
function extractHashtags(text: string): { hashTags: string[]; cleanText: string } {
  const hashTags: string[] = [];
  const cleanText = text.replace(/#(\w+)/g, (_, tag) => {
    hashTags.push(tag.toLowerCase());
    return MARK;
  });

  return { hashTags, cleanText };
}

// Extract the first @place. Matches the longest known location first (so "@chestnut hill"
// works); otherwise takes one word. "@" must start a word, so emails are left alone.
function extractLocation(text: string, knownLocations: string[]): { location: string | null; cleanText: string } {
  const match = text.match(/(^|\s)@([^,#@]*)/);
  if (!match || match.index === undefined) return { location: null, cleanText: text };

  const candidate = match[2];
  const lower = candidate.toLowerCase();
  let location = '';
  for (const known of knownLocations) {
    const k = known.toLowerCase().trim();
    const wholeWords = lower.length === k.length || /\s/.test(lower[k.length]);
    if (k.length > location.length && lower.startsWith(k) && wholeWords) {
      location = candidate.slice(0, k.length);
    }
  }
  if (!location) location = candidate.match(/^\S+/)?.[0] ?? '';
  if (!location) return { location: null, cleanText: text };

  const start = match.index + match[1].length;
  const end = start + 1 + location.length;
  return { location, cleanText: text.slice(0, start) + MARK + text.slice(end) };
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

// Returns true when input is essentially a bare URL (with optional shelf prefix / hashtags)
// Triggers the AI review flow instead of direct save.
// Examples that match: "https://example.com", "read: https://...", "https://... #news #tech"
// Examples that don't: "read: My Article, https://...", "book: The Hobbit"
export function isBareUrl(input: string): boolean {
  return /^([a-zA-Z]+:\s*)?https?:\/\/[^\s]+(\s+#[a-zA-Z0-9_]+)*\s*$/.test(input.trim());
}

// Typed text -> structured draft. type is the canonical type from the prefix ("film:" -> "movie").
// knownLocations lets "@chestnut hill" match a multi-word place already in use.
export function parseNote(raw: string, knownLocations: string[] = []): NoteDraft {
  // Step 1: Find category
  const { category, alias, remainder } = findCategory(raw);

  // Step 2: Extract URL (first, so a # inside a URL isn't read as a hashtag)
  const { url, cleanText: textWithoutUrl } = extractUrl(remainder);

  // Step 3: Extract @place and hashtags, leaving markers where they were
  const { location, cleanText: textWithoutLocation } = extractLocation(textWithoutUrl, knownLocations);
  const { hashTags, cleanText: marked } = extractHashtags(textWithoutLocation);

  // Step 4: The title ends at the first comma, #tag, or @place.
  // Tags placed before the title ("#scifi Dune") are skipped.
  const [head = '', ...tail] = marked.split(',');
  const headText = head.replace(new RegExp(`^[\\s${MARK}]+`), '');
  const markAt = headText.indexOf(MARK);
  const title = (markAt === -1 ? headText : headText.slice(0, markAt)).trim();
  const afterTitle = markAt === -1 ? '' : headText.slice(markAt);

  // Step 5: Everything after the title becomes fields and notes
  const rest = [afterTitle, ...tail]
    .map(p => p.replaceAll(MARK, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(', ');
  const { fields, cleanText: notes } = extractFields(rest);

  if (url) fields.url = url;
  if (location && !fields.location) fields.location = location;

  const draft: NoteDraft = {
    shelf: category,
    title,
    fields,
    hashTags,
    // Removing fields leaves orphan commas (", , great omakase") — drop empty segments
    notes: notes.split(',').map(p => p.trim()).filter(Boolean).join(', '),
  };
  if (alias) draft.type = alias;
  return draft;
}
