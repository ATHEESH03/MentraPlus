'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { listExperiments, listAttempts } from '@/lib/data/experiments';
import { Experiment } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { fmtDate } from '@/lib/utils';

export default function ExperimentsPage() {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const list = await listExperiments(user.uid);
        setExperiments(list);

        const counts: Record<string, number> = {};
        for (const exp of list) {
          const attempts = await listAttempts(user.uid, exp.id);
          counts[exp.id] = attempts.length;
        }
        setAttemptCounts(counts);
      } catch (e) {
        console.error('Failed to load experiments:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  const activeExp = experiments.filter((e) => e.status === 'active');
  const otherExp = experiments.filter((e) => e.status !== 'active');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">Personal Experiments</h1>
          <p className="text-ink-soft text-sm mt-1">
            Safe, structured trials of your own strategies. Compare outcomes without assuming causation.
          </p>
        </div>
        <Link
          href="/app/experiments/new"
          className="bg-coral text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-soft hover:bg-coral-deep transition"
        >
          + New Experiment
        </Link>
      </div>

      {experiments.length === 0 ? (
        <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center shadow-soft space-y-4">
          <div className="text-4xl">🧪</div>
          <h3 className="font-display text-xl text-ink">No Experiments Yet</h3>
          <p className="text-sm text-ink-mute max-w-md mx-auto leading-relaxed">
            Design a small trial (like testing a 5-minute breathing pause or afternoon walk) to notice what actually works for your body and study rhythm.
          </p>
          <div>
            <Link
              href="/app/experiments/new"
              className="inline-flex items-center justify-center font-medium transition rounded-xl text-sm px-6 py-3 bg-teal text-white hover:bg-teal-deep shadow-soft"
            >
              Start an experiment
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {activeExp.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-teal-deep">
                Active Trials
              </h2>
              <div className="grid gap-4">
                {activeExp.map((exp) => (
                  <ExperimentCard
                    key={exp.id}
                    exp={exp}
                    attemptsCount={attemptCounts[exp.id] || 0}
                  />
                ))}
              </div>
            </div>
          )}

          {otherExp.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-semibold text-ink-mute">
                Completed & Other
              </h2>
              <div className="grid gap-4">
                {otherExp.map((exp) => (
                  <ExperimentCard
                    key={exp.id}
                    exp={exp}
                    attemptsCount={attemptCounts[exp.id] || 0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExperimentCard({
  exp,
  attemptsCount,
}: {
  exp: Experiment;
  attemptsCount: number;
}) {
  const statusColor: Record<string, string> = {
    active: 'bg-teal/10 text-teal-deep border-teal/20',
    completed: 'bg-sage/20 text-teal-deep border-sage/30',
    paused: 'bg-amber/10 text-amber-800 border-amber/20',
    dropped: 'bg-paper-deep text-ink-mute border-line',
    planned: 'bg-paper-soft text-ink-soft border-line',
  };

  return (
    <div className="rounded-xl2 bg-card border border-line p-5 shadow-soft hover:border-teal/50 transition space-y-3">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <Link
          href={`/app/experiments/${exp.id}`}
          className="font-display text-xl text-ink hover:text-teal-deep transition"
        >
          {exp.question}
        </Link>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full border font-medium uppercase tracking-wide ${
            statusColor[exp.status] || 'bg-paper-soft text-ink-soft'
          }`}
        >
          {exp.status}
        </span>
      </div>

      <div className="text-sm text-ink-soft space-y-1">
        <div>
          <span className="font-semibold text-ink">Context:</span> {exp.context}
        </div>
        <div>
          <span className="font-semibold text-ink">Strategy:</span> {exp.strategy}
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-line/60 text-xs text-ink-mute">
        <span>
          Attempts logged: <strong>{attemptsCount}</strong>
          {exp.attemptsPlanned ? ` of ${exp.attemptsPlanned} planned` : ''}
        </span>
        <Link
          href={`/app/experiments/${exp.id}`}
          className="text-teal-deep font-semibold hover:underline"
        >
          View details & log →
        </Link>
      </div>
    </div>
  );
}
