'use client';

import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold font-serif tracking-tight text-shelf transition-colors">
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
