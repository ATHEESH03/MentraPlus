'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { saveCheckIn } from '@/lib/data/checkIns';
import { saveAchievement } from '@/lib/data/achievements';
import { Mood, Outcome } from '@/lib/types';
import { Chip } from '@/components/ui/Chip';
import { Slider } from '@/components/ui/Slider';

const MOODS: Mood[] = [
  'calm',
  'content',
  'focused',
  'anxious',
  'overwhelmed',
  'low',
  'tired',
  'irritated',
];
const OUTCOMES: Outcome[] = ['better', 'helpful', 'no-change', 'worse', 'uncertain'];
const TIME_OF_DAY_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;

function getDefaultTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 22) return 'Evening';
  return 'Night';
}

const SITUATIONS = [
  'Academic pressure',
  'Social situation',
  'Family',
  'Health',
  'Money',
  'Sleep',
  'Other',
];
const COMMON_STRATEGIES = [
  'Short walk',
  'Breathing',
  'Break it down',
  'Talk to someone',
  'Rest',
  'Journal',
  'Music pause',
  'Grounding',
];

export default function CheckInForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [timeOfDay, setTimeOfDay] = useState<string>(getDefaultTimeOfDay());
  const [loggedAt, setLoggedAt] = useState<number | null>(null);
  const [mood, setMood] = useState<Mood | ''>('');
  const [intensity, setIntensity] = useState(50);
  const [energy, setEnergy] = useState(50);
  const [stress, setStress] = useState(50);
  const [situation, setSituation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [thought, setThought] = useState('');
  const [strats, setStrats] = useState<string[]>([]);
  const [customStrat, setCustomStrat] = useState('');
  const [outcome, setOutcome] = useState<Outcome | ''>('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || !mood || busy) return;

    setBusy(true);
    setErr('');

    const finalStrategies = [...strats];
    if (customStrat.trim() && !finalStrategies.includes(customStrat.trim())) {
      finalStrategies.push(customStrat.trim());
    }

    try {
      const finalContextTags = [timeOfDay, ...tags.filter((t) => t !== timeOfDay)];
      const checkInData: any = {
        mood,
        intensity,
        energy,
        stress,
        situation: situation.trim() || 'General state',
        contextTags: finalContextTags,
        strategiesUsed: finalStrategies,
        outcome: outcome || 'uncertain',
      };
      if (thought.trim()) {
        checkInData.thought = thought.trim();
      }
      await saveCheckIn(user.uid, checkInData);

      try {
        await saveAchievement(user.uid, {
          key: 'first-checkin',
          title: 'First check-in',
          description: 'You recorded a first wellbeing check-in.',
        });
      } catch {
        // Achievement is non-blocking
      }

      setLoggedAt(Date.now());
      setDone(true);
    } catch (e: any) {
      console.error('Save check-in error:', e);
      if (e?.code === 'permission-denied') {
        setErr('Firestore permission denied: Your database rules currently block writes. Please update your Rules in Firebase Console.');
      } else {
        setErr(e?.message || 'Could not save check-in. Please verify your connection and try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl2 bg-card border border-line p-8 sm:p-10 text-center shadow-soft animate-breathe-in max-w-lg mx-auto">
        <div className="w-16 h-16 bg-sage/20 text-teal-deep rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h2 className="font-display text-2xl text-ink">Check-in saved</h2>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-soft border border-line text-xs text-teal-deep font-semibold">
          <span>{timeOfDay === 'Morning' ? '🌅' : timeOfDay === 'Afternoon' ? '☀️' : timeOfDay === 'Evening' ? '🌆' : '🌙'}</span>
          <span>{timeOfDay} check-in recorded at {loggedAt ? new Date(loggedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'now'}</span>
        </div>
        <p className="text-ink-soft text-sm mt-3 max-w-sm mx-auto leading-relaxed">
          Thank you! You can check in multiple times each day — whenever your focus, mood, or energy levels change.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/app/home')}
            className="bg-teal text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-deep transition shadow-soft"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              setMood('');
              setIntensity(50);
              setEnergy(50);
              setStress(50);
              setSituation('');
              setThought('');
              setStrats([]);
              setCustomStrat('');
              setOutcome('');
              setDone(false);
            }}
            className="bg-paper-deep text-ink px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-paper-soft border border-line transition"
          >
            + Log another check-in
          </button>
          <button
            type="button"
            onClick={() => router.push('/app/map')}
            className="text-xs text-ink-soft hover:text-teal-deep underline py-2.5 px-2"
          >
            Response Map →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6">
      {/* Multiple Check-ins Encouragement Banner */}
      <div className="rounded-xl2 bg-paper-soft border border-teal/20 p-4 flex items-start gap-3">
        <div className="text-xl">☀️</div>
        <div className="text-xs text-ink-soft leading-relaxed">
          <span className="font-semibold text-ink">Log anytime throughout your day:</span> Mentra+ supports multiple check-ins per day so you can capture morning energy, midday study slumps, and evening wind-downs.
        </div>
      </div>

      {/* Time of Day Selector */}
      <div className="rounded-xl2 bg-paper-soft border border-line p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wide font-semibold text-ink-mute">
            Check-in Period
          </label>
          <span className="text-[11px] text-teal-deep font-medium">Auto-detected for now</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TIME_OF_DAY_OPTIONS.map((tod) => (
            <Chip
              key={tod}
              active={timeOfDay === tod}
              onClick={() => setTimeOfDay(tod)}
            >
              {tod === 'Morning' && '🌅 '}
              {tod === 'Afternoon' && '☀️ '}
              {tod === 'Evening' && '🌆 '}
              {tod === 'Night' && '🌙 '}
              {tod}
            </Chip>
          ))}
        </div>
      </div>

      <div className="rounded-xl2 bg-paper-soft border border-line p-5">
        <label className="text-xs uppercase tracking-wide font-semibold text-ink-mute block mb-2">
          1. How are you feeling right now?
        </label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Chip key={m} active={mood === m} onClick={() => setMood(m)}>
              {m}
            </Chip>
          ))}
        </div>
        <Slider label="Emotional Intensity" value={intensity} onChange={setIntensity} />
      </div>

      <div className="rounded-xl2 bg-paper-soft border border-line p-5">
        <label className="text-xs uppercase tracking-wide font-semibold text-ink-mute block mb-2">
          2. What’s the situation or trigger?
        </label>
        <div className="flex flex-wrap gap-2">
          {SITUATIONS.map((s) => (
            <Chip key={s} active={situation === s} onClick={() => setSituation(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <div className="mt-3">
          <input
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="Or type specific context..."
            className="w-full rounded-xl border border-line bg-card p-3 text-sm focus:border-teal focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl2 bg-paper-soft border border-line p-5">
        <label className="text-xs uppercase tracking-wide font-semibold text-ink-mute block mb-2">
          3. Thoughts or reflections (optional)
        </label>
        <textarea
          rows={3}
          value={thought}
          onChange={(e) => setThought(e.target.value)}
          className="w-full rounded-xl border border-line bg-card p-3 text-sm focus:border-teal focus:outline-none"
          placeholder="What’s crossing your mind right now?"
        />
      </div>

      <div className="rounded-xl2 bg-paper-soft border border-line p-5">
        <label className="text-xs uppercase tracking-wide font-semibold text-ink-mute block mb-2">
          4. What did you try? (strategies)
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_STRATEGIES.map((s) => (
            <Chip
              key={s}
              active={strats.includes(s)}
              onClick={() => toggle(strats, s, setStrats)}
            >
              {s}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={customStrat}
            onChange={(e) => setCustomStrat(e.target.value)}
            placeholder="Other strategy tried..."
            className="flex-1 rounded-xl border border-line bg-card p-2.5 text-sm focus:border-teal focus:outline-none"
          />
          {customStrat.trim() && (
            <button
              type="button"
              onClick={() => {
                if (!strats.includes(customStrat.trim())) {
                  setStrats([...strats, customStrat.trim()]);
                  setCustomStrat('');
                }
              }}
              className="bg-paper-deep text-ink px-4 rounded-xl text-xs font-medium"
            >
              Add
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl2 bg-paper-soft border border-line p-5">
        <label className="text-xs uppercase tracking-wide font-semibold text-ink-mute block mb-2">
          5. How did it turn out? (outcome)
        </label>
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <Chip key={o} active={outcome === o} onClick={() => setOutcome(o)}>
              {o}
            </Chip>
          ))}
        </div>
      </div>

      <div className="rounded-xl2 bg-paper-soft border border-line p-5">
        <label className="text-xs uppercase tracking-wide font-semibold text-ink-mute block mb-2">
          Energy & Stress levels
        </label>
        <Slider label="Energy" value={energy} onChange={setEnergy} />
        <Slider label="Stress" value={stress} onChange={setStress} />
      </div>

      {err && <p className="text-coral-deep text-sm">{err}</p>}

      <button
        type="submit"
        disabled={!mood || busy}
        className="w-full sm:w-auto bg-coral text-white px-8 py-3 rounded-xl font-medium shadow-soft hover:bg-coral-deep transition disabled:opacity-50"
      >
        {busy ? 'Saving...' : 'Save check-in'}
      </button>
    </form>
  );
}
