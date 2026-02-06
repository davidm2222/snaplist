'use client';

import { useState, FormEvent, useRef, useEffect, useMemo } from 'react';
import { Note } from '@/types';

interface NoteInputProps {
  onSubmit: (raw: string) => Promise<void>;
  disabled?: boolean;
  notes?: Note[];
}

export function NoteInput({ onSubmit, disabled, notes = [] }: NoteInputProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Build autocomplete dictionary from existing notes
  const autocompleteData = useMemo(() => {
    const fieldValues: Record<string, Set<string>> = {};
    const fieldNames = new Set<string>();

    for (const note of notes) {
      // Collect field names and values
      for (const [key, val] of Object.entries(note.fields)) {
        fieldNames.add(key.toLowerCase());
        if (!fieldValues[key]) fieldValues[key] = new Set();
        fieldValues[key].add(val.toLowerCase());
      }
      // Collect hashtags
      if (!fieldValues['#']) fieldValues['#'] = new Set();
      for (const tag of note.hashTags) {
        fieldValues['#'].add(tag.toLowerCase());
      }
    }

    // Convert sets to sorted arrays
    const values: Record<string, string[]> = {};
    for (const [key, vals] of Object.entries(fieldValues)) {
      values[key] = Array.from(vals).sort();
    }

    return {
      values,
      fieldNames: Array.from(fieldNames).sort()
    };
  }, [notes]);

  // Find suggestion based on current input
  useEffect(() => {
    if (!value) {
      setSuggestion('');
      return;
    }

    const cursorPos = inputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);

    // Check for field value pattern (key:partial)
    const fieldValueMatch = textBeforeCursor.match(/(\w+):([^,]*)$/);
    if (fieldValueMatch) {
      const [, key, partial] = fieldValueMatch;
      const values = autocompleteData.values[key.toLowerCase()];
      if (values && partial) {
        const match = values.find(v =>
          v.startsWith(partial.toLowerCase()) && v !== partial.toLowerCase()
        );
        if (match) {
          setSuggestion(value + match.slice(partial.length));
          return;
        }
      }
    }

    // Check for field name pattern (after comma, typing a word without colon yet)
    const fieldNameMatch = textBeforeCursor.match(/,\s*(\w+)$/);
    if (fieldNameMatch) {
      const [, partial] = fieldNameMatch;
      if (partial.length >= 2) {
        const match = autocompleteData.fieldNames.find(name =>
          name.startsWith(partial.toLowerCase()) && name !== partial.toLowerCase()
        );
        if (match) {
          setSuggestion(value + match.slice(partial.length) + ':');
          return;
        }
      }
    }

    // Check for hashtag pattern (#partial)
    const hashMatch = textBeforeCursor.match(/#(\w*)$/);
    if (hashMatch) {
      const [, partial] = hashMatch;
      const tags = autocompleteData.values['#'];
      if (tags && partial) {
        const match = tags.find(t =>
          t.startsWith(partial.toLowerCase()) && t !== partial.toLowerCase()
        );
        if (match) {
          setSuggestion(value + match.slice(partial.length));
          return;
        }
      }
    }

    setSuggestion('');
  }, [value, autocompleteData]);

  const acceptSuggestion = () => {
    if (suggestion) {
      setValue(suggestion);
      setSuggestion('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab to accept suggestion
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      acceptSuggestion();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(value.trim());
      setValue('');
      setSuggestion('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        {/* Ghost text for autocomplete suggestion */}
        {suggestion && (
          <div className="absolute inset-0 px-4 py-3 pr-24 pointer-events-none">
            <span className="invisible">{value}</span>
            <span className="text-zinc-300 dark:text-zinc-600">
              {suggestion.slice(value.length)}
            </span>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSubmitting}
          placeholder="book: The Martian, genre:sci-fi, #space, amazing read!"
          className="w-full px-4 py-3 pr-24 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent transition-all text-base"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled || isSubmitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? '...' : 'Add'}
        </button>
      </div>
      {suggestion ? (
        <button
          type="button"
          onClick={acceptSuggestion}
          className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium active:scale-95 transition-transform"
        >
          {suggestion.slice(value.length)}
          <span className="text-amber-400 dark:text-amber-500 hidden sm:inline">Tab</span>
        </button>
      ) : (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Format: <span className="font-mono text-zinc-500 dark:text-zinc-400">category: Title, key:value, #tag, notes</span>
        </p>
      )}
    </form>
  );
}
