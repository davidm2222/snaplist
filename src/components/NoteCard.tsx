'use client';

import { Note, CATEGORIES } from '@/types';
import { resolveShelf, resolveType, formatLocation } from '@/lib/notes';
import { CategoryIcon, EditIcon, TrashIcon, ExternalLinkIcon, CheckCircleIcon, MapPinIcon } from './Icons';

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
  expanded?: boolean;
  onToggleExpand?: () => void;
}

// Notes saved before the parser fix can carry orphan commas (", , great omakase")
function cleanNotes(notes: string | undefined): string {
  return (notes ?? '').split(',').map(p => p.trim()).filter(Boolean).join(', ');
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

export function NoteCard({ note, onEdit, onDelete, onToggleDone, expanded, onToggleExpand }: NoteCardProps) {
  const category = resolveShelf(note);
  const categoryData = CATEGORIES[category];
  const accentClass = CATEGORY_ACCENT[category] || CATEGORY_ACCENT.other;
  const badgeClass = CATEGORY_BADGE[category] || CATEGORY_BADGE.other;
  const displayType = resolveType(note);
  const chipLabel = displayType
    ? displayType.charAt(0).toUpperCase() + displayType.slice(1)
    : categoryData.name;
  // url and location have their own display; the rest render as generic chips
  const otherFields = Object.entries(note.fields).filter(([key]) => key !== 'url' && key !== 'location');

  const notesText = cleanNotes(note.notes);

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 border-l-[3px] ${accentClass} transition-all ${expanded ? 'shadow-md' : 'hover:shadow-md'} ${note.done ? 'opacity-50' : ''}`}
    >
      {/* Row: always visible, tap to expand */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={!!expanded}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onToggleExpand?.();
          }
        }}
        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
      >
        <CategoryIcon category={category} className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
        <span className={`font-medium font-serif text-sm text-zinc-900 dark:text-zinc-50 ${expanded ? '' : 'truncate'} ${note.done ? 'line-through' : ''}`}>
          {note.title}
        </span>
        <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
          {chipLabel}
        </span>
        {note.fields.location && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
            <MapPinIcon className="w-3 h-3" />
            {formatLocation(note.fields.location)}
          </span>
        )}
        {!expanded && note.hashTags.length > 0 && (
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

      {/* Details: shown in place when expanded */}
      {expanded && (
        <div className="px-3 pb-3 pl-8 space-y-2">
          {note.fields.url && (
            <a
              href={note.fields.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <ExternalLinkIcon className="w-3 h-3" />
              {extractDomain(note.fields.url)}
            </a>
          )}

          {otherFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {otherFields.map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  <span className="font-medium text-zinc-500 dark:text-zinc-400">{key}:</span> {value}
                </span>
              ))}
            </div>
          )}

          {note.hashTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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

          {notesText && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {notesText}
            </p>
          )}

          <div className="flex gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
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
      )}
    </div>
  );
}
