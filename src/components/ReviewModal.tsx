'use client';

import { useState, useEffect, FormEvent } from 'react';
import { CategoryKey, CATEGORIES } from '@/types';
import { CategoryIcon } from './Icons';
import { useAuth } from '@/hooks/useAuth';
import type { ParseUrlResponse } from '@/app/api/parse-url/route';

interface ReviewModalProps {
  url: string;
  onSave: (raw: string) => Promise<void>;
  onClose: () => void;
}

type Status = 'loading' | 'ready' | 'error';

const VALID_SHELVES = new Set<string>(['read', 'watch', 'eat', 'do', 'buy', 'other']);

function buildRawString(
  shelf: string,
  title: string,
  fields: Record<string, string>,
  hashTags: string[],
  url: string
): string {
  const parts = [`${shelf}: ${title}`];
  for (const [key, val] of Object.entries(fields)) {
    if (val.trim()) parts.push(`${key}:${val.trim()}`);
  }
  const tagStr = hashTags.filter(Boolean).map(t => `#${t.replace(/^#/, '')}`).join(' ');
  return [parts.join(', '), tagStr, url].filter(Boolean).join(' ');
}

export function ReviewModal({ url, onSave, onClose }: ReviewModalProps) {
  const { getIdToken } = useAuth();

  const [status, setStatus] = useState<Status>('loading');
  const [shelf, setShelf] = useState<CategoryKey>('other');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [site, setSite] = useState('');
  const [hashTags, setHashTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editableCategories = (Object.keys(CATEGORIES) as (CategoryKey | 'all')[]).filter(
    (k): k is CategoryKey => k !== 'all'
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchParsed() {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/parse-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url }),
        });

        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data: ParseUrlResponse = await res.json();

        if (cancelled) return;

        setShelf(VALID_SHELVES.has(data.shelf) ? (data.shelf as CategoryKey) : 'other');
        setTitle(data.title || '');
        setAuthor(data.fields?.author || '');
        setSite(data.fields?.site || '');
        setHashTags((data.hashtags ?? []).join(', '));
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('URL parse failed:', err);
        // Fall through to manual entry with just the URL pre-filled.
        setTitle(url);
        setStatus('error');
      }
    }

    fetchParsed();
    return () => { cancelled = true; };
  }, [url, getIdToken]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const fields: Record<string, string> = {};
      if (author.trim()) fields.author = author.trim();
      if (site.trim()) fields.site = site.trim();

      const parsedTags = hashTags
        .split(',')
        .map(t => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean);

      const raw = buildRawString(shelf, title.trim(), fields, parsedTags, url);
      await onSave(raw);
      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold font-serif text-zinc-900 dark:text-zinc-100">
              Review & Save
            </h2>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-amber-500 truncate block max-w-xs"
            >
              {url.length > 50 ? url.slice(0, 50) + '…' : url}
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xl leading-none ml-4"
          >
            &times;
          </button>
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Analyzing URL…</p>
          </div>
        )}

        {/* Error banner */}
        {status === 'error' && (
          <p className="mb-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
            Couldn&apos;t auto-fill — fill in the details below.
          </p>
        )}

        {/* Form — shown when ready or error */}
        {status !== 'loading' && (
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
                    onClick={() => setShelf(key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      shelf === key
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

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Author <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
            </div>

            {/* Site */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Site <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Hashtags <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={hashTags}
                onChange={(e) => setHashTags(e.target.value)}
                placeholder="tag1, tag2"
                className="w-full px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
              <p className="mt-1 text-xs text-zinc-400">Separate with commas</p>
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
                disabled={isSubmitting || !title.trim()}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-900 font-semibold disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
