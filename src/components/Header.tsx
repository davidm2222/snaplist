'use client';

import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-serif tracking-tight text-zinc-900 dark:text-amber-400">
            SnapList
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block">
            everything in its place
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
