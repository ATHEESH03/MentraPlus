'use client';
import React from 'react';
import Link from 'next/link';
import { CheckIn } from '@/lib/types';

const MOOD_ICONS: Record<string, string> = {
  calm: '🌿',
  content: '☀️',
  focused: '🎯',
  anxious: '⚡',
  overwhelmed: '🌊',
  low: '🌧️',
  tired: '🌙',
  irritated: '🔥',
  other: '💭',
};

const MOOD_COLORS: Record<string, string> = {
  calm: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  content: 'bg-amber-50 text-amber-800 border-amber-200',
  focused: 'bg-teal-50 text-teal-800 border-teal-200',
  anxious: 'bg-orange-50 text-orange-800 border-orange-200',
  overwhelmed: 'bg-rose-50 text-rose-800 border-rose-200',
  low: 'bg-blue-50 text-blue-800 border-blue-200',
  tired: 'bg-purple-50 text-purple-800 border-purple-200',
  irritated: 'bg-red-50 text-red-800 border-red-200',
};

export function EmotionalSummaryCard({
  checkIns,
  onPromptClick,
}: {
  checkIns: CheckIn[];
  onPromptClick?: (promptText: string) => void;
}) {
  if (!checkIns || checkIns.length === 0) {
    return (
      <div className="rounded-xl2 bg-paper-soft border border-line p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3 text-sm text-ink-soft">
          <span className="text-2xl">🌱</span>
          <div>
            <strong className="text-ink block">No emotional check-ins logged yet</strong>
            <span>Record your first check-in to see your emotional trajectory and current state summary here.</span>
          </div>
        </div>
        <Link
          href="/app/check-in"
          className="whitespace-nowrap px-4 py-2 bg-coral text-white rounded-xl text-xs font-semibold hover:bg-coral-deep shadow-soft transition"
        >
          Check in now →
        </Link>
      </div>
    );
  }

  // Sort check-ins newest to oldest
  const sorted = [...checkIns].sort((a, b) => b.createdAt - a.createdAt);
  const latest = sorted[0];

  // Last 5 emotions in chronological order (oldest to newest)
  const recentFlow = sorted.slice(0, 5).reverse();

  // Mood frequency breakdown
  const moodCounts: Record<string, number> = {};
  sorted.slice(0, 10).forEach((c) => {
    moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
  });

  const totalRecent = Math.min(sorted.length, 10);
  const topMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Situations associated with highest stress
  const highStressSituations = Array.from(
    new Set(
      sorted
        .filter((c) => (c.stress ?? 0) >= 60 && c.situation)
        .map((c) => c.situation)
    )
  ).slice(0, 2);

  // Formulate a gentle analytical summary
  let summaryText = `Currently you are feeling ${latest.mood}. `;
  if (latest.stress > 65) {
    summaryText += `Your stress is elevated (${latest.stress}/100) — writing out what feels most urgent can help organize your headspace.`;
  } else if (latest.energy < 40) {
    summaryText += `Your physical energy is lower (${latest.energy}/100) — honor this rhythm and keep today's demands manageable.`;
  } else {
    summaryText += `You are reporting steady energy (${latest.energy}/100) and moderate stress (${latest.stress}/100).`;
  }

  const latestTimeStr = new Date(latest.createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  }) + ' at ' + new Date(latest.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-xl2 bg-card border border-line p-5 sm:p-6 shadow-soft space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-teal-deep">
            Emotional Snapshot & Trends
          </span>
          <h2 className="font-display text-lg text-ink flex items-center gap-2 mt-0.5">
            <span>How You Are Currently Feeling</span>
            <span className="text-xl">{MOOD_ICONS[latest.mood] || '🌿'}</span>
          </h2>
        </div>
        <div className="text-xs text-ink-mute flex items-center gap-2">
          <span>Logged: <strong>{latestTimeStr}</strong></span>
          <Link
            href="/app/check-in"
            className="text-[11px] font-semibold text-teal-deep hover:underline bg-paper-deep px-2.5 py-1 rounded-lg"
          >
            + Update state
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Current State Column */}
        <div className="rounded-xl bg-paper-soft border border-line p-4 space-y-3">
          <div className="text-xs font-semibold text-ink-mute uppercase tracking-wide">
            Current Status
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-semibold border capitalize ${
                MOOD_COLORS[latest.mood] || 'bg-paper text-ink border-line'
              }`}
            >
              {MOOD_ICONS[latest.mood] || '🌿'} {latest.mood}
            </span>
            {latest.situation && (
              <span className="text-xs text-ink-mute truncate max-w-[140px]" title={latest.situation}>
                ({latest.situation})
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-ink-soft">Energy level:</span>
              <span className="font-semibold text-ink">{latest.energy}/100</span>
            </div>
            <div className="w-full bg-paper-deep rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(5, latest.energy))}%` }}
              />
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-ink-soft">Stress level:</span>
              <span className="font-semibold text-ink">{latest.stress}/100</span>
            </div>
            <div className="w-full bg-paper-deep rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  latest.stress > 65 ? 'bg-rose-500' : 'bg-teal'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, latest.stress))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Emotions at Last (Recent Trajectory Flow) */}
        <div className="rounded-xl bg-paper-soft border border-line p-4 space-y-2 md:col-span-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink-mute uppercase tracking-wide">
              Recent Emotion Flow (All Your Recent Emotions)
            </span>
            <span className="text-[11px] text-ink-mute">Last {recentFlow.length} check-ins</span>
          </div>

          {/* Timeline pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {recentFlow.map((ci, i) => {
              const isLatestItem = i === recentFlow.length - 1;
              const dateTag = new Date(ci.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });
              const timeTag = new Date(ci.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <React.Fragment key={ci.id}>
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition ${
                      isLatestItem
                        ? 'border-teal bg-teal/10 font-bold text-teal-deep ring-1 ring-teal/30'
                        : 'border-line/70 bg-card text-ink-soft'
                    }`}
                    title={`${dateTag} at ${timeTag} (${ci.situation || 'General'})`}
                  >
                    <span>{MOOD_ICONS[ci.mood] || '•'}</span>
                    <span className="capitalize">{ci.mood}</span>
                    <span className="text-[10px] text-ink-mute ml-0.5">({timeTag})</span>
                  </div>
                  {i < recentFlow.length - 1 && (
                    <span className="text-ink-mute text-xs font-bold">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Analytical Summary Footer */}
          <div className="pt-2 text-xs text-ink-soft leading-relaxed border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span>{summaryText}</span>
              {highStressSituations.length > 0 && (
                <span className="block text-[11px] text-ink-mute mt-0.5">
                  Frequent stress triggers: <em>{highStressSituations.join(', ')}</em>
                </span>
              )}
            </div>

            {onPromptClick && (
              <button
                type="button"
                onClick={() =>
                  onPromptClick(
                    `Reflecting on feeling ${latest.mood} today (${latestTimeStr}): What felt most significant about this moment?`
                  )
                }
                className="whitespace-nowrap text-[11px] font-semibold text-teal-deep hover:text-teal underline text-left"
              >
                Write about this feeling ✍️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
