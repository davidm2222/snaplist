'use client';

import { useState, FormEvent } from 'react';
import { Note, CATEGORIES, CategoryKey } from '@/types';
import { CategoryIcon } from './Icons';

interface EditModalProps {
  note: Note;
  onSave: (id: string, updates: Partial<Note>) => Promise<void>;
  onClose: () => void;
}

const KNOWN_SHELVES = new Set(['read', 'watch', 'eat', 'do', 'buy', 'other']);
const LEGACY_MAP: Record<string, CategoryKey> = {
  book: 'read', movie: 'watch', show: 'watch',
  restaurant: 'eat', drink: 'eat', activity: 'do',
};

// Curated type options per shelf shown as chip buttons
const TYPE_OPTIONS: Partial<Record<CategoryKey, string[]>> = {
  read: ['book', 'article', 'link'],
  watch: ['movie', 'show', 'video'],
  eat: ['restaurant', 'cafe', 'bar', 'drink'],
  do: ['activity', 'event', 'concert', 'hike', 'museum'],
};

function resolveShelf(note: Note): CategoryKey {
  const tag = note.tags?.[0];
  if (!tag) return 'other';
  if (KNOWN_SHELVES.has(tag)) return tag as CategoryKey;
  return LEGACY_MAP[tag] || 'other';
}

function resolveNoteType(note: Note): string {
  if (note.type) return note.type;
  const tag = note.tags?.[0];
  if (tag && !KNOWN_SHELVES.has(tag)) return tag; // legacy alias in tags[0]
  return '';
}

export function EditModal({ note, onSave, onClose }: EditModalProps) {
  const [category, setCategory] = useState<CategoryKey>(resolveShelf(note));
  const [type, setType] = useState<string>(resolveNoteType(note));
  const [title, setTitle] = useState(note.title);
  const [fields, setFields] = useState<Record<string, string>>(note.fields);
  const [hashTags, setHashTags] = useState(note.hashTags.join(', '));
  const [notes, setNotes] = useState(note.notes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editableCategories = (Object.keys(CATEGORIES) as (CategoryKey | 'all')[]).filter(
    (k): k is CategoryKey => k !== 'all'
  );

  const handleCategoryChange = (key: CategoryKey) => {
    setCategory(key);
    setType(''); // reset type when shelf changes
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const parsedHashTags = hashTags
        .split(',')
        .map(t => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean);

      const updates: Partial<Note> = {
        title,
        tags: [category],
        fields,
        hashTags: parsedHashTags,
        notes,
        type: type || undefined,
      };

      await onSave(note.id, updates);
      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const removeField = (key: string) => {
    setFields(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addField = () => {
    const key = prompt('Field name:');
    if (key && key.trim() && !fields[key.trim()]) {
      setFields(prev => ({ ...prev, [key.trim().toLowerCase()]: '' }));
    }
  };

  const typeOptions = TYPE_OPTIONS[category] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold font-serif text-zinc-900 dark:text-zinc-100 mb-4">
          Edit Note
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shelf */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Shelf
            </label>
            <div className="flex flex-wrap gap-1.5">
              {editableCategories.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === key
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <CategoryIcon category={key} className="w-3.5 h-3.5" />
                  {CATEGORIES[key].name}
                </button>
              ))}
            </div>
          </div>

          {/* Type (only shown for shelves that have subtypes) */}
          {typeOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setType('')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    type === ''
                      ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200 ring-1 ring-zinc-400 dark:ring-zinc-500'
                      : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  None
                </button>
                {typeOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setType(opt)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      type === opt
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
            />
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Fields
              </label>
              <button
                type="button"
                onClick={addField}
                className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                + Add field
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(fields).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="px-2 py-2 text-sm text-zinc-500 dark:text-zinc-400 min-w-[80px]">
                    {key}:
                  </span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeField(key)}
                    className="px-2 text-zinc-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {Object.keys(fields).length === 0 && (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                  No fields
                </p>
              )}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Hashtags
            </label>
            <input
              type="text"
              value={hashTags}
              onChange={(e) => setHashTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
            />
            <p className="mt-1 text-xs text-zinc-400">Separate with commas</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-900 font-semibold disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
