'use client';

import { CATEGORIES, CategoryKey } from '@/types';
import { CategoryIcon } from './Icons';

interface CategoryTabsProps {
  activeTab: CategoryKey | 'all';
  onTabChange: (tab: CategoryKey | 'all') => void;
  noteCounts?: Record<string, number>;
}

const TAB_ORDER: (CategoryKey | 'all')[] = ['all', 'book', 'movie', 'show', 'restaurant', 'drink', 'activity', 'other'];

export function CategoryTabs({ activeTab, onTabChange, noteCounts = {} }: CategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl min-w-max">
        {TAB_ORDER.map((key) => {
          const category = CATEGORIES[key];
          const count = noteCounts[key] || 0;
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <CategoryIcon category={key} className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{category.name}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
