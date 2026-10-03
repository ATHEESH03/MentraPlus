'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  getExperiment,
  updateExperiment,
  listAttempts,
  saveAttempt,
  deleteExperiment,
} from '@/lib/data/experiments';
import { Experiment, Attempt, Outcome, ExperimentStatus } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { Chip } from '@/components/ui/Chip';
import { fmtDate } from '@/lib/utils';

const OUTCOMES: Outcome[] = ['helpful', 'better', 'no-change', 'worse', 'uncertain'];

export default function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Attempt Form State
  const [outcome, setOutcome] = useState<Outcome>('helpful');
  const [note, setNote] = useState('');
  const [beforeState, setBeforeState] = useState('');
  const [afterState, setAfterState] = useState('');
  const [submittingAttempt, setSubmittingAttempt] = useState(false);

  const loadData = async () => {
    if (!user || !id) return;
    try {
      const exp = await getExperiment(user.uid, id);
      if (exp) {
        setExperiment(exp);
        const atts = await listAttempts(user.uid, id);
        setAttempts(atts);
      }
    } catch (e) {
      console.error('Experiment detail error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, id]);

  const handleStatusChange = async (newStatus: ExperimentStatus) => {
    if (!user || !experiment) return;
    await updateExperiment(user.uid, experiment.id, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? Date.now() : undefined,
    });
    setExperiment((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  const handleAddAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !experiment || submittingAttempt) return;

    setSubmittingAttempt(true);
    try {
      await saveAttempt(user.uid, experiment.id, {
        outcome,
        note: note.trim() || undefined,
        before: beforeState.trim() || undefined,
        after: afterState.trim() || undefined,
        createdAt: Date.now(),
      });
      setNote('');
      setBeforeState('');
      setAfterState('');
      await loadData();
    } finally {
      setSubmittingAttempt(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !experiment) return;
    if (confirm('Delete this experiment and all its recorded attempts?')) {
      await deleteExperiment(user.uid, experiment.id);
      router.push('/app/experiments');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center space-y-4">
        <h2 className="font-display text-2xl text-ink">Experiment Not Found</h2>
        <Link
          href="/app/experiments"
          className="text-sm text-teal font-medium hover:underline"
        >
          ← Back to all experiments
        </Link>
      </div>
    );
  }

  const helpfulCount = attempts.filter(
    (a) => a.outcome === 'helpful' || a.outcome === 'better'
  ).length;

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/app/experiments"
        className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink font-medium"
      >
        ← Back to Experiments
      </Link>

      {/* Main Overview Card */}
      <div className="rounded-xl2 bg-card border border-line p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-teal-deep">
              Personal Trial
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-ink mt-1">
              {experiment.question}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={experiment.status}
              onChange={(e) => handleStatusChange(e.target.value as ExperimentStatus)}
              className="rounded-xl border border-line bg-paper-soft px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="dropped">Dropped</option>
            </select>
            <button
              onClick={handleDelete}
              className="text-xs text-coral-deep hover:underline px-2 py-1"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2 text-sm text-ink-soft">
          <div className="rounded-xl bg-paper-soft p-3 border border-line">
            <span className="font-semibold text-ink block text-xs uppercase tracking-wide text-ink-mute mb-1">
              Context
            </span>
            {experiment.context}
          </div>
          <div className="rounded-xl bg-paper-soft p-3 border border-line">
            <span className="font-semibold text-ink block text-xs uppercase tracking-wide text-ink-mute mb-1">
              Tested Strategy
            </span>
            {experiment.strategy}
          </div>
        </div>

        {experiment.baseline && (
          <div className="text-xs text-ink-mute bg-paper-deep/50 p-3 rounded-xl border border-line">
            <strong>Baseline before starting:</strong> {experiment.baseline}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-line/60 text-xs text-ink-mute">
          <span>Started on {fmtDate(experiment.createdAt)}</span>
          <Link
            href="/app/map"
            className="text-teal-deep font-semibold hover:underline"
          >
            Locate in Response Map →
          </Link>
        </div>
      </div>

      {/* Attempts Summary Metrics */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl text-ink font-semibold">
            {attempts.length}
          </div>
          <div className="text-xs text-ink-mute">
            Attempts Logged {experiment.attemptsPlanned ? `(${experiment.attemptsPlanned} planned)` : ''}
          </div>
        </div>
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl text-teal-deep font-semibold">
            {helpfulCount}
          </div>
          <div className="text-xs text-ink-mute">Helpful Outcomes</div>
        </div>
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl text-ink font-semibold">
            {attempts.length > 0 ? `${Math.round((helpfulCount / attempts.length) * 100)}%` : '—'}
          </div>
          <div className="text-xs text-ink-mute">Positive Ratio</div>
        </div>
      </div>

      {/* Log an Attempt Form */}
      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft space-y-4">
        <h3 className="font-display text-xl text-ink">Record an Attempt</h3>
        <form onSubmit={handleAddAttempt} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide font-medium text-ink-mute block mb-2">
              Outcome of this attempt
            </label>
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map((o) => (
                <Chip
                  key={o}
                  active={outcome === o}
                  onClick={() => setOutcome(o)}
                >
                  {o}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-mute block mb-1">Before attempt (state)</label>
              <input
                value={beforeState}
                onChange={(e) => setBeforeState(e.target.value)}
                placeholder="e.g. Brain fog, stressed"
                className="w-full rounded-xl border border-line bg-paper-soft p-2.5 text-xs text-ink focus:border-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-ink-mute block mb-1">After attempt (state)</label>
              <input
                value={afterState}
                onChange={(e) => setAfterState(e.target.value)}
                placeholder="e.g. Calmer, clearer head"
                className="w-full rounded-xl border border-line bg-paper-soft p-2.5 text-xs text-ink focus:border-teal focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-mute block mb-1">Notes / Observations</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What specifically happened? (e.g. Walked 10 mins without phone around the block)"
              className="w-full rounded-xl border border-line bg-paper-soft p-2.5 text-xs text-ink focus:border-teal focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submittingAttempt}
            className="bg-coral text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-soft hover:bg-coral-deep transition disabled:opacity-50"
          >
            {submittingAttempt ? 'Logging...' : 'Save Attempt'}
          </button>
        </form>
      </div>

      {/* Attempts List */}
      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft space-y-4">
        <h3 className="font-display text-xl text-ink">
          Logged Attempts ({attempts.length})
        </h3>

        {attempts.length === 0 ? (
          <p className="text-xs text-ink-mute italic">
            No attempts logged yet. Try testing your strategy and record the result above.
          </p>
        ) : (
          <div className="space-y-3">
            {attempts.map((att, idx) => (
              <div
                key={att.id || idx}
                className="rounded-xl bg-paper-soft border border-line p-4 text-xs text-ink-soft space-y-1.5"
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-teal-deep">Attempt #{idx + 1}</span>
                  <span className="text-ink-mute">{fmtDate(att.createdAt)}</span>
                </div>
                <div className="font-medium text-ink">
                  Outcome: <span className="text-sage font-bold uppercase">{att.outcome}</span>
                </div>
                {(att.before || att.after) && (
                  <div className="text-ink-mute">
                    {att.before && <span>Before: {att.before}</span>}
                    {att.before && att.after && <span> · </span>}
                    {att.after && <span>After: {att.after}</span>}
                  </div>
                )}
                {att.note && (
                  <div className="text-ink pt-1 italic bg-card/60 p-2 rounded-lg">
                    "{att.note}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
