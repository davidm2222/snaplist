'use client';

export type SortOrder = 'newest' | 'az';

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
}

const selectClass =
  'text-xs rounded-md border px-2 py-1 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400';
// Amber border when a filter is active, so it's obvious the list is narrowed
const borderClass = (active: boolean) =>
  active ? 'border-amber-400 dark:border-amber-500' : 'border-zinc-200 dark:border-zinc-800';

// Type and place dropdowns only appear when there's more than one option to choose from.
export function FilterBar({ types, places, type, place, sort, onTypeChange, onPlaceChange, onSortChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(types.length > 1 || type) && (
        <select aria-label="Filter by type" value={type} onChange={(e) => onTypeChange(e.target.value)} className={`${selectClass} ${borderClass(!!type)}`}>
          <option value="">All types</option>
          {types.map(o => <option key={o.value} value={o.value}>{o.label} ({o.count})</option>)}
        </select>
      )}
      {(places.length > 1 || place) && (
        <select aria-label="Filter by place" value={place} onChange={(e) => onPlaceChange(e.target.value)} className={`${selectClass} ${borderClass(!!place)}`}>
          <option value="">All places</option>
          {places.map(o => <option key={o.value} value={o.value}>{o.label} ({o.count})</option>)}
        </select>
      )}
      <select aria-label="Sort" value={sort} onChange={(e) => onSortChange(e.target.value as SortOrder)} className={`${selectClass} ${borderClass(false)}`}>
        <option value="newest">Newest</option>
        <option value="az">A–Z</option>
      </select>
    </div>
  );
}
