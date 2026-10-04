'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/95 backdrop-blur border-b border-line shadow-xs">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/app/home" className="font-display text-2xl tracking-tight text-ink flex items-center gap-1 group">
          <span>Mentra</span>
          <span className="text-coral font-bold group-hover:scale-110 transition-transform">+</span>
        </Link>

        {/* Desktop Navigation with Prominent Active Tab Highlight */}
        <nav className="hidden lg:flex items-center gap-1 mx-auto bg-paper-deep/60 p-1 rounded-xl border border-line/60">
          {LINKS.map(([h, l]) => {
            const isActive =
              h === '/app/home'
                ? pathname === '/app/home'
                : pathname === h || pathname.startsWith(h + '/');
            return (
              <Link
                key={h}
                href={h}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal text-white shadow-soft font-semibold ring-1 ring-teal/30 scale-[1.02]'
                    : 'text-ink-soft hover:text-ink hover:bg-paper'
                }`}
              >
                {l}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            onClick={onMore}
            className="lg:hidden rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-deep bg-card"
          >
            Explore Menu
          </button>
          <Link
            href="/app/profile"
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition hidden sm:flex items-center gap-1.5 ${
              pathname === '/app/profile'
                ? 'bg-teal/15 text-teal-deep font-semibold border border-teal/30'
                : 'text-ink-soft hover:text-ink hover:bg-paper-deep'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal" />
            {profile.displayName}
          </Link>
          <button
            onClick={onLogout}
            className="text-xs font-medium text-coral-deep hover:text-red-700 px-2 py-1 rounded-lg hover:bg-coral/10 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
