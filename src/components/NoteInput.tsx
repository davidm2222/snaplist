'use client';

import { useState, FormEvent, useRef, useEffect, useMemo } from 'react';
import { Note } from '@/types';
import { hasKnownPrefix, isBareUrl } from '@/lib/parseNote';
import { knownLocations } from '@/lib/notes';
import { useToast } from './Toast';

interface NoteInputProps {
  onSubmit: (raw: string) => Promise<void>;
  disabled?: boolean;
  notes?: Note[];
  initialValue?: string;
}

const MAX_OPTIONS = 5;

export function NoteInput({ onSubmit, disabled, notes = [], initialValue = '' }: NoteInputProps) {
  const toast = useToast();
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Completions for the token being typed: `partial` is replaced by option + suffix
  const [completion, setCompletion] = useState<{ start: number; end: number; partial: string; options: string[]; suffix: string } | null>(null);
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
      fieldNames: Array.from(fieldNames).sort(),
      places: knownLocations(notes), // most-used first
    };
  }, [notes]);

  // Find completions for the token before the cursor
  useEffect(() => {
    if (!value) {
      setCompletion(null);
      return;
    }

    const cursorPos = inputRef.current?.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);

    const find = (pool: string[] | undefined, partial: string, suffix = '') => {
      if (!pool || !partial) return false;
      const p = partial.toLowerCase();
      const options = pool.filter(v => v.startsWith(p) && v !== p).slice(0, MAX_OPTIONS);
      if (!options.length) return false;
      setCompletion({ start: cursorPos - partial.length, end: cursorPos, partial, options, suffix });
      return true;
    };

    // Field value (key:partial)
    const fieldValueMatch = textBeforeCursor.match(/(\w+):([^,]*)$/);
    if (fieldValueMatch && find(autocompleteData.values[fieldValueMatch[1].toLowerCase()], fieldValueMatch[2])) return;

    // Field name (after comma, typing a word without colon yet)
    const fieldNameMatch = textBeforeCursor.match(/,\s*(\w{2,})$/);
    if (fieldNameMatch && find(autocompleteData.fieldNames, fieldNameMatch[1], ':')) return;

    // Place (@partial) — may be multi-word ("@chestnut h")
    const placeMatch = textBeforeCursor.match(/(?:^|\s)@([^,#@]*)$/);
    if (placeMatch && find(autocompleteData.places, placeMatch[1])) return;

    // Hashtag (#partial)
    const hashMatch = textBeforeCursor.match(/#(\w*)$/);
    if (hashMatch && find(autocompleteData.values['#'], hashMatch[1])) return;

    setCompletion(null);
  }, [value, autocompleteData]);

  const accept = (option: string) => {
    if (!completion) return;
    const { start, end, suffix } = completion;
    const next = value.slice(0, start) + option + suffix;
    setValue(next + value.slice(end));
    setCompletion(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(next.length, next.length);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab accepts the first option
    if (e.key === 'Tab' && completion) {
      e.preventDefault();
      accept(completion.options[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(value.trim());
      setValue('');
      setCompletion(null);
    } catch (err) {
      console.error('Failed to add note:', err);
      toast({ tone: 'error', message: "Couldn't save note. Your text is still here, try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // No shelf prefix (or a bare link) -> AI fills in the review screen instead of saving instantly
  const needsReview = !!value.trim() && (isBareUrl(value) || !hasKnownPrefix(value.trim()));

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        {/* Ghost text for autocomplete suggestion */}
        {completion && completion.end === value.length && (
          <div className="absolute inset-0 px-4 py-3 pr-24 pointer-events-none">
            <span className="invisible">{value}</span>
            <span className="text-zinc-300 dark:text-zinc-600">
              {completion.options[0].slice(completion.partial.length) + completion.suffix}
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
          placeholder="le petit four in wellesley, best croissants  —  or eat: Nobu @nyc #sushi"
          className="w-full px-4 py-3 pr-24 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent transition-all text-base"
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled || isSubmitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-900 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
        >
          {isSubmitting ? '...' : needsReview ? 'Review & Save' : 'Add'}
        </button>
      </div>
      {completion ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {completion.options.map((option, i) => (
            <button
              key={option}
              type="button"
              onClick={() => accept(option)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium active:scale-95 transition-transform"
            >
              {/[@#]/.test(value[completion.start - 1] ?? '') && value[completion.start - 1]}
              {option}
              {i === 0 && <span className="text-amber-400 dark:text-amber-500 hidden sm:inline">Tab</span>}
            </button>
          ))}
        </div>
      ) : needsReview && !isBareUrl(value) ? (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          AI will fill in the details. Start with <span className="font-mono text-zinc-500 dark:text-zinc-400">eat:</span>, <span className="font-mono text-zinc-500 dark:text-zinc-400">read:</span>… to save instantly.
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Format: <span className="font-mono text-zinc-500 dark:text-zinc-400">category: Title #tag @place, notes, key:value</span>
        </p>
      )}
    </form>
  );
}
