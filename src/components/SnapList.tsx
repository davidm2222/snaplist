'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotes } from '@/hooks/useNotes';
import { CategoryKey, CATEGORIES, Note, NoteDraft } from '@/types';
import { Header } from './Header';
import { NoteInput } from './NoteInput';
import { useToast } from './Toast';
import { CategoryTabs } from './CategoryTabs';
import { SearchBar } from './SearchBar';
import { NoteCard } from './NoteCard';
import { AuthModal } from './AuthModal';
import { EditModal } from './EditModal';
import { ReviewModal } from './ReviewModal';
import { FilterBar, FilterOption, SortOrder } from './FilterBar';
import { CategoryIcon, SearchIcon, CheckCircleIcon, ChevronDownIcon } from './Icons';
import { hasKnownPrefix, isBareUrl, parseNote } from '@/lib/parseNote';
import { resolveShelf, resolveType, matchesSearch, knownLocations, locationKey, formatLocation } from '@/lib/notes';

// Android share target (see manifest.ts) opens /?title=&text=&url=.
// Apps often put the link inside `text` rather than `url`.
function readShareParams(): { url: string | null; text: string } | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const title = params.get('title')?.trim() ?? '';
  const text = params.get('text')?.trim() ?? '';
  const url = params.get('url')?.trim() || text.match(/https?:\/\/[^\s]+/)?.[0] || null;
  if (!title && !text && !url) return null;
  return { url, text: [title, text].filter(Boolean).join(' ') };
}

