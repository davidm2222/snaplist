'use client';

import { Note, CATEGORIES } from '@/types';
import { CategoryIcon, EditIcon, TrashIcon } from './Icons';

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const CATEGORY_ACCENT: Record<string, string> = {
  book: 'border-l-amber-500',
  movie: 'border-l-rose-500',
  show: 'border-l-sky-500',
  restaurant: 'border-l-orange-500',
  drink: 'border-l-teal-500',
  activity: 'border-l-emerald-500',
  other: 'border-l-indigo-400 dark:border-l-indigo-500',
};

const CATEGORY_BADGE: Record<string, string> = {
  book: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  movie: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  show: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  restaurant: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  drink: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  activity: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
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

export function NoteCard({ note, onEdit, onDelete, compact }: NoteCardProps) {
  const category = note.tags[0] || 'other';
  const categoryData = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.other;
  const accentClass = CATEGORY_ACCENT[category] || CATEGORY_ACCENT.other;
  const badgeClass = CATEGORY_BADGE[category] || CATEGORY_BADGE.other;

  if (compact) {
    return (
      <div
        onClick={() => onEdit?.(note)}
        className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 border-l-[3px] ${accentClass} cursor-pointer transition-all hover:shadow-md`}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <CategoryIcon category={category} className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="font-medium font-serif text-sm text-zinc-900 dark:text-zinc-50 capitalize truncate">
            {note.title}
          </span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
            {categoryData.name}
          </span>
          {note.hashTags.length > 0 && (
            <span className="text-[11px] text-teal-500 dark:text-teal-400 truncate hidden sm:inline">
              #{note.hashTags[0]}{note.hashTags.length > 1 && ` +${note.hashTags.length - 1}`}
            </span>
          )}
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap tabular-nums ml-auto shrink-0">
            {formatRelativeTime(note.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 border-l-[3px] ${accentClass} transition-all hover:shadow-md`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryIcon category={category} className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h3 className="font-semibold font-serif text-zinc-900 dark:text-zinc-50 capitalize">
              {note.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
              {categoryData.name}
            </span>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap tabular-nums">
            {formatRelativeTime(note.timestamp)}
          </span>
        </div>

        {/* Fields */}
        {Object.keys(note.fields).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {Object.entries(note.fields).map(([key, value]) => (
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
