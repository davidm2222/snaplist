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
import { FilterBar, FilterOption, SortOrder, BeenFilter } from './FilterBar';
import { CategoryIcon, SearchIcon, CheckCircleIcon, ChevronDownIcon, PlusIcon } from './Icons';
import { hasKnownPrefix, isBareUrl, parseNote } from '@/lib/parseNote';
import { resolveShelf, matchesType, countTypes, NO_TYPE, matchesSearch, knownLocations, locationKey, formatLocation, isFinished, doneStaysInList, groupByPlace } from '@/lib/notes';

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

const resultsLabel = (n: number) => `${n} ${n === 1 ? 'result' : 'results'}`;

export function SnapList() {
  const { user, loading: authLoading } = useAuth();
  const { notes, loading: notesLoading, error: notesError, addNote, saveNote, setDone, deleteNote, restoreNote } = useNotes();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<CategoryKey | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [placeFilter, setPlaceFilter] = useState(''); // a locationKey
  const [beenFilter, setBeenFilter] = useState<BeenFilter>(''); // Eat / Do only
  const [sort, setSort] = useState<SortOrder>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  // Read once at mount; the modal/input only render after sign-in, and this state survives the auth screen
  const [share] = useState(readShareParams);
  // What the review screen is showing: a link, or typed text without a shelf prefix
  const [reviewing, setReviewing] = useState<{ url?: string; text?: string } | null>(
    share?.url ? { url: share.url } : null
  );
  // Add panel; shared text (no link) opens it pre-filled
  const [adding, setAdding] = useState(!!share && !share.url);
  const [addSeed, setAddSeed] = useState(share && !share.url ? share.text : '');
  const closeAdd = () => { setAdding(false); setAddSeed(''); };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (notesError) toast({ tone: 'error', message: "Couldn't load notes. Try reloading." });
  }, [notesError, toast]);

  // Drop share params from the address bar so a refresh doesn't re-trigger them
  useEffect(() => {
    if (share) window.history.replaceState(null, '', window.location.pathname);
  }, [share]);

  // Calculate note counts per category — excludes Finished notes
  const noteCounts = useMemo(() => {
    const activeNotes = notes.filter(n => !isFinished(n));
    const counts: Record<string, number> = { all: activeNotes.length };
    for (const note of activeNotes) {
      const category = resolveShelf(note);
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // Eat / Do (not searching): "Been" filter and "By place" sort only make sense here.
  // A "By place" choice is remembered but falls back to newest on other shelves.
  const showBeenFilter = !searchQuery.trim() && activeTab !== 'all' && doneStaysInList(activeTab);
  const effectiveSort: SortOrder = sort === 'place' && !showBeenFilter ? 'newest' : sort;

  // Filter notes. Search is GLOBAL; the tab only applies when not searching.
  // Type/place options come from the tab (or search) results, not counting Finished notes.
  const { activeNotes, doneNotes, baseCount, typeOptions, placeOptions } = useMemo(() => {
    const base = searchQuery.trim()
      ? notes.filter(note => matchesSearch(note, searchQuery))
      : activeTab === 'all' ? notes : notes.filter(note => resolveShelf(note) === activeTab);

    const unfinished = base.filter(note => !isFinished(note));
    const typeShelf = searchQuery.trim() || activeTab === 'all' ? null : activeTab;
    const typeCounts = new Map(countTypes(unfinished, typeShelf));
    const placeCounts = new Map<string, number>();
    for (const note of unfinished) {
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
        .map(([value, count]) => ({ value, label: label(value), count }));

    let filtered = base;
    if (typeFilter) filtered = filtered.filter(note => matchesType(note, typeFilter));
    if (placeFilter) {
      filtered = filtered.filter(note => note.fields.location && locationKey(note.fields.location) === placeFilter);
    }
    if (showBeenFilter && beenFilter) filtered = filtered.filter(note => !!note.done === (beenFilter === 'been'));
    // Notes arrive newest first from Firestore
    if (sort === 'az') {
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    }

    return {
      activeNotes: filtered.filter(n => !isFinished(n)),
      doneNotes: filtered.filter(isFinished),
      baseCount: base.length,
      // Types keep countTypes order (picker order, "No type" last); places sort A–Z
      typeOptions: toOptions(typeCounts, v => v === NO_TYPE ? 'No type' : v.charAt(0).toUpperCase() + v.slice(1)),
      placeOptions: toOptions(placeCounts, formatLocation).sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [notes, activeTab, searchQuery, typeFilter, placeFilter, beenFilter, showBeenFilter, sort]);

  const filtersActive = !!(typeFilter || placeFilter || (showBeenFilter && beenFilter));
  const clearFilters = () => {
    setTypeFilter('');
    setPlaceFilter('');
    setBeenFilter('');
  };

  // Types belong to a shelf, so switching tabs clears the type filter. Place carries over.
  const handleTabChange = (tab: CategoryKey | 'all') => {
    setActiveTab(tab);
    setTypeFilter('');
    setBeenFilter('');
  };

  const handleToggleDone = async (id: string, done: boolean) => {
    try {
      await setDone(id, done);
    } catch (err) {
      console.error('Failed to update:', err);
      toast({ tone: 'error', message: "Couldn't update note. Try again." });
      return;
    }
    // Finishing moves the note out of view, so offer a way back
    const note = notes.find(n => n.id === id);
    if (done && note && !doneStaysInList(resolveShelf(note))) {
      setExpandedId(null);
      toast({
        message: 'Moved to Finished',
        action: { label: 'Undo', onClick: () => { setDone(id, false).catch(err => console.error('Failed to undo:', err)); } },
      });
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

  const renderCard = (note: Note) => (
    <NoteCard
      key={note.id}
      note={note}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleDone={handleToggleDone}
      expanded={expandedId === note.id}
      onToggleExpand={() => setExpandedId(id => id === note.id ? null : note.id)}
    />
  );

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
    <div className="min-h-screen bg-background" data-shelf={searchQuery ? 'all' : activeTab}>
      {/* Sticky top: app bar, search, shelves */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-3 space-y-3">
          <Header />
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search everything"
          />
          <CategoryTabs
            activeTab={searchQuery ? 'all' : activeTab}
            onTabChange={handleTabChange}
            noteCounts={noteCounts}
          />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-1 pb-28 space-y-3">
        {baseCount > 0 && (
          <FilterBar
            types={activeTab === 'all' && !searchQuery ? [] : typeOptions}
            places={placeOptions}
            type={typeFilter}
            place={placeFilter}
            sort={effectiveSort}
            allowPlaceSort={showBeenFilter}
            onTypeChange={setTypeFilter}
            onPlaceChange={setPlaceFilter}
            onSortChange={setSort}
            onClear={clearFilters}
            been={showBeenFilter ? beenFilter : undefined}
            onBeenChange={setBeenFilter}
            status={searchQuery.trim() ? resultsLabel(activeNotes.length + doneNotes.length) : undefined}
          />
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
                ? 'No notes yet. Tap + to add your first one.'
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
                Everything here is finished
              </p>
            )}
            <div className="space-y-1">
              {effectiveSort === 'place'
                ? groupByPlace(activeNotes).map(group => (
                    <section key={group.key || 'none'} className="space-y-1">
                      <h3 className="flex gap-1.5 px-1 pt-3 pb-0.5 text-[13px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {group.label}
                        <span className="font-medium opacity-70 tabular-nums">{group.notes.length}</span>
                      </h3>
                      {group.notes.map(renderCard)}
                    </section>
                  ))
                : activeNotes.map(renderCard)}
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
                    Finished ({doneNotes.length})
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
                  </span>
                  <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                </button>
                {showCompleted && (
                  <div className="mt-1 space-y-1">
                    {doneNotes.map(renderCard)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add: floating button + bottom sheet */}
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          aria-label="Add a note"
          className="fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-30 w-14 h-14 rounded-full bg-shelf text-on-shelf shadow-lg shadow-black/20 grid place-items-center active:scale-95 transition-transform"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      )}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/35" onClick={closeAdd} />
          <div
            role="dialog"
            aria-label="Add a note"
            className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-t-3xl px-5 pt-2.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-3 animate-in"
          >
            <div className="mx-auto w-10 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <h2 className="font-serif font-semibold text-xl text-zinc-900 dark:text-zinc-50">Add to SnapList</h2>
            <NoteInput
              onSubmit={async (raw) => { await handleNoteSubmit(raw); closeAdd(); }}
              onCancel={closeAdd}
              disabled={notesLoading}
              notes={notes}
              initialValue={addSeed}
            />
          </div>
        </div>
      )}

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
