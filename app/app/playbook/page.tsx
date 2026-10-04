'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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

interface StudentActivity {
  id: string;
  name: string;
  category: string;
  duration: string;
  tag: 'Study & Focus' | 'Stress & Panic' | 'Sleep & Rest' | 'Movement' | 'Social';
  icon: string;
  instructions: string;
  whyUseful: string;
}

const SUGGESTED_STUDENT_ACTIVITIES: StudentActivity[] = [
  {
    id: 'pomodoro-25-5',
    name: '25/5 Study Sprint',
    category: 'Planning & task breakdown',
    duration: '25 mins',
    tag: 'Study & Focus',
    icon: '🎯',
    instructions: 'Put your phone in another room or on Do Not Disturb. Study for exactly 25 minutes, then stop for a 5-minute stretch.',
    whyUseful: 'Overcomes revision dread, sets clear boundaries, and prevents mental burnout during long study sessions.',
  },
  {
    id: 'exam-calm-478',
    name: '4-7-8 Exam Calm Reset',
    category: 'Breathing',
    duration: '2 mins',
    tag: 'Stress & Panic',
    icon: '🌬️',
    instructions: 'Inhale quietly through your nose for 4 seconds, gently hold for 7 seconds, then exhale completely through your mouth for 8 seconds. Repeat 4 times.',
    whyUseful: 'Physiologically triggers your parasympathetic brake, dropping racing pulse before tests or presentations.',
  },
  {
    id: 'brain-dump-worry',
    name: 'Brain-Dump Worry Parking Lot',
    category: 'Reflective writing',
    duration: '3 mins',
    tag: 'Stress & Panic',
    icon: '🧠',
    instructions: 'Before starting a study block or going to bed, write down every distracting thought, deadline, and worry on scratch paper, then close it.',
    whyUseful: 'Cleans working memory out of your brain onto paper so your mind stops cycling through open loops.',
  },
  {
    id: 'sunlight-walk-10',
    name: '10-Minute Sunlight & Walk Refresh',
    category: 'Movement breaks',
    duration: '10 mins',
    tag: 'Movement',
    icon: '👣',
    instructions: 'Step outside between study blocks without looking at screens. Walk at an easy pace and look at trees, sky, and horizon.',
    whyUseful: 'Resets circadian alertness, relieves near-distance eye strain from monitors, and clears heavy cognitive fog.',
  },
  {
    id: 'sensory-54321',
    name: '5-4-3-2-1 Sensory Grounding',
    category: 'Grounding',
    duration: '3 mins',
    tag: 'Stress & Panic',
    icon: '🌿',
    instructions: 'Silently identify 5 things you see, 4 things you can physically touch, 3 sounds you hear, 2 scents, and 1 taste.',
    whyUseful: 'Stops acute anxiety or sensory detachment in crowded libraries or exam halls by anchoring into physical reality.',
  },
  {
    id: 'one-bite-rule',
    name: "The 'One-Bite' 2-Minute Rule",
    category: 'Planning & task breakdown',
    duration: '2 mins',
    tag: 'Study & Focus',
    icon: '🍰',
    instructions: 'When paralyzed by an overwhelming assignment or paper, commit to doing only 2 minutes (e.g. create the document and write 1 sentence).',
    whyUseful: 'Starting is 90% of the cognitive friction; once the threshold is crossed, momentum naturally takes over.',
  },
  {
    id: 'digital-sunset-30',
    name: '30-Minute Digital Sunset',
    category: 'Rest & routines',
    duration: '30 mins',
    tag: 'Sleep & Rest',
    icon: '📵',
    instructions: 'Turn off screens 30 minutes before bed. Dim bright overhead lights and switch to audio, reading, or slow stretching.',
    whyUseful: 'Protects deep sleep architecture and hippocampal memory consolidation after a long day of learning.',
  },
  {
    id: 'study-buddy-checkin',
    name: 'Peer Accountability Check-in',
    category: 'Social connection',
    duration: '10 mins',
    tag: 'Social',
    icon: '☕',
    instructions: 'Send a voice note or grab coffee with a classmate to share one task you completed and one challenge you faced today.',
    whyUseful: 'Breaks academic isolation, normalizes student stress, and provides gentle mutual accountability.',
  },
];

