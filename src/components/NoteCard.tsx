'use client';

import { Note, CATEGORIES } from '@/types';
import { CategoryIcon, EditIcon, TrashIcon, ExternalLinkIcon, CheckCircleIcon } from './Icons';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  onToggleDone?: (id: string, done: boolean) => void;
  compact?: boolean;
}

const KNOWN_CATEGORIES = new Set(['read', 'watch', 'eat', 'do', 'buy', 'other']);
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  book: 'read', movie: 'watch', show: 'watch',
  restaurant: 'eat', drink: 'eat', activity: 'do',
};

function resolveCategory(note: Note): string {
  const tag = note.tags?.[0];
  if (!tag) return 'other';
  if (KNOWN_CATEGORIES.has(tag)) return tag;
  return LEGACY_CATEGORY_MAP[tag] || 'other';
}

// Returns the specific type label to show in the chip (e.g. "book", "article", "movie")
// Falls back to null when no subtype is known — caller uses shelf name instead.
function resolveDisplayType(note: Note): string | null {
  if (note.type) return note.type;
  const tag = note.tags?.[0];
  if (tag && !KNOWN_CATEGORIES.has(tag)) return tag; // legacy note: tags[0] is the alias
  return null;
}

const CATEGORY_ACCENT: Record<string, string> = {
  read: 'border-l-amber-500 dark:border-l-amber-400',
  watch: 'border-l-violet-500 dark:border-l-violet-400',
  eat: 'border-l-orange-500 dark:border-l-orange-400',
  do: 'border-l-emerald-500 dark:border-l-emerald-400',
  buy: 'border-l-sky-500 dark:border-l-sky-400',
  other: 'border-l-indigo-400 dark:border-l-indigo-500',
};

const CATEGORY_BADGE: Record<string, string> = {
  read: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  watch: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  eat: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  do: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  buy: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  other: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function NoteCard({ note, onEdit, onDelete, onToggleDone, compact }: NoteCardProps) {
  const category = resolveCategory(note);
  const categoryData = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.other;
  const accentClass = CATEGORY_ACCENT[category] || CATEGORY_ACCENT.other;
  const badgeClass = CATEGORY_BADGE[category] || CATEGORY_BADGE.other;
  const displayType = resolveDisplayType(note);
  const chipLabel = displayType
    ? displayType.charAt(0).toUpperCase() + displayType.slice(1)
    : categoryData.name;

  if (compact) {
    return (
      <div
        onClick={() => onEdit?.(note)}
        className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 border-l-[3px] ${accentClass} cursor-pointer transition-all hover:shadow-md ${note.done ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleDone?.(note.id, !note.done); }}
            className={`shrink-0 transition-colors ${note.done ? 'text-emerald-500 hover:text-zinc-400 dark:hover:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-emerald-500 dark:hover:text-emerald-400'}`}
            title={note.done ? 'Mark active' : 'Mark done'}
          >
            <CheckCircleIcon className="w-3.5 h-3.5" />
          </button>
          <CategoryIcon category={category} className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className={`font-medium font-serif text-sm text-zinc-900 dark:text-zinc-50 capitalize truncate ${note.done ? 'line-through' : ''}`}>
            {note.title}
          </span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
            {chipLabel}
          </span>
          {note.hashTags.length > 0 && (
            <span className="text-[11px] text-teal-500 dark:text-teal-400 truncate hidden sm:inline">
              #{note.hashTags[0]}{note.hashTags.length > 1 && ` +${note.hashTags.length - 1}`}
            </span>
          )}
          {note.fields.url && (
            <a
              href={note.fields.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto shrink-0 text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
              title={note.fields.url}
            >
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
          )}
          <span className={`text-[11px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap tabular-nums shrink-0 ${note.fields.url ? '' : 'ml-auto'}`}>
            {formatRelativeTime(note.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 border-l-[3px] ${accentClass} transition-all hover:shadow-md ${note.done ? 'opacity-60' : ''}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryIcon category={category} className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h3 className={`font-semibold font-serif text-zinc-900 dark:text-zinc-50 capitalize ${note.done ? 'line-through' : ''}`}>
              {note.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
              {chipLabel}
            </span>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap tabular-nums">
            {formatRelativeTime(note.timestamp)}
          </span>
        </div>

        {/* URL */}
        {note.fields.url && (
          <a
            href={note.fields.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors mb-2"
          >
            <ExternalLinkIcon className="w-3 h-3" />
            {extractDomain(note.fields.url)}
          </a>
        )}

        {/* Fields */}
        {Object.keys(note.fields).filter(k => k !== 'url').length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Object.entries(note.fields).filter(([key]) => key !== 'url').map(([key, value]) => (
              <span
                key={key}
                className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                <span className="font-medium text-zinc-500 dark:text-zinc-400">{key}:</span> {value}
              </span>
            ))}
          </div>
        )}

        {/* Hashtags */}
        {note.hashTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {note.hashTags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Notes text */}
        {note.notes && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
            {note.notes}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => onToggleDone?.(note.id, !note.done)}
            className={`flex items-center gap-1 text-xs transition-colors ${note.done ? 'text-emerald-500 hover:text-zinc-400 dark:hover:text-zinc-500' : 'text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
          >
            <CheckCircleIcon className="w-3 h-3" />
            {note.done ? 'Restore' : 'Done'}
          </button>
          <button
            onClick={() => onEdit?.(note)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <EditIcon className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => onDelete?.(note.id)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <TrashIcon className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
