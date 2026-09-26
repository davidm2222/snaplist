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
  deleteField,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Note, NoteDraft } from '@/types';
import { useAuth } from './useAuth';
import { normalizeDraft } from '@/lib/notes';

// The single place a draft becomes Firestore data. `tags` mirrors shelf so older code
// (and a rollback) still works; drop it with the legacy-field cleanup.
function toFirestore(draft: NoteDraft) {
  const d = normalizeDraft(draft);
  return {
    shelf: d.shelf,
    tags: [d.shelf],
    type: d.type,
    title: d.title,
    notes: d.notes,
    fields: d.fields,
    hashTags: d.hashTags,
  };
}

export function useNotes() {
  const { user } = useAuth();
  // Result of the listener, tagged with the uid it belongs to so a stale
  // result (signed out, or a different account) is never shown.
  const [result, setResult] = useState<{ uid: string; notes: Note[]; error: string | null } | null>(null);
  const current = user && result?.uid === user.uid ? result : null;
  const notes = current?.notes ?? [];
  const error = current?.error ?? null;
  const loading = Boolean(user && db && !current);

  // Real-time listener for notes
  useEffect(() => {
    if (!user || !db) return;
    const uid = user.uid;

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notesData: Note[] = [];
        snapshot.forEach((doc) => {
          notesData.push({ id: doc.id, ...doc.data() } as Note);
        });
        setResult({ uid, notes: notesData, error: null });
      },
      (err) => {
        console.error('Error fetching notes:', err);
        setResult((prev) => ({ uid, notes: prev?.uid === uid ? prev.notes : [], error: err.message }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Create a note. raw = what the user originally entered (typed text or shared URL).
  const addNote = useCallback(async (draft: NoteDraft, raw: string) => {
    if (!user) throw new Error('Must be logged in');
    if (!db) throw new Error('Database not initialized');

    const { type, ...content } = toFirestore(draft);
    const now = Date.now();
    await addDoc(collection(db, 'notes'), {
      ...content,
      ...(type ? { type } : {}),
      userId: user.uid,
      raw,
      timestamp: now,
      updatedAt: now,
    });
  }, [user]);

  // Replace a note's content. Never touches raw, timestamp, or done.
  const saveNote = useCallback(async (id: string, draft: NoteDraft) => {
    if (!user) throw new Error('Must be logged in');
    if (!db) throw new Error('Database not initialized');

    const { type, ...content } = toFirestore(draft);
    await updateDoc(doc(db, 'notes', id), {
      ...content,
      type: type ?? deleteField(),
      updatedAt: Date.now(),
    });
  }, [user]);

  const setDone = useCallback(async (id: string, done: boolean) => {
    if (!user) throw new Error('Must be logged in');
    if (!db) throw new Error('Database not initialized');

    await updateDoc(doc(db, 'notes', id), { done, updatedAt: Date.now() });
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

  return {
    notes,
    loading,
    error,
    addNote,
    saveNote,
    setDone,
    deleteNote,
  };
}
