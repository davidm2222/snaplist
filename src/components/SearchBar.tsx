'use client';

import { SearchIcon, XIcon } from './Icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search notes...' }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:bg-white dark:focus:bg-zinc-800 transition-all text-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <XIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
