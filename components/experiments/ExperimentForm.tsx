'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { saveExperiment } from '@/lib/data/experiments';
import { saveAchievement } from '@/lib/data/achievements';

export function ExperimentForm() {
  const { user } = useAuth();
  const router = useRouter();

  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [strategy, setStrategy] = useState('');
  const [attemptsPlanned, setAttemptsPlanned] = useState(4);
  const [baseline, setBaseline] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !question.trim() || !strategy.trim() || busy) return;

    setBusy(true);
    setErr('');

    try {
      const exp = await saveExperiment(user.uid, {
        question: question.trim(),
        context: context.trim(),
        strategy: strategy.trim(),
        attemptsPlanned: Number(attemptsPlanned) || 4,
        baseline: baseline.trim() || undefined,
        status: 'active',
      });

      try {
        await saveAchievement(user.uid, {
          key: 'first-experiment',
          title: 'First Experiment',
          description: 'You launched your first self-directed wellbeing experiment.',
        });
      } catch {
        // Non-blocking
      }

      router.push(`/app/experiments/${exp.id}`);
    } catch {
      setErr('Could not save experiment. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide font-medium text-ink-mute">
          1. What question or hypothesis are you testing?
        </label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Does a 10-minute walk help reduce brain fog after studying?"
          className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide font-medium text-ink-mute">
          2. Specific context or recurring challenge
        </label>
        <input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g. Late afternoon study sessions or before assignment deadlines"
          className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide font-medium text-ink-mute">
          3. Strategy you will test
        </label>
        <input
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          placeholder="e.g. Step outside for a 10-minute stroll without headphones"
          className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide font-medium text-ink-mute">
          4. Planned attempts
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={attemptsPlanned}
          onChange={(e) => setAttemptsPlanned(Math.max(1, +e.target.value))}
          className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none"
        />
        <p className="text-[11px] text-ink-mute">
          We recommend 3–5 attempts before evaluating if this strategy is useful for you.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide font-medium text-ink-mute">
          5. Current baseline observation (optional)
        </label>
        <textarea
          rows={2}
          value={baseline}
          onChange={(e) => setBaseline(e.target.value)}
          placeholder="e.g. Usually I stay at my desk, scroll my phone, and feel drained for the rest of the evening."
          className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none"
        />
      </div>

      {err && <p className="text-coral-deep text-sm">{err}</p>}

      <div className="pt-2">
        <button
          type="submit"
          disabled={!question.trim() || !strategy.trim() || busy}
          className="bg-coral text-white px-7 py-3 rounded-xl font-medium shadow-soft hover:bg-coral-deep transition disabled:opacity-50"
        >
          {busy ? 'Launching...' : 'Start Experiment'}
        </button>
      </div>
    </form>
  );
}
