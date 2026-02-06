'use client';

import { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import Link from 'next/link';

interface SupabaseNote {
  title: string;
  notes: string;
  raw: string;
  tags: string[];
  hash_tags: string[];
  fields: Record<string, string>;
  timestamp: number;
}

interface ExportData {
  notes: SupabaseNote[];
  customSubtypes?: unknown[];
}

export default function ImportPage() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !db) return;

    setStatus('importing');
    setError('');
    setProgress('Reading file...');

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      if (!data.notes || !Array.isArray(data.notes)) {
        throw new Error('Invalid export file: missing notes array');
      }

      const total = data.notes.length;
      let imported = 0;

      setProgress(`Importing ${total} notes...`);

      for (const note of data.notes) {
        const firebaseNote = {
          userId: user.uid,
          title: note.title || '',
          notes: note.notes || '',
          raw: note.raw || '',
          tags: note.tags || [],
          hashTags: note.hash_tags || [],
          fields: note.fields || {},
          timestamp: note.timestamp || Date.now(),
        };

        await addDoc(collection(db, 'notes'), firebaseNote);
        imported++;
        setProgress(`Imported ${imported}/${total} notes...`);
        setImportedCount(imported);
      }

      setStatus('success');
      setProgress('');
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Import failed');
      setStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal isOpen={true} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="max-w-md mx-auto pt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to SnapList
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h1 className="text-xl font-semibold font-serif text-zinc-900 dark:text-zinc-100 mb-2">
            Import Data
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Upload your Supabase export file to import your notes.
          </p>

          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <p className="text-lg font-medium font-serif text-zinc-900 dark:text-zinc-100 mb-1">
                Import Complete!
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                {importedCount} notes imported successfully
              </p>
              <Link
                href="/"
                className="inline-flex px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-900 font-semibold transition-all"
              >
                View Your Notes
              </Link>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={status === 'importing'}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={status === 'importing'}
                className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-600 dark:hover:border-amber-400 dark:hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {status === 'importing' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    {progress}
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Click to select your export file
                  </span>
                )}
              </button>

              {status === 'error' && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500 text-center">
                Looking for your export file? It should be named<br />
                <code className="text-zinc-500 dark:text-zinc-400">snaplist-export-*.json</code>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
