'use client';
import React, { useState, useEffect } from 'react';
import { JournalEntry } from '@/lib/types';

const PROMPTS = [
  'What happened today that stayed on your mind?',
  'What felt difficult or heavy?',
  'What did you need most at that moment?',
  'What did you try to support yourself?',
  'What is one small thing worth remembering?',
];

export function JournalEditor({
  editingEntry,
  onSave,
  onCancel,
}: {
  editingEntry: JournalEntry | null;
  onSave: (entry: { title?: string; body: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title || '');
      setBody(editingEntry.body || '');
      setTags((editingEntry.tags || []).join(', '));
    } else {
      setTitle('');
      setBody('');
      setTags('');
    }
  }, [editingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || busy) return;

    setBusy(true);
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onSave({
        title: title.trim() || undefined,
        body: body.trim(),
        tags: parsedTags,
      });
      if (!editingEntry) {
        setTitle('');
        setBody('');
        setTags('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wide font-medium text-ink-mute block mb-2">
          Prompts for reflection
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setBody((prev) => (prev ? `${prev}\n\n${p}\n` : `${p}\n\n`))}
              className="text-xs rounded-full border border-line bg-card px-3 py-1 text-ink-soft hover:bg-paper-deep transition"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none"
      />

      <textarea
        rows={7}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write freely. This space is private to you."
        className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none leading-relaxed"
        required
      />

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags, comma-separated (e.g. study, stress, routine)"
        className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!body.trim() || busy}
          className="bg-ink text-paper px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-ink-soft transition disabled:opacity-50"
        >
          {busy ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
        </button>
        {editingEntry && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-line text-sm text-ink-mute hover:text-ink transition"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-xs text-ink-mute">
        Reflections are stored in your owner-only private database. They are never public, and only shared with Mentora if you explicitly opt in under Profile → Privacy.
      </p>
    </form>
  );
}
