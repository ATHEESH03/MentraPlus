'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { allCheckIns, getCheckIn } from '@/lib/data/checkIns';
import { listExperiments, listAttempts, getExperiment } from '@/lib/data/experiments';
import { listInsights, setInsightStatus } from '@/lib/data/insightsRepo';
import { deriveInsights, STATUS_META } from '@/lib/insights/engine';
import { Insight, CheckIn, Experiment } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import { fmtDate } from '@/lib/utils';

export default function InsightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const decodedId = decodeURIComponent(id || '');
  const { user } = useAuth();
  const router = useRouter();

  const [insight, setInsight] = useState<Insight | null>(null);
  const [evidenceRecords, setEvidenceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNote, setUserNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
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

        const derived = deriveInsights(ci, ex, att, stored);
        const match = derived.find(
          (item) => item.key === decodedId || item.id === decodedId
        );

        if (match) {
          const storedMatch = stored.find((s) => s.key === match.key);
          const currentStatus =
            storedMatch && ['confirmed', 'dismissed', 'reviewed'].includes(storedMatch.status)
              ? storedMatch.status
              : match.status;

          setInsight({
            ...match,
            status: currentStatus,
            userNote: storedMatch?.userNote,
          });
          setUserNote(storedMatch?.userNote || '');

          // Fetch evidence records
          const recs: any[] = [];
          for (const ev of match.evidence) {
            if (ev.type === 'checkIn') {
              const rec = await getCheckIn(user.uid, ev.id);
              if (rec) recs.push({ type: 'checkIn', data: rec });
            } else if (ev.type === 'experiment') {
              const rec = await getExperiment(user.uid, ev.id);
              if (rec) recs.push({ type: 'experiment', data: rec });
            }
          }
          setEvidenceRecords(recs);
        }
      } catch (e) {
        console.error('Insight detail load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, decodedId]);

  const handleUpdateStatus = async (status: any) => {
    if (!user || !insight) return;
    await setInsightStatus(user.uid, insight.id, status, userNote);
    setInsight((prev) => (prev ? { ...prev, status } : null));
  };

  const handleSaveNote = async () => {
    if (!user || !insight) return;
    setSavingNote(true);
    try {
      await setInsightStatus(user.uid, insight.id, insight.status, userNote);
      alert('Note saved to this insight.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center space-y-4">
        <h2 className="font-display text-2xl text-ink">Observation Not Found</h2>
        <p className="text-sm text-ink-mute">
          This observation may need more recorded check-ins to generate or has been cleared.
        </p>
        <Link
          href="/app/insights"
          className="inline-block text-sm text-teal font-medium hover:underline"
        >
          ← Back to all observations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/app/insights"
        className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink font-medium"
      >
        ← Back to Observations
      </Link>

      <div className="rounded-xl2 bg-card border border-line p-6 sm:p-8 shadow-soft space-y-4">
        <div className="flex flex-wrap justify-between items-baseline gap-2">
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: tone(insight.status) }}
          >
            {STATUS_META[insight.status]?.label}
          </span>
          <span className="text-xs text-ink-mute">
            {insight.supporting} of {insight.total} supporting records
          </span>
        </div>

        <h1 className="font-display text-3xl text-ink">{insight.title}</h1>
        <p className="text-sm text-ink-soft leading-relaxed">{insight.body}</p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleUpdateStatus('confirmed')}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition ${
              insight.status === 'confirmed'
                ? 'bg-sage text-white border-sage'
                : 'border-line text-ink-soft hover:bg-paper-deep'
            }`}
          >
            {insight.status === 'confirmed' ? '✓ Confirmed by you' : 'Confirm observation'}
          </button>
          <button
            onClick={() => handleUpdateStatus('dismissed')}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition ${
              insight.status === 'dismissed'
                ? 'bg-coral-deep text-white border-coral-deep'
                : 'border-line text-ink-soft hover:bg-paper-deep'
            }`}
          >
            {insight.status === 'dismissed' ? 'Dismissed' : 'Dismiss'}
          </button>
        </div>
      </div>

      {/* User Note */}
      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft space-y-3">
        <h3 className="font-display text-lg text-ink">Personal Note & Correction</h3>
        <p className="text-xs text-ink-mute">
          Add your own perspective or qualify under what conditions this applies.
        </p>
        <textarea
          rows={3}
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder="e.g. This only seems to work when I do it before 6 PM, or when I'm walking outdoors..."
          className="w-full rounded-xl border border-line bg-paper-soft p-3 text-sm focus:border-teal focus:outline-none"
        />
        <button
          onClick={handleSaveNote}
          disabled={savingNote}
          className="bg-ink text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-ink-soft disabled:opacity-50"
        >
          {savingNote ? 'Saving...' : 'Save note'}
        </button>
      </div>

      {/* Supporting Evidence Records */}
      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft space-y-4">
        <h3 className="font-display text-lg text-ink">
          Underlying Records ({evidenceRecords.length})
        </h3>
        <p className="text-xs text-ink-mute">
          Every observation in Mentra+ links to real records you authored. Nothing is synthesized or assumed without data.
        </p>

        <div className="space-y-2.5 pt-2">
          {evidenceRecords.map((item, idx) => {
            if (item.type === 'checkIn') {
              const ci: CheckIn = item.data;
              return (
                <div
                  key={ci.id || idx}
                  className="rounded-xl bg-paper-soft border border-line p-3.5 text-xs text-ink-soft space-y-1"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-teal-deep">Check-in</span>
                    <span className="text-ink-mute">{fmtDate(ci.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-coral-deep font-medium">{ci.situation}</span> →{' '}
                    <span className="text-amber-600 font-medium">{ci.mood}</span>
                    {ci.strategiesUsed?.length ? (
                      <> → <span className="text-teal-deep font-medium">{ci.strategiesUsed.join(', ')}</span></>
                    ) : null}{' '}
                    → <span className="text-sage font-bold">{ci.outcome}</span>
                  </div>
                  {ci.thought && (
                    <div className="italic text-ink-mute pt-1">"{ci.thought}"</div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Limitations note */}
      <div className="rounded-xl bg-paper-deep/60 border border-line p-4 text-xs text-ink-mute space-y-1">
        <div className="font-semibold text-ink-soft">Limitations of this observation:</div>
        <div>
          Correlation does not mean causation. Factors such as time of day, workload, nutrition, or random variation can influence outcomes. Use this observation as an invitation to reflect, not as a diagnostic certainty.
        </div>
      </div>
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
