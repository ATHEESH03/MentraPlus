'use client';
import React from 'react';
import Link from 'next/link';
import { Composer } from '@/components/community/Composer';

export default function NewPostPage() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <Link
          href="/app/community"
          className="text-xs text-ink-mute hover:text-ink font-medium"
        >
          ← Back to Circles
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl text-ink mt-2">
          Share with Circles
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Share a helpful strategy, question, or gentle reflection with fellow students.
        </p>
      </div>

      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft">
        <Composer />
      </div>
    </div>
  );
}
