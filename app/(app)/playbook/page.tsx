'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  listStrategies,
  saveStrategy,
  toggleFavorite,
} from '@/lib/data/strategies';
import { allCheckIns } from '@/lib/data/checkIns';
import { Strategy, CheckIn } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';

const CATEGORIES = [
  'Movement breaks',
  'Grounding',
  'Breathing',
  'Planning & task breakdown',
  'Reflective writing',
  'Social connection',
  'Rest & routines',
  'Mindful pauses',
];

export default function PlaybookPage() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  // New Strategy Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [strats, cis] = await Promise.all([
        listStrategies(user.uid),
        allCheckIns(user.uid),
      ]);
      setStrategies(strats);
      setCheckIns(cis);
    } catch (e) {
      console.error('Playbook load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || saving) return;

    setSaving(true);
    try {
      await saveStrategy(user.uid, {
        name: name.trim(),
        category,
        notes: notes.trim() || undefined,
        favorite: false,
      });
      setName('');
      setNotes('');
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async (s: Strategy) => {
    if (!user) return;
    await toggleFavorite(user.uid, s.id, !s.favorite);
    setStrategies((prev) =>
      prev.map((item) =>
        item.id === s.id ? { ...item, favorite: !s.favorite } : item
      )
    );
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  const getEvidence = (s: Strategy) =>
    checkIns.filter((c) =>
      (c.strategiesUsed || []).some(
        (used) => used.trim().toLowerCase() === s.name.trim().toLowerCase()
      )
    );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Your Playbook</h1>
        <p className="text-ink-soft text-sm mt-1 max-w-2xl leading-relaxed">
          Strategies you have explored or flagged. A strategy is only labeled “helpful for you” when backed by your own recorded check-in outcomes.
        </p>
      </div>

      {/* Add New Strategy Card */}
      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft space-y-4">
        <h2 className="font-display text-lg text-ink">Add a Strategy</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide font-medium text-ink-mute block mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs rounded-full px-3.5 py-1.5 border transition ${
                    category === cat
                      ? 'bg-teal text-white border-teal shadow-soft'
                      : 'bg-paper-soft border-line text-ink-soft hover:bg-paper-deep'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Strategy name (e.g. 5-minute stroll, box breathing)"
              className="w-full rounded-xl border border-line bg-paper-soft p-3 text-sm text-ink focus:border-teal focus:outline-none"
              required
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal tips or reminders (optional)"
              className="w-full rounded-xl border border-line bg-paper-soft p-3 text-sm text-ink focus:border-teal focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="bg-ink text-paper px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-ink-soft transition shadow-soft disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add to Playbook'}
          </button>
        </form>
      </div>

      {/* Strategies Grid */}
      <div className="space-y-4">
        <h2 className="font-display text-xl text-ink">Catalogued Strategies</h2>
        {strategies.length === 0 ? (
          <div className="rounded-xl2 bg-paper-soft border border-line p-8 text-center text-xs text-ink-mute">
            No strategies registered yet. Add one above or select strategies during your check-ins.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {strategies.map((s) => {
              const ev = getEvidence(s);
              const helpful = ev.filter(
                (c) => c.outcome === 'better' || c.outcome === 'helpful'
              ).length;

              return (
                <div
                  key={s.id}
                  className="rounded-xl2 bg-card border border-line p-5 shadow-soft space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-display text-lg text-ink font-semibold">
                        {s.name}
                      </h3>
                      <button
                        onClick={() => handleToggleFavorite(s)}
                        className={`text-lg transition ${
                          s.favorite ? 'text-amber-500' : 'text-ink-mute hover:text-amber-500'
                        }`}
                        aria-label="Toggle favorite"
                      >
                        {s.favorite ? '★' : '☆'}
                      </button>
                    </div>
                    <span className="inline-block text-[11px] font-medium text-teal-deep bg-teal/10 px-2 py-0.5 rounded-full mt-1">
                      {s.category}
                    </span>
                    {s.notes && (
                      <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                        {s.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-xs p-3 rounded-xl bg-paper-soft border border-line text-ink-soft">
                    {ev.length === 0 ? (
                      <span className="italic text-ink-mute">
                        No recorded usage yet — an option to try in your next check-in.
                      </span>
                    ) : (
                      <div>
                        Tried in <strong>{ev.length}</strong> check-in
                        {ev.length === 1 ? '' : 's'}; reported helpful in{' '}
                        <strong className="text-teal-deep">{helpful}</strong>.
                        <div className="text-[11px] text-ink-mute mt-1">
                          {helpful / ev.length >= 0.6
                            ? 'Frequently reported helpful for you.'
                            : 'Mixed results so far — keep testing.'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
