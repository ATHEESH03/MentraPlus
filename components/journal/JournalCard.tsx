'use client';
import React from 'react';
import { JournalEntry } from '@/lib/types';
import { fmtDate } from '@/lib/utils';

export function JournalCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl2 bg-card border border-line p-5 shadow-soft hover:border-teal/50 transition">
      <div className="flex justify-between items-start gap-2">
        <div>
          <span className="text-xs text-ink-mute font-medium">
            {fmtDate(entry.createdAt)}
          </span>
          {entry.title && (
            <h3 className="font-display text-lg text-ink mt-0.5">{entry.title}</h3>
          )}
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => onEdit(entry)}
            className="text-teal-deep hover:underline font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this reflection entry?')) {
                onDelete(entry.id);
              }
            }}
            className="text-coral-deep hover:underline font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      <p className="text-sm text-ink-soft whitespace-pre-wrap mt-2 line-clamp-4 leading-relaxed">
        {entry.body}
      </p>

      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-line/60">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] rounded-full bg-paper-deep px-2.5 py-0.5 text-ink-mute font-medium"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
