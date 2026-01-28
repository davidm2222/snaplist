'use client';

import { Note, CATEGORIES } from '@/types';

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (id: string) => void;
}

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

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const category = note.tags[0] || 'other';
  const categoryData = CATEGORIES[category as keyof typeof CATEGORIES] || CATEGORIES.other;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{categoryData.icon}</span>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
            {note.title}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
            {categoryData.name}
          </span>
        </div>
        <span className="text-xs text-zinc-400 whitespace-nowrap">
          {formatRelativeTime(note.timestamp)}
        </span>
      </div>

      {/* Fields */}
      {Object.keys(note.fields).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.entries(note.fields).map(([key, value]) => (
            <span
              key={key}
              className="text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <span className="font-medium">{key}:</span> {value}
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
              className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes text */}
      {note.notes && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
          {note.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => onEdit?.(note)}
          className="text-xs text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete?.(note.id)}
          className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
