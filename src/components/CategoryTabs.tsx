'use client';

import { CATEGORIES, CategoryKey } from '@/types';
import { SHELVES } from '@/lib/notes';

interface CategoryTabsProps {
  activeTab: CategoryKey | 'all';
  onTabChange: (tab: CategoryKey | 'all') => void;
  noteCounts?: Record<string, number>;
}

const TAB_ORDER: (CategoryKey | 'all')[] = ['all', ...SHELVES];

export function CategoryTabs({ activeTab, onTabChange, noteCounts = {} }: CategoryTabsProps) {
  return (
    <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-1.5 min-w-max">
        {TAB_ORDER.map((key) => {
          const count = noteCounts[key] || 0;
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-base font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-shelf text-on-shelf'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              {CATEGORIES[key].name}
              {count > 0 && <span className="text-sm tabular-nums opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
