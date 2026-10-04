'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const I: Record<string, string> = {
  home: 'M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7H9v7H5a2 2 0 01-2-2z',
  map: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 0c3 3 3 15 0 20M2 12h20',
  plus: 'M12 5v14M5 12h14',
  mentora: 'M4 5h16v11H7l-3 3z',
  profile: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-5 0-9 3-9 6v1h18v-1c0-3-4-6-9-6z',
};

export default function BottomNav({ onMore }: { onMore: () => void }) {
  const p = usePathname();

  const item = (h: string, label: string) => {
    const key = h.split('/')[2] || 'home';
    const active = h === '/app/home' ? p === '/app/home' : p.startsWith(h);
    return (
      <Link
        href={h}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-col items-center gap-1 transition relative py-1 ${
          active ? 'text-teal-deep' : 'text-ink-mute hover:text-ink'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition ${
            active ? 'bg-teal/15 text-teal-deep' : ''
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? '2.4' : '1.8'}
          >
            <path d={I[key] || I.profile} />
          </svg>
        </div>
        <span
          className={`text-[10px] tracking-tight ${
            active ? 'font-bold text-teal-deep' : 'font-medium'
          }`}
        >
          {label}
        </span>
        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-teal absolute bottom-0 shadow-sm" />
        )}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 lg:hidden bg-card/95 backdrop-blur border-t border-line shadow-lift">
      <div className="mx-auto max-w-md h-20 grid grid-cols-5 items-center px-2">
        {item('/app/home', 'Home')}
        {item('/app/map', 'Map')}
        <Link
          href="/app/check-in"
          aria-label="New check-in"
          className="flex items-center justify-center group"
        >
          <span className="w-14 h-14 -mt-6 grid place-items-center rounded-full bg-coral text-white shadow-lift group-hover:scale-105 active:scale-95 transition-transform">
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d={I.plus} />
            </svg>
          </span>
        </Link>
        {item('/app/mentora', 'Mentora')}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center gap-1 text-ink-mute hover:text-ink py-1"
        >
          <div className="p-1.5 rounded-xl">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
