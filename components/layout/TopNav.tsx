import React from 'react';
import Link from 'next/link';
import { UserProfile } from '@/lib/types';

const LINKS = [
  ['/app/home', 'Home'],
  ['/app/map', 'Response Map'],
  ['/app/journal', 'Journal'],
  ['/app/assess', 'Assess'],
  ['/app/playbook', 'Playbook'],
  ['/app/progress', 'Progress'],
  ['/app/community', 'Circles'],
  ['/app/studio', 'Studio'],
  ['/app/mentora', 'Mentora'],
];

export default function TopNav({
  profile,
  onMore,
  onLogout,
}: {
  profile: UserProfile;
  onMore: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/app/home" className="font-display text-2xl tracking-tight text-ink">
          Mentra<span className="text-coral">+</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1 mx-auto">
          {LINKS.map(([h, l]) => (
            <Link
              key={h}
              href={h}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-ink-soft hover:text-ink hover:bg-paper-deep transition"
            >
              {l}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            onClick={onMore}
            className="lg:hidden rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-deep"
          >
            More
          </button>
          <Link
            href="/app/profile"
            className="text-sm font-medium text-ink-soft hover:text-ink hidden sm:block px-2 py-1 rounded-md hover:bg-paper-deep"
          >
            {profile.displayName}
          </Link>
          <button
            onClick={onLogout}
            className="text-sm font-medium text-coral-deep hover:text-red-700 px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
