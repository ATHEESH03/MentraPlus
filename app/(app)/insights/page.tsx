'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { allCheckIns } from '@/lib/data/checkIns';
import { listExperiments, listAttempts } from '@/lib/data/experiments';
import { listInsights, setInsightStatus } from '@/lib/data/insightsRepo';
import { deriveInsights, STATUS_META } from '@/lib/insights/engine';
import { Insight } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';

export default function InsightsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const [ci, ex, stored] = await Promise.all([
        allCheckIns(user.uid),
        listExperiments(user.uid),
        listInsights(user.uid),
      ]);

      const att = [];
      for (const e of ex) {
        const attempts = await listAttempts(user.uid, e.id);
        att.push(...attempts);
      }

      const merged = deriveInsights(ci, ex, att, stored);

      // Apply preserved user status overrides
      const finalInsights = merged.map((m) => {
        const s = stored.find((x) => x.key === m.key);
        return s && ['confirmed', 'dismissed', 'reviewed'].includes(s.status)
          ? { ...m, status: s.status, userNote: s.userNote }
          : m;
      });

      setRows(finalInsights);
    } catch (e) {
      console.error('Insights load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const updateStatus = async (id: string, status: any) => {
    if (!user) return;
    await setInsightStatus(user.uid, id, status);
    setRows((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

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
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Personal Observations</h1>
        <p className="text-ink-soft text-sm mt-1 leading-relaxed">
          Evidence-backed observations calculated purely from your recorded experiences. These are personal patterns, not clinical diagnoses or claims of causation.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center shadow-soft">
          <p className="text-ink-mute text-sm max-w-md mx-auto leading-relaxed">
            There’s not enough information to draw a useful conclusion yet. Checking in 3 or more times with strategies and trying small experiments will unlock observations here.
          </p>
          <div className="mt-5">
            <Link
              href="/app/check-in"
              className="inline-flex items-center justify-center font-medium transition rounded-xl text-sm px-5 py-2.5 bg-teal text-white hover:bg-teal-deep shadow-soft"
            >
              Record a check-in
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((i) => {
            const encodedKey = encodeURIComponent(i.key);
            return (
              <div
                key={i.id}
                className="rounded-xl2 bg-card border border-line p-6 shadow-soft space-y-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/app/insights/${encodedKey}`}
                    className="font-display text-xl text-ink hover:text-teal-deep transition"
                  >
                    {i.title}
                  </Link>
                  <span
                    className="text-xs uppercase tracking-wide font-semibold"
                    style={{ color: tone(i.status) }}
                  >
                    {STATUS_META[i.status]?.label}
                  </span>
                </div>

                <p className="text-sm text-ink-soft leading-relaxed">{i.body}</p>

                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-line/60 text-xs">
                  <span className="text-ink-mute">
                    Supported by {i.supporting} of {i.total} recorded experience
                    {i.total === 1 ? '' : 's'}
                  </span>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/app/insights/${encodedKey}`}
                      className="text-teal-deep font-semibold hover:underline"
                    >
                      Inspect records →
                    </Link>
                    <button
                      onClick={() => updateStatus(i.id, 'confirmed')}
                      className={`hover:underline ${
                        i.status === 'confirmed'
                          ? 'font-bold text-sage'
                          : 'text-ink-mute hover:text-ink'
                      }`}
                    >
                      {i.status === 'confirmed' ? '✓ Confirmed' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => updateStatus(i.id, 'dismissed')}
                      className={`hover:underline ${
                        i.status === 'dismissed'
                          ? 'font-bold text-coral-deep'
                          : 'text-ink-mute hover:text-coral-deep'
                      }`}
                    >
                      {i.status === 'dismissed' ? 'Dismissed' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
