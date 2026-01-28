'use client';

import { useState, useMemo } from 'react';
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

export function SnapList() {
  const { user, loading: authLoading } = useAuth();
  const { notes, loading: notesLoading, addNote, updateNote, deleteNote } = useNotes();
  const [activeTab, setActiveTab] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Calculate note counts per category
  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notes.length };
    for (const note of notes) {
      const category = note.tags[0] || 'other';
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, [notes]);

  // Filter notes - search is GLOBAL, category filter only applies when not searching
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // If searching, search ALL notes globally (ignore category tab)
    if (searchQuery.trim()) {
      const terms = searchQuery.toLowerCase().split(' ').filter(Boolean);
      filtered = filtered.filter(note => {
        const searchableText = [
          note.title,
          note.notes,
          note.raw,
          ...note.tags,
          ...note.hashTags,
          ...Object.keys(note.fields),
          ...Object.values(note.fields),
        ].join(' ').toLowerCase();

        return terms.every(term => searchableText.includes(term));
      });
    } else {
      // No search query - filter by category tab
      if (activeTab !== 'all') {
        filtered = filtered.filter(note => note.tags.includes(activeTab));
      }
    }

    return filtered;
  }, [notes, activeTab, searchQuery]);

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

  // Show auth modal if not logged in
  if (!authLoading && !user) {
    return <AuthModal isOpen={true} />;
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Input with autocomplete */}
        <NoteInput onSubmit={addNote} disabled={notesLoading} notes={notes} />

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

        {/* Notes List */}
        {notesLoading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">
              {searchQuery ? '🔍' : CATEGORIES[activeTab].icon}
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
          <div className="space-y-3">
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
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
    </div>
  );
}
