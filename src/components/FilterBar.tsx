'use client';

import { useState } from 'react';
import { FilterIcon } from './Icons';

export type SortOrder = 'newest' | 'az' | 'place';
/** '' = all, 'not' = not been yet, 'been' = been there */
export type BeenFilter = '' | 'not' | 'been';

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterBarProps {
  types: FilterOption[];
  places: FilterOption[];
  type: string;
  place: string;
  sort: SortOrder;
  onTypeChange: (type: string) => void;
  onPlaceChange: (place: string) => void;
  onSortChange: (sort: SortOrder) => void;
  onClear: () => void;
  /** Eat / Do only: offer the "By place" sort */
  allowPlaceSort?: boolean;
  /** Eat / Do only: pass a value to show the Been filter */
  been?: BeenFilter;
  onBeenChange?: (been: BeenFilter) => void;
  /** Shown on the right, e.g. "12 results" while searching; defaults to the sort order */
  status?: string;
}

const SORT_LABELS: Record<SortOrder, string> = { newest: 'Newest first', az: 'A–Z', place: 'By place' };

const selectClass =
  'text-[15px] rounded-lg px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-shelf';

// One Filter button; the panel holds type / place / sort. Type and place only appear
// when there's more than one option to choose from.
export function FilterBar({ types, places, type, place, sort, onTypeChange, onPlaceChange, onSortChange, onClear, allowPlaceSort, been, onBeenChange, status }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const activeCount = (type ? 1 : 0) + (place ? 1 : 0) + (been ? 1 : 0);
  const showType = types.length > 1 || !!type;
  const showPlace = places.length > 1 || !!place;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[15px] font-medium text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <FilterIcon className="w-4 h-4" />
          Filter
          {activeCount > 0 && (
            <span className="bg-shelf text-on-shelf text-xs font-semibold rounded-full px-1.5 min-w-[18px] leading-[18px] text-center">
              {activeCount}
            </span>
          )}
        </button>
        <span className="text-[15px] text-zinc-500 dark:text-zinc-400">{status ?? SORT_LABELS[sort]}</span>
      </div>

      {open && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-2.5">
          {showType && (
            <label className="flex items-center justify-between gap-3 text-base">
              Type
              <select value={type} onChange={(e) => onTypeChange(e.target.value)} className={selectClass}>
                <option value="">All types</option>
                {types.map(o => <option key={o.value} value={o.value}>{o.label} ({o.count})</option>)}
              </select>
            </label>
          )}
          {showPlace && (
            <label className="flex items-center justify-between gap-3 text-base">
              Place
              <select value={place} onChange={(e) => onPlaceChange(e.target.value)} className={selectClass}>
                <option value="">Any place</option>
                {places.map(o => <option key={o.value} value={o.value}>{o.label} ({o.count})</option>)}
              </select>
            </label>
          )}
          {been !== undefined && onBeenChange && (
            <label className="flex items-center justify-between gap-3 text-base">
              Been
              <select value={been} onChange={(e) => onBeenChange(e.target.value as BeenFilter)} className={selectClass}>
                <option value="">All</option>
                <option value="not">Not yet</option>
                <option value="been">Been</option>
              </select>
            </label>
          )}
          <label className="flex items-center justify-between gap-3 text-base">
            Sort
            <select value={sort} onChange={(e) => onSortChange(e.target.value as SortOrder)} className={selectClass}>
              {(Object.keys(SORT_LABELS) as SortOrder[]).filter(s => s !== 'place' || allowPlaceSort).map(s => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}
            </select>
          </label>
          {activeCount > 0 && (
            <button onClick={onClear} className="text-[15px] font-medium text-shelf hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