export default function PlaybookPage() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter for suggested student activities
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // New Custom Strategy Form
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingActivityId, setAddingActivityId] = useState<string | null>(null);

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

  const handleAddCustom = async (e: React.FormEvent) => {
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
      setShowAddForm(false);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleAddSuggested = async (act: StudentActivity) => {
    if (!user || addingActivityId) return;
    setAddingActivityId(act.id);
    try {
      await saveStrategy(user.uid, {
        name: act.name,
        category: act.category,
        notes: `${act.instructions} (${act.duration})`,
        favorite: false,
      });
      await loadData();
    } catch (e) {
      console.error('Add suggested strategy error:', e);
    } finally {
      setAddingActivityId(null);
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

  const existingNames = new Set(
    strategies.map((s) => s.name.trim().toLowerCase())
  );

  const filteredSuggested =
    selectedTag === 'All'
      ? SUGGESTED_STUDENT_ACTIVITIES
      : SUGGESTED_STUDENT_ACTIVITIES.filter((a) => a.tag === selectedTag);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Strategy Playbook</h1>
        <p className="text-ink-soft text-sm mt-1 max-w-2xl leading-relaxed">
          Evidence-based wellbeing & study strategies designed for university life. Adopt high-impact activities, add your own custom techniques, and track what actually helps you through real check-ins.
        </p>
      </div>

      {/* SECTION 1: SUGGESTED STUDENT ACTIVITIES */}
      <div className="rounded-xl2 bg-gradient-to-b from-card to-paper-soft border border-line p-6 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-teal-deep">
              🌟 Curated for Students
            </span>
            <h2 className="font-display text-2xl text-ink mt-0.5">
              High-Impact Wellbeing & Study Activities
            </h2>
            <p className="text-xs text-ink-soft mt-1">
              Select any activity to add it directly to your personal playbook, or test it as an experiment.
            </p>
          </div>

          {/* Tag Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {['All', 'Study & Focus', 'Stress & Panic', 'Sleep & Rest', 'Movement', 'Social'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`text-xs px-3 py-1.5 rounded-full transition font-medium ${
                  selectedTag === tag
                    ? 'bg-teal text-white shadow-soft font-semibold'
                    : 'bg-paper-deep text-ink-soft hover:bg-paper-soft hover:text-ink'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Suggested Activities Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredSuggested.map((act) => {
            const isAlreadyAdded = existingNames.has(act.name.toLowerCase());
            const isBusy = addingActivityId === act.id;

            return (
              <div
                key={act.id}
                className="rounded-xl bg-card border border-line p-4.5 shadow-soft hover:border-teal/40 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-1 bg-paper-deep rounded-lg">
                        {act.icon}
                      </span>
                      <div>
                        <h3 className="font-display text-base text-ink font-semibold">
                          {act.name}
                        </h3>
                        <span className="text-[11px] font-medium text-teal-deep">
                          {act.category} • {act.duration}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-paper-deep text-ink-mute font-medium">
                      {act.tag}
                    </span>
                  </div>

                  <p className="text-xs text-ink-soft leading-relaxed">
                    {act.instructions}
                  </p>

                  <div className="text-[11px] text-ink-mute bg-paper-deep/60 p-2.5 rounded-lg border border-line/60">
                    <strong className="text-ink-soft font-semibold">Why it works:</strong>{' '}
                    {act.whyUseful}
                  </div>
                </div>

                <div className="pt-2 border-t border-line/50 flex flex-wrap items-center justify-between gap-2">
                  {isAlreadyAdded ? (
                    <span className="inline-flex items-center gap-1 text-xs text-teal-deep font-semibold bg-teal/10 px-3 py-1.5 rounded-lg">
                      <span>✓</span> In Your Playbook
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddSuggested(act)}
                      disabled={isBusy}
                      className="bg-ink text-paper px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-ink-soft transition shadow-soft disabled:opacity-50"
                    >
                      {isBusy ? 'Adding...' : '+ Add to My Playbook'}
                    </button>
                  )}

                  <Link
                    href={`/app/experiments/new?strategy=${encodeURIComponent(
                      act.name
                    )}&question=${encodeURIComponent(`Does practicing ${act.name} help reduce my study stress?`)}`}
                    className="text-xs text-coral-deep hover:underline font-medium"
                  >
                    Start 3-Day Test →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ADD CUSTOM STRATEGY & YOUR CATALOG */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">Your Saved Strategies</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Strategies catalogued for your check-ins and evidence tracking.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm((s) => !s)}
            className="bg-coral text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-coral-deep transition shadow-soft"
          >
            {showAddForm ? '✕ Close Form' : '+ Add Custom Strategy'}
          </button>
        </div>

        {/* Custom Strategy Form (Collapsible or toggleable) */}
        {showAddForm && (
          <div className="rounded-xl2 bg-card border-2 border-teal/30 p-6 shadow-soft space-y-4 animate-breathe-in">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-lg text-ink font-semibold">
                Add Your Custom Strategy
              </h3>
              <span className="text-xs text-ink-mute">
                Unique tools that work for your routine
              </span>
            </div>

            <form onSubmit={handleAddCustom} className="space-y-4">
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
                          ? 'bg-teal text-white border-teal shadow-soft font-semibold'
                          : 'bg-paper-soft border-line text-ink-soft hover:bg-paper-deep'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ink-mute block mb-1 font-medium">Strategy Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 5-minute cold water splash, piano break"
                    className="w-full rounded-xl border border-line bg-paper-soft p-3 text-sm text-ink focus:border-teal focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-mute block mb-1 font-medium">Notes & Reminders (Optional)</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Do this right after turning off zoom"
                    className="w-full rounded-xl border border-line bg-paper-soft p-3 text-sm text-ink focus:border-teal focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!name.trim() || saving}
                  className="bg-ink text-paper px-6 py-2.5 rounded-xl text-xs font-semibold hover:bg-ink-soft transition shadow-soft disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Save Strategy'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-paper-deep text-ink-soft px-4 py-2.5 rounded-xl text-xs font-medium hover:bg-paper-soft"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Strategies Grid */}
        {strategies.length === 0 ? (
          <div className="rounded-xl2 bg-paper-soft border border-line p-8 text-center text-xs text-ink-mute">
            No strategies registered in your personal catalog yet. Click "+ Add to My Playbook" on any suggested activity above or add a custom strategy.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {strategies.map((s) => {
              const ev = getEvidence(s);
              const helpful = ev.filter(
                (c) => c.outcome === 'better' || c.outcome === 'helpful'
              ).length;
              const helpfulRate = ev.length > 0 ? Math.round((helpful / ev.length) * 100) : 0;

              return (
                <div
                  key={s.id}
                  className="rounded-xl2 bg-card border border-line p-5 shadow-soft space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-display text-base text-ink font-semibold">
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
                    <span className="inline-block text-[11px] font-medium text-teal-deep bg-teal/10 px-2.5 py-0.5 rounded-full mt-1">
                      {s.category}
                    </span>
                    {s.notes && (
                      <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                        {s.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-xs p-3 rounded-xl bg-paper-soft border border-line text-ink-soft space-y-1">
                    {ev.length === 0 ? (
                      <span className="italic text-ink-mute text-[11px]">
                        Not yet logged in check-ins — select this during your next check-in to build personal evidence.
                      </span>
                    ) : (
                      <div>
                        <div className="flex justify-between items-baseline">
                          <span>
                            Logged in <strong>{ev.length}</strong> check-in{ev.length === 1 ? '' : 's'}
                          </span>
                          <span className={`font-semibold ${helpfulRate >= 60 ? 'text-teal-deep' : 'text-amber-600'}`}>
                            {helpfulRate}% helpful
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-mute mt-1">
                          {helpfulRate >= 60
                            ? 'Reliably effective for you.'
                            : 'Mixed outcomes — keep exploring.'}
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
