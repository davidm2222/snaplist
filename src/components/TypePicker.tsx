'use client';

import { CategoryKey } from '@/types';
import { SHELF_TYPES } from '@/lib/notes';

interface TypePickerProps {
  shelf: CategoryKey;
  value: string;
  onChange: (type: string) => void;
}

// "None" + the shelf's types; renders nothing for shelves without types
export function TypePicker({ shelf, value, onChange }: TypePickerProps) {
  const options = SHELF_TYPES[shelf];
  if (options.length === 0) return null;

  const chip = (selected: boolean, base: string) =>
    `px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
      selected ? base : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
    }`;

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
        Type
      </label>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange('')}
          className={chip(value === '', 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200 ring-1 ring-zinc-400 dark:ring-zinc-500')}
        >
          None
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={chip(value === opt, 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700')}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
