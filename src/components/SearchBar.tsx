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
      <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-shelf focus:border-transparent transition-shadow text-base [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <XIcon className="w-[18px] h-[18px]" />
        </button>
      )}
    </div>
  );
}
