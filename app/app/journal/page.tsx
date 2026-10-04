'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  listJournal,
  saveJournal,
  updateJournal,
  deleteJournal,
} from '@/lib/data/journal';
import { JournalEntry } from '@/lib/types';
import { JournalEditor } from '@/components/journal/JournalEditor';
import { JournalCard } from '@/components/journal/JournalCard';
import { Spinner } from '@/components/ui/Spinner';

export default function JournalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const load = async () => {
    if (!user) return;
    try {
      const data = await listJournal(user.uid);
      setEntries(data);
    } catch (e) {
      console.error('Failed to load journal:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleSave = async (data: {
    title?: string;
    body: string;
    tags: string[];
  }) => {
    if (!user) return;
    if (editingEntry) {
      await updateJournal(user.uid, editingEntry.id, data);
      setEditingEntry(null);
    } else {
      await saveJournal(user.uid, { ...data, linkedIds: [] });
    }
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteJournal(user.uid, id);
    if (editingEntry?.id === id) setEditingEntry(null);
    await load();
  };

  const filtered = entries.filter((e) => {
    const matchesSearch =
      !search ||
      e.body.toLowerCase().includes(search.toLowerCase()) ||
      (e.title || '').toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || (e.tags || []).includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags || [])));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Private Journal</h1>
        <p className="text-ink-soft text-sm mt-1">
          A reflective, unhurried space for personal thoughts. Stored with full owner-only encryption in Firestore.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* Editor Column */}
        <div className="lg:col-span-3 rounded-xl2 bg-card border border-line p-6 shadow-soft">
          <h2 className="font-display text-xl text-ink mb-4">
            {editingEntry ? 'Edit Reflection' : 'New Reflection'}
          </h2>
          <JournalEditor
            editingEntry={editingEntry}
            onSave={handleSave}
            onCancel={() => setEditingEntry(null)}
          />
        </div>

        {/* Entries List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reflections..."
              className="w-full rounded-xl border border-line bg-card p-2.5 text-xs text-ink focus:border-teal focus:outline-none"
            />
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center pt-1">
                <span className="text-[11px] text-ink-mute mr-1 font-medium">Tags:</span>
                <button
                  onClick={() => setSelectedTag('')}
                  className={`text-[11px] rounded-full px-2.5 py-0.5 border ${
                    !selectedTag
                      ? 'bg-ink text-paper'
                      : 'bg-paper-soft text-ink-mute border-line'
                  }`}
                >
                  All
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t === selectedTag ? '' : t)}
                    className={`text-[11px] rounded-full px-2.5 py-0.5 border ${
                      selectedTag === t
                        ? 'bg-teal text-paper border-teal'
                        : 'bg-paper-soft text-ink-mute border-line'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="sm" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl2 bg-paper-soft border border-line p-8 text-center text-xs text-ink-mute">
              {entries.length === 0
                ? 'No journal entries yet. Use the editor to capture your first reflection.'
                : 'No entries matched your search or tag filter.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  onEdit={(item) => {
                    setEditingEntry(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
