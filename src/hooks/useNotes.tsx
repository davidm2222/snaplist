'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Note, CategoryKey } from '@/types';
import { useAuth } from './useAuth';
import { parseNote } from '@/lib/parseNote';

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for notes
  useEffect(() => {
    if (!user || !db) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notesData: Note[] = [];
        snapshot.forEach((doc) => {
          notesData.push({ id: doc.id, ...doc.data() } as Note);
        });
        setNotes(notesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notes:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Add a new note
  const addNote = useCallback(async (raw: string) => {
    if (!user) throw new Error('Must be logged in');
    if (!db) throw new Error('Database not initialized');

    const parsed = parseNote(raw);

    const noteData = {
      userId: user.uid,
      raw,
      title: parsed.title,
      tags: parsed.tags,
      hashTags: parsed.hashTags,
      fields: parsed.fields,
      notes: parsed.notes,
      timestamp: Date.now(),
    };

    try {
      await addDoc(collection(db, 'notes'), noteData);
    } catch (err) {
      console.error('Error adding note:', err);
      throw err;
    }
  }, [user]);

  // Update an existing note
  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    if (!user) throw new Error('Must be logged in');
    if (!db) throw new Error('Database not initialized');

    try {
      await updateDoc(doc(db, 'notes', id), updates);
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  }, [user]);

  // Delete a note
  const deleteNote = useCallback(async (id: string) => {
    if (!user) throw new Error('Must be logged in');
    if (!db) throw new Error('Database not initialized');

    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (err) {
      console.error('Error deleting note:', err);
      throw err;
    }
  }, [user]);

  // Filter notes by category
  const getNotesByCategory = useCallback((category: CategoryKey | 'all') => {
    if (category === 'all') return notes;
    return notes.filter(note => note.tags.includes(category));
  }, [notes]);

  // Search notes
  const searchNotes = useCallback((query: string) => {
    if (!query.trim()) return notes;

    const terms = query.toLowerCase().split(' ').filter(Boolean);

    return notes.filter(note => {
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
  }, [notes]);

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    getNotesByCategory,
    searchNotes,
  };
}
