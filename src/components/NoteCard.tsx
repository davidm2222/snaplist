'use client';

import { Note, CATEGORIES } from '@/types';
import { resolveShelf, resolveType, formatLocation, DONE_LABELS, doneStaysInList } from '@/lib/notes';
import { EditIcon, TrashIcon, ExternalLinkIcon, CheckIcon } from './Icons';

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
  const displayType = resolveType(note);
  const typeLabel = displayType
    ? displayType.charAt(0).toUpperCase() + displayType.slice(1)
    : CATEGORIES[category].name;
  const place = note.fields.location ? formatLocation(note.fields.location) : '';
  // url and location have their own display; the rest render as generic chips
  const otherFields = Object.entries(note.fields).filter(([key]) => key !== 'url' && key !== 'location');
  const notesText = cleanNotes(note.notes);
  const shelfColor = { color: `var(--${category})` };
  // Eat / Do: done = "been there", shown as a check. Elsewhere done = finished, shown dimmed.
  const been = !!note.done && doneStaysInList(category);
  const finished = !!note.done && !been;

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 transition-shadow ${expanded ? 'shadow-lg shadow-black/5 dark:shadow-black/40' : ''} ${finished ? 'opacity-60' : ''}`}
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
        className="flex items-center gap-3 px-3.5 py-3 min-h-[52px] cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-shelf"
      >
        <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ backgroundColor: `var(--${category})` }} />
        <span className={`flex-1 min-w-0 font-serif font-semibold text-lg leading-snug text-zinc-900 dark:text-zinc-50 ${expanded ? '' : 'truncate'}`}>
          {note.title}
        </span>
        <span className="inline-flex items-center gap-1 text-[15px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap shrink-0">
          {been && <CheckIcon className="w-4 h-4" />}
          {place || typeLabel}
        </span>
        {/* Fixed-width slot, empty without a link, so types line up down the right edge */}
        {note.fields.url ? (
          <a
            href={note.fields.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 -m-1 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title={note.fields.url}
          >
            <ExternalLinkIcon className="w-[17px] h-[17px]" />
          </a>
        ) : (
          <span className="shrink-0 w-[17px]" aria-hidden="true" />
        )}
      </div>

      {/* Details: shown in place when expanded */}
      {expanded && (
        <div className="px-3.5 pb-3.5 pl-[34px] space-y-2.5">
          {note.fields.url && (
            <a
              href={note.fields.url}
              target="_blank"
              rel="noopener noreferrer"
              style={shelfColor}
              className="inline-flex items-center gap-1.5 text-[15px] hover:underline"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              {extractDomain(note.fields.url)}
            </a>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Chip label="type" value={typeLabel.toLowerCase()} />
            {place && <Chip label="place" value={place} />}
            {otherFields.map(([key, value]) => <Chip key={key} label={key} value={value} />)}
          </div>

          {note.hashTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.hashTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[15px] px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {notesText && (
            <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{notesText}</p>
          )}

          <p className="text-sm text-zinc-400 dark:text-zinc-500">Added {formatRelativeTime(note.timestamp)}</p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onToggleDone?.(note.id, !note.done)}
              aria-pressed={!!note.done}
              style={note.done
                ? { backgroundColor: `var(--${category})`, borderColor: `var(--${category})`, color: 'var(--on-shelf)' }
                : shelfColor}
              className="flex items-center gap-1.5 text-[15px] font-medium px-3.5 py-1.5 rounded-lg border border-current transition-colors"
            >
              {note.done && <CheckIcon className="w-4 h-4" />}
              {DONE_LABELS[category]}
            </button>
            <button
              onClick={() => onEdit?.(note)}
              className="flex items-center gap-1.5 text-[15px] font-medium px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <EditIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete?.(note.id)}
              className="ml-auto flex items-center gap-1.5 text-[15px] font-medium px-3 py-1.5 rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[15px] px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
      <span className="font-semibold text-zinc-500 dark:text-zinc-400">{label}</span> {value}
    </span>
  );
}
