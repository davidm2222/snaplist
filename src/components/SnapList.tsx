'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotes } from '@/hooks/useNotes';
import { CategoryKey, CATEGORIES, Note } from '@/types';
import { Header } from './Header';
import { NoteInput } from './NoteInput';
import { CategoryTabs } from './CategoryTabs';
import { SearchBar } from './SearchBar';
import { NoteCard } from './NoteCard';
import { AuthModal } from './AuthModal';
import { EditModal } from './EditModal';
import { ReviewModal } from './ReviewModal';
import { CategoryIcon, SearchIcon, ListIcon, CardIcon, CheckCircleIcon, ChevronDownIcon } from './Icons';
import { isBareUrl } from '@/lib/parseNote';
import { resolveShelf, matchesSearch } from '@/lib/notes';

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
  const { notes, loading: notesLoading, addNote, updateNote, deleteNote } = useNotes();
  const [activeTab, setActiveTab] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  // Read once at mount; the modal/input only render after sign-in, and this state survives the auth screen
  const [share] = useState(readShareParams);
  const [reviewingUrl, setReviewingUrl] = useState<string | null>(share?.url ?? null);
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('expanded');
  const [showCompleted, setShowCompleted] = useState(false);

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

  // Filter notes - search is GLOBAL, category filter only applies when not searching
  const { activeNotes, doneNotes } = useMemo(() => {
    let filtered = notes;

    // If searching, search ALL notes globally (ignore category tab)
    if (searchQuery.trim()) {
      filtered = filtered.filter(note => matchesSearch(note, searchQuery));
    } else {
      // No search query - filter by category tab
      if (activeTab !== 'all') {
        filtered = filtered.filter(note => resolveShelf(note) === activeTab);
      }
    }

    return {
      activeNotes: filtered.filter(n => !n.done),
      doneNotes: filtered.filter(n => n.done),
    };
  }, [notes, activeTab, searchQuery]);

  const handleToggleDone = async (id: string, done: boolean) => {
    await updateNote(id, { done });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this note?')) {
      try {
        await deleteNote(id);
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
  };

  const handleSaveEdit = async (id: string, updates: Partial<Note>) => {
    await updateNote(id, updates);
  };

  const handleNoteSubmit = async (raw: string) => {
    const trimmed = raw.trim();
    if (isBareUrl(trimmed)) {
      const urlMatch = trimmed.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        setReviewingUrl(urlMatch[0]);
        return;
      }
    }
    await addNote(trimmed);
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
            onTabChange={setActiveTab}
            noteCounts={noteCounts}
          />
          {searchQuery && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Searching across all categories
            </p>
          )}
        </div>

        {/* View toggle + Notes List */}
        {(activeNotes.length > 0 || doneNotes.length > 0) && (
          <div className="flex justify-end">
            <button
              onClick={() => setViewMode(viewMode === 'compact' ? 'expanded' : 'compact')}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title={viewMode === 'compact' ? 'Expanded view' : 'Compact view'}
            >
              {viewMode === 'compact' ? <CardIcon className="w-3.5 h-3.5" /> : <ListIcon className="w-3.5 h-3.5" />}
              {viewMode === 'compact' ? 'Expanded' : 'Compact'}
            </button>
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
              {searchQuery
                ? 'No notes match your search'
                : activeTab === 'all'
                ? 'No notes yet. Add your first one above!'
                : `No ${CATEGORIES[activeTab].name.toLowerCase()} yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active notes */}
            {activeNotes.length === 0 && doneNotes.length > 0 && (
              <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-6">
                All done here!
              </p>
            )}
            <div className={viewMode === 'compact' ? 'space-y-1' : 'space-y-2'}>
              {activeNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleDone={handleToggleDone}
                  compact={viewMode === 'compact'}
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
                  <div className={`mt-1 ${viewMode === 'compact' ? 'space-y-1' : 'space-y-2'}`}>
                    {doneNotes.map(note => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleDone={handleToggleDone}
                        compact={viewMode === 'compact'}
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

      {/* URL Review Modal */}
      {reviewingUrl && (
        <ReviewModal
          url={reviewingUrl}
          sharedText={share?.url === reviewingUrl ? share.text : undefined}
          onSave={addNote}
          onClose={() => setReviewingUrl(null)}
        />
      )}
    </div>
  );
}
