'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { allCheckIns } from '@/lib/data/checkIns';
import { listExperiments, listAttempts } from '@/lib/data/experiments';
import { deriveInsights, STATUS_META } from '@/lib/insights/engine';
import { listInsights } from '@/lib/data/insightsRepo';
import { listAssessments } from '@/lib/data/assessments';
import { relTime, fmtTime } from '@/lib/utils';
import CheckInCTA from '@/components/checkin/CheckInCTA';
import { Spinner } from '@/components/ui/Spinner';

export default function Home() {
  const { profile, user } = useAuth();
  const [data, setData] = useState<{
    ci: any[];
    ex: any[];
    ins: any[];
    res: any[];
    att: any[];
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [ci, ex, storedIns, res] = await Promise.all([
          allCheckIns(user.uid),
          listExperiments(user.uid),
          listInsights(user.uid),
          listAssessments(user.uid),
        ]);

        const att = [];
        for (const e of ex) {
          const attempts = await listAttempts(user.uid, e.id);
          att.push(...attempts);
        }

        setData({ ci, ex, ins: storedIns, res, att });
      } catch (err) {
        console.error('Home data load error:', err);
      }
    })();
  }, [user]);

  if (!data) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  const { ci, ex, ins, res, att } = data;
  const derived = deriveInsights(ci, ex, att, ins);
  const topInsight = derived[0];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">
          {greeting}, {profile?.displayName.split(' ')[0] || 'Friend'}.
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          A calm place to notice what you’ve learned about yourself.
        </p>
      </div>

      <CheckInCTA />

      {ci.length === 0 ? (
        <GettingStarted />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-xl2 bg-card border border-line p-5 shadow-soft">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display text-lg text-ink">Recent Experiences</h2>
              <Link
                href="/app/check-in"
                className="text-xs text-teal-deep font-semibold hover:underline"
              >
                + Check in
              </Link>
            </div>
            <div className="divide-y divide-line">
              {ci.slice(0, 5).map((c) => {
                const timeOfDayTag = c.contextTags?.find((t: string) =>
                  ['Morning', 'Afternoon', 'Evening', 'Night'].includes(t)
                );
                return (
                  <div key={c.id} className="py-3 flex justify-between items-baseline gap-4 text-sm">
                    <div className="text-ink-soft min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-ink">{c.situation || '—'}</span>
                        {timeOfDayTag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-paper-deep text-teal-deep font-medium">
                            {timeOfDayTag}
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-1 text-ink-mute">
                        <span className="text-amber-600 font-medium">{c.mood}</span>
                        {c.strategiesUsed?.length ? (
                          <>
                            {' → '}
                            <span className="text-teal-deep font-medium">
                              {c.strategiesUsed.join(', ')}
                            </span>
                          </>
                        ) : null}
                        {' → '}
                        <span className="text-sage font-semibold">{c.outcome}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-ink-mute block font-mono">
                        {fmtTime(c.createdAt)}
                      </span>
                      <span className="text-[10px] text-ink-mute/70 block">
                        {relTime(c.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights / Experiments Side Cards */}
          <div className="space-y-6">
            {topInsight && (
              <div className="rounded-xl2 bg-card border border-line p-5 shadow-soft">
                <div className="flex justify-between items-center mb-2">
                  <span
                    className="text-xs uppercase tracking-wide font-semibold"
                    style={{ color: tone(topInsight.status) }}
                  >
                    {STATUS_META[topInsight.status]?.label}
                  </span>
                  <Link
                    href="/app/insights"
                    className="text-xs text-teal-deep hover:underline font-medium"
                  >
                    All
                  </Link>
                </div>
                <h3 className="font-display text-base text-ink">{topInsight.title}</h3>
                <p className="text-xs text-ink-soft mt-1.5 leading-relaxed">
                  {topInsight.body}
                </p>
                <div className="text-[11px] text-ink-mute mt-3 pt-2 border-t border-line">
                  Supported by {topInsight.supporting} of {topInsight.total} recorded experiences.
                </div>
              </div>
            )}

            <div className="rounded-xl2 bg-card border border-line p-5 shadow-soft">
              <h2 className="font-display text-lg text-ink mb-2">Active Experiment</h2>
              {ex.find((e) => e.status === 'active') ? (
                <div>
                  <p className="text-sm text-ink-soft font-medium">
                    {ex.find((e) => e.status === 'active')!.question}
                  </p>
                  <Link
                    href={`/app/experiments/${ex.find((e) => e.status === 'active')!.id}`}
                    className="inline-block mt-3 text-xs text-teal-deep font-semibold hover:underline"
                  >
                    Log an attempt →
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-ink-mute">No active experiment right now.</p>
                  <Link
                    href="/app/experiments/new"
                    className="inline-block mt-3 text-xs text-coral font-semibold hover:underline"
                  >
                    Start a small test →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Numerical Snapshot */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl sm:text-3xl text-ink font-semibold">
            {ci.length}
          </div>
          <div className="text-xs text-ink-mute mt-0.5">Check-ins</div>
        </div>
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl sm:text-3xl text-ink font-semibold">
            {ex.length}
          </div>
          <div className="text-xs text-ink-mute mt-0.5">Experiments</div>
        </div>
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl sm:text-3xl text-ink font-semibold">
            {res.length}
          </div>
          <div className="text-xs text-ink-mute mt-0.5">Self-Assessments</div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          ['Response Map', '/app/map', 'Explore connections between triggers & outcomes'],
          ['Private Journal', '/app/journal', 'Write unstructured or prompt-guided reflections'],
          ['Playbook', '/app/playbook', 'Strategies tested and reviewed from your logs'],
          ['Self-Assessments', '/app/assess', 'Trend-based non-diagnostic reflections'],
          ['Progress Charts', '/app/progress', 'Personal mood, energy, and stress trajectories'],
          ['Circles', '/app/community', 'Supportive, pseudonymous student community'],
        ].map(([label, href, desc]) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl bg-card border border-line p-4 hover:border-teal/50 hover:shadow-soft transition text-left"
          >
            <div className="font-display text-base text-ink font-medium">{label}</div>
            <div className="text-xs text-ink-mute mt-1">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function GettingStarted() {
  return (
    <div className="rounded-xl2 bg-card border border-line p-6 sm:p-8 shadow-soft space-y-4">
      <h2 className="font-display text-2xl text-ink">Welcome to Mentra+</h2>
      <p className="text-sm text-ink-soft leading-relaxed max-w-xl">
        Here are three gentle ways to begin. Your data remains entirely private in your owner-partitioned database.
      </p>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-ink-soft pt-2">
        <li>
          <Link href="/app/check-in" className="text-teal-deep font-semibold hover:underline">
            Record your first check-in
          </Link>{' '}
          — it seeds your Personal Response Map.
        </li>
        <li>
          <Link href="/app/journal" className="text-teal-deep font-semibold hover:underline">
            Write a short reflection
          </Link>{' '}
          to any prompt that resonates.
        </li>
        <li>
          <Link href="/app/assess" className="text-teal-deep font-semibold hover:underline">
            Take a self-reflection questionnaire
          </Link>{' '}
          to establish a personal trend.
        </li>
      </ol>
    </div>
  );
}

const tone = (s: string) =>
  ({
    emerging: '#D98A2B',
    supported: '#2F6F6A',
    confirmed: '#8FA88A',
    contradicted: '#E86A55',
    dismissed: '#6B7A7A',
    reviewed: '#2F6F6A',
    changing: '#D98A2B',
  }[s] || '#3A4A4B');
