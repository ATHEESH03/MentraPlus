'use client';
import React from 'react';
import Link from 'next/link';

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

const ITEMS = [
  { href: '/app/map', label: 'Response Map', icon: '🗺️' },
  { href: '/app/insights', label: 'Insights & Patterns', icon: '💡' },
  { href: '/app/experiments', label: 'Experiments', icon: '🧪' },
  { href: '/app/playbook', label: 'Playbook', icon: '📖' },
  { href: '/app/progress', label: 'Progress Charts', icon: '📈' },
  { href: '/app/assess', label: 'Self-Assessments', icon: '📋' },
  { href: '/app/community', label: 'Circles (Community)', icon: '👥' },
  { href: '/app/studio', label: 'Studio (Breathing)', icon: '🫧' },
  { href: '/app/profile', label: 'Profile & Privacy', icon: '⚙️' },
];

export default function MoreSheet({ open, onClose }: MoreSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-sm lg:hidden">
      <div className="w-4/5 max-w-sm h-full bg-card border-l border-line p-6 flex flex-col shadow-lift overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <span className="font-display text-lg text-ink">Explore Mentra+</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-paper-deep text-ink-mute flex items-center justify-center font-bold"
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>

        <nav className="mt-6 space-y-2 flex-1">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-ink-soft hover:bg-paper-deep hover:text-ink transition text-sm font-medium"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-line text-xs text-ink-mute">
          Personal wellbeing learning · Private by design
        </div>
      </div>
    </div>
  );
}