export function SnapList() {
  const { user, loading: authLoading } = useAuth();
  const { notes, loading: notesLoading, error: notesError, addNote, saveNote, setDone, deleteNote, restoreNote } = useNotes();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<CategoryKey | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState(''); // a locationKey
  const [sort, setSort] = useState<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  // Read once at mount; the modal/input only render after sign-in, and this state survives the auth screen
  const [share] = useState(readShareParams);
  // What the review screen is showing: a link, or typed text without a shelf prefix
  const [reviewing, setReviewing] = useState<{ url?: string; text?: string } | null>(
    share?.url ? { url: share.url } : null
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (notesError) toast({ tone: 'error', message: "Couldn't load notes. Try reloading." });
  }, [notesError, toast]);

  // Drop share params from the address bar so a refresh doesn't re-trigger them
  useEffect(() => {
    if (share) window.history.replaceState(null, '', window.location.pathname);
  }, [share]);

  // Calculate note counts per category — active (non-done) notes only
  const noteCounts = useMemo(() => {
    const activeNotes = notes.filter(n => !n.done);
    const counts: Record<string, number> = { all: activeNotes.length };
    for (const note of activeNotes) {
      const category = resolveShelf(note);
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // Filter notes. Search is GLOBAL; the tab only applies when not searching.
  // Type/place options come from the tab (or search) results, counting active notes.
  const { activeNotes, doneNotes, baseCount, typeOptions, placeOptions } = useMemo(() => {
    const base = searchQuery.trim()
      ? notes.filter(note => matchesSearch(note, searchQuery))
      : activeTab === 'all' ? notes : notes.filter(note => resolveShelf(note) === activeTab);

    const typeCounts = new Map<string, number>();
    const placeCounts = new Map<string, number>();
    for (const note of base) {
      if (note.done) continue;
      const type = resolveType(note);
      if (type) typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
      if (note.fields.location) {
        const key = locationKey(note.fields.location);
        placeCounts.set(key, (placeCounts.get(key) ?? 0) + 1);
      }
    }
    // Keep the current selection listed even when this view has none of it
    if (typeFilter && !typeCounts.has(typeFilter)) typeCounts.set(typeFilter, 0);
    if (placeFilter && !placeCounts.has(placeFilter)) placeCounts.set(placeFilter, 0);
    const toOptions = (counts: Map<string, number>, label: (v: string) => string): FilterOption[] =>
      [...counts.entries()]
        .map(([value, count]) => ({ value, label: label(value), count }))
        .sort((a, b) => a.label.localeCompare(b.label));

    let filtered = base;
    if (typeFilter) filtered = filtered.filter(note => resolveType(note) === typeFilter);
    if (placeFilter) {
      filtered = filtered.filter(note => note.fields.location && locationKey(note.fields.location) === placeFilter);
    }
    // Notes arrive newest first from Firestore
    if (sort === 'az') {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    }

    return {
      activeNotes: filtered.filter(n => !n.done),
      doneNotes: filtered.filter(n => n.done),
      baseCount: base.length,
      typeOptions: toOptions(typeCounts, v => v.charAt(0).toUpperCase() + v.slice(1)),
      placeOptions: toOptions(placeCounts, formatLocation),
    };
  }, [notes, activeTab, searchQuery, typeFilter, placeFilter, sort]);

  const filtersActive = !!(typeFilter || placeFilter);
  const clearFilters = () => {
    setTypeFilter('');
    setPlaceFilter('');
  };

  // Types belong to a shelf, so switching tabs clears the type filter. Place carries over.
  const handleTabChange = (tab: CategoryKey | 'all') => {
    setActiveTab(tab);
    setTypeFilter('');
  };

  const handleToggleDone = async (id: string, done: boolean) => {
    try {
      await setDone(id, done);
    } catch (err) {
      console.error('Failed to update:', err);
      toast({ tone: 'error', message: "Couldn't update note. Try again." });
    }
  };

  // Delete immediately; Undo writes the note back
  const handleDelete = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      await deleteNote(id);
    } catch (err) {
      console.error('Failed to delete:', err);
      toast({ tone: 'error', message: "Couldn't delete note. Try again." });
      return;
    }
    toast({
      message: 'Note deleted',
      action: {
        label: 'Undo',
        onClick: () => {
          restoreNote(note).catch((err) => {
            console.error('Failed to restore:', err);
            toast({ tone: 'error', message: "Couldn't restore note." });
          });
        },
      },
    });
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
  };

  const handleSaveEdit = async (id: string, draft: NoteDraft) => {
    await saveNote(id, draft);
  };

  const handleNoteSubmit = async (raw: string) => {
    const trimmed = raw.trim();
    if (isBareUrl(trimmed)) {
      const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        setReviewing({ url: urlMatch[0] });
        return;
      }
    }
    // A shelf prefix ("eat:") saves instantly; anything else gets AI help on the review screen.
    if (!hasKnownPrefix(trimmed)) {
      setReviewing({ text: trimmed });
      return;
    }
    await addNote(parseNote(trimmed, knownLocations(notes)), trimmed);
  };

  // Show auth modal if not logged in
  if (!authLoading && !user) {
    return <AuthModal isOpen={true} />;
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Input with autocomplete */}
        <NoteInput onSubmit={handleNoteSubmit} disabled={notesLoading} notes={notes} initialValue={share && !share.url ? share.text : ''} />

        {/* Search and Tabs */}
        <div className="space-y-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search all notes..."
          />
          <CategoryTabs
            activeTab={searchQuery ? 'all' : activeTab}
            onTabChange={handleTabChange}
            noteCounts={noteCounts}
          />
          {searchQuery && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Searching across all categories
            </p>
          )}
        </div>

        {/* Filters, sort, view toggle */}
        {baseCount > 0 && (
          <div className="flex items-center justify-between gap-2">
            <FilterBar
              types={activeTab === 'all' && !searchQuery ? [] : typeOptions}
              places={placeOptions}
              type={typeFilter}
              place={placeFilter}
              sort={sort}
              onTypeChange={setTypeFilter}
              onPlaceChange={setPlaceFilter}
              onSortChange={setSort}
            />
          </div>
        )}
        {notesLoading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : activeNotes.length === 0 && doneNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-3 flex justify-center">
              {searchQuery ? (
                <SearchIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
              ) : (
                <CategoryIcon category={activeTab} className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
              )}
            </div>
            <p className="text-zinc-500 dark:text-zinc-400">
              {filtersActive
                ? 'Nothing matches these filters'
                : searchQuery
                ? 'No notes match your search'
                : activeTab === 'all'
                ? 'No notes yet. Add your first one above!'
                : `No ${CATEGORIES[activeTab].name.toLowerCase()} yet`}
            </p>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active notes */}
            {activeNotes.length === 0 && doneNotes.length > 0 && (
              <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-6">
                All done here!
              </p>
            )}
            <div className="space-y-1">
              {activeNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleDone={handleToggleDone}
                  expanded={expandedId === note.id}
                  onToggleExpand={() => setExpandedId(id => id === note.id ? null : note.id)}
                />
              ))}
            </div>

            {/* Completed drawer */}
            {doneNotes.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowCompleted(v => !v)}
                  className="flex items-center w-full gap-3 py-2 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <span className="flex items-center gap-1.5 shrink-0">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Completed ({doneNotes.length})
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
                  </span>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                </button>
                {showCompleted && (
                  <div className="mt-1 space-y-1">
                    {doneNotes.map(note => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleDone={handleToggleDone}
                        expanded={expandedId === note.id}
                  onToggleExpand={() => setExpandedId(id => id === note.id ? null : note.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingNote && (
        <EditModal
          note={editingNote}
          onSave={handleSaveEdit}
          onClose={() => setEditingNote(null)}
        />
      )}

      {/* Review Modal: links and free-form text */}
      {reviewing && (
        <ReviewModal
          url={reviewing.url}
          text={reviewing.text}
          sharedText={reviewing.url && share?.url === reviewing.url ? share.text : undefined}
          onSave={(draft) => addNote(draft, reviewing.url ?? reviewing.text ?? '')}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}
