'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ASSESSMENTS } from '@/lib/assessments/definitions';
import { listAssessments } from '@/lib/data/assessments';
import { AssessmentResult } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';
import { fmtDate } from '@/lib/utils';

export default function AssessPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listAssessments(user.uid)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Self-Assessments</h1>
        <p className="text-ink-soft text-sm mt-1 max-w-2xl leading-relaxed">
          Short, non-diagnostic reflection questionnaires designed to help you observe personal patterns over time. These are educational reflections, not medical diagnoses.
        </p>
      </div>

      <div className="grid gap-4">
        {ASSESSMENTS.map((def) => {
          const prior = results.filter((r) => r.assessmentId === def.id);
          const latest = prior[0];

          return (
            <div
              key={def.id}
              className="rounded-xl2 bg-card border border-line p-6 shadow-soft hover:border-teal/50 transition space-y-3"
            >
              <div className="flex flex-wrap justify-between items-baseline gap-2">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-teal-deep">
                    {def.category} · ~{def.estMinutes} mins
                  </span>
                  <h2 className="font-display text-2xl text-ink mt-0.5">
                    {def.title}
                  </h2>
                </div>
                <Link
                  href={`/app/assess/${def.id}`}
                  className="bg-ink text-paper px-5 py-2 rounded-xl text-xs font-semibold hover:bg-ink-soft transition shadow-soft"
                >
                  {latest ? 'Retake reflection' : 'Start reflection'}
                </Link>
              </div>

              <p className="text-sm text-ink-soft leading-relaxed">{def.purpose}</p>

              <div className="text-xs text-ink-mute bg-paper-deep/40 p-2.5 rounded-lg border border-line">
                <strong>Limitations:</strong> {def.limitations}
              </div>

              {latest && (
                <div className="pt-2 border-t border-line/60 flex justify-between items-center text-xs text-ink-mute">
                  <span>
                    Last completed: <strong>{fmtDate(latest.completedAt)}</strong>
                    {latest.score !== undefined ? ` (Score: ${latest.score})` : ''}
                  </span>
                  <Link
                    href={`/app/assess/${def.id}`}
                    className="text-teal-deep font-semibold hover:underline"
                  >
                    View last observation →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
