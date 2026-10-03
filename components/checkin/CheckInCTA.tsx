'use client';
import React from 'react';
import Link from 'next/link';

export default function CheckInCTA() {
  return (
    <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-r from-teal-deep to-teal p-6 text-paper shadow-lift">
      <div className="max-w-xl relative z-10">
        <span className="text-xs uppercase tracking-wider text-sage-soft font-semibold">
          Daily Pause
        </span>
        <h2 className="font-display text-2xl sm:text-3xl mt-1 text-white">
          How is today feeling?
        </h2>
        <p className="text-paper/85 text-sm mt-2">
          Take 60 seconds to notice your situation, what you’re feeling, and what you’re trying. Every check-in builds your Response Map.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/app/check-in"
            className="inline-flex items-center justify-center font-medium transition rounded-xl text-sm px-5 py-2.5 bg-coral text-white hover:bg-coral-deep shadow-soft"
          >
            Check in now
          </Link>
          <Link
            href="/app/studio"
            className="inline-flex items-center justify-center font-medium transition rounded-xl text-sm px-4 py-2.5 bg-white/15 text-white hover:bg-white/25"
          >
            Breathing studio
          </Link>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
}
