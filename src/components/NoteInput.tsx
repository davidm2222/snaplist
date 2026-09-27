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
  onCancel?: () => void;
}

const MAX_OPTIONS = 5;

export function NoteInput({ onSubmit, disabled, notes = [], initialValue = '', onCancel }: NoteInputProps) {
  const toast = useToast();
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Completions for the token being typed: `partial` is replaced by option + suffix
  const [completion, setCompletion] = useState<{ start: number; end: number; partial: string; options: string[]; suffix: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    const fieldValueMatch = textBeforeCursor.match(/(\w+):([^,\n]*)$/);
    if (fieldValueMatch && find(autocompleteData.values[fieldValueMatch[1].toLowerCase()], fieldValueMatch[2])) return;

    // Field name (after comma, typing a word without colon yet)
    const fieldNameMatch = textBeforeCursor.match(/,\s*(\w{2,})$/);
    if (fieldNameMatch && find(autocompleteData.fieldNames, fieldNameMatch[1], ':')) return;

    // Place (@partial) — may be multi-word ("@chestnut h")
    const placeMatch = textBeforeCursor.match(/(?:^|\s)@([^,#@\n]*)$/);
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
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.currentTarget.closest('form')?.requestSubmit();
    } else if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Line breaks act like commas, so a new line starts the notes after a title
      await onSubmit(value.trim().replace(/\s*\n+\s*/g, ', '));
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
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSubmitting}
        autoFocus
        rows={4}
        placeholder={'le petit four in wellesley, best croissants\nor  eat: Nobu @nyc #sushi'}
        className="w-full px-3.5 py-3 rounded-xl bg-background border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-shelf focus:border-transparent resize-none text-[17px] leading-relaxed"
      />

      <div className="min-h-[30px] flex flex-wrap gap-1.5">
        {completion?.options.map((option, i) => (
          <button
            key={option}
            type="button"
            onClick={() => accept(option)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-[15px] font-medium active:scale-95 transition-transform"
          >
            {/[@#]/.test(value[completion.start - 1] ?? '') && value[completion.start - 1]}
            {option}
            {i === 0 && <span className="text-xs text-zinc-400 hidden sm:inline">Tab</span>}
          </button>
        ))}
      </div>

      <p className="text-[15px] text-zinc-500 dark:text-zinc-400">
        {needsReview && !isBareUrl(value) ? (
          <>AI will fill in the details. Start with <code className="font-mono text-sm">eat:</code>, <code className="font-mono text-sm">read:</code>… to save instantly.</>
        ) : (
          <>Format: <code className="font-mono text-sm">shelf: Title #tag @place, notes, key:value</code></>
        )}
      </p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[15px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!value.trim() || disabled || isSubmitting}
          className="px-5 py-2 rounded-lg bg-shelf text-on-shelf text-base font-semibold disabled:opacity-45 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? 'Saving…' : needsReview ? 'Review & Save' : 'Add'}
        </button>
      </div>
    </form>
  );
}
