'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { allCheckIns } from '@/lib/data/checkIns';
import { listAssessments } from '@/lib/data/assessments';
import { listInsights } from '@/lib/data/insightsRepo';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Spinner } from '@/components/ui/Spinner';

export default function ProgressPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    ci: any[];
    res: any[];
    ins: any[];
  } | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [ci, res, ins] = await Promise.all([
          allCheckIns(user.uid),
          listAssessments(user.uid),
          listInsights(user.uid),
        ]);
        setData({ ci, res, ins });
      } catch (e) {
        console.error('Progress load error:', e);
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

  const { ci, res, ins } = data;

  const moodMap: Record<string, number> = {
    calm: 8,
    content: 7,
    focused: 7,
    anxious: 4,
    overwhelmed: 2,
    low: 3,
    tired: 4,
    irritated: 3,
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredCi = ci.filter((c) => {
    if (c.createdAt > Date.now() + 60000) return false;
    if (from && c.createdAt < new Date(from).getTime()) return false;
    if (to && c.createdAt > new Date(to).getTime() + 86400000) return false;
    return true;
  });

  const chartPoints = filteredCi.map((c) => ({
    time: new Date(c.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    mood: moodMap[c.mood] ?? 5,
    energy: Math.round(c.energy / 10),
    stress: Math.round(c.stress / 10),
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Progress Trends</h1>
        <p className="text-ink-soft text-sm mt-1 leading-relaxed max-w-2xl">
          Visualized from your self-reported logs. Fluctuations and downs are completely normal — this is not a diagnostic score, and you are never ranked against anyone else.
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
          <span className="text-ink-mute font-medium">Filter date range:</span>
          <input
            type="date"
            max={todayStr}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-line bg-card px-2.5 py-1 text-ink focus:outline-none"
          />
          <span className="text-ink-mute">to</span>
          <input
            type="date"
            max={todayStr}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-line bg-card px-2.5 py-1 text-ink focus:outline-none"
          />
          {(from || to) && (
            <button
              onClick={() => {
                setFrom('');
                setTo('');
              }}
              className="text-teal-deep font-semibold underline px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Chart Card */}
      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h2 className="font-display text-lg text-ink">
            Self-Reported Trajectory (0–10 Scale)
          </h2>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-teal-deep">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-deep" />
              Mood
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Energy
            </span>
            <span className="flex items-center gap-1.5 text-coral-deep">
              <span className="w-2.5 h-2.5 rounded-full bg-coral" />
              Stress
            </span>
          </div>
        </div>

        {chartPoints.length < 2 ? (
          <div className="py-16 text-center text-xs text-ink-mute bg-paper-soft rounded-xl border border-line">
            Not enough data points in this date range. Record at least 2 check-ins to view the trend area chart.
          </div>
        ) : (
          <div className="w-full h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DACB" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6B7A7A' }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#6B7A7A' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E3DACB',
                    borderRadius: '0.75rem',
                    boxShadow: '0 8px 24px -12px rgba(30,42,43,.18)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="#2F6F6A"
                  fill="#5C9A94"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="#D98A2B"
                  fill="#F0C88C"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="stress"
                  stroke="#E86A55"
                  fill="#F2A596"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Numerical Metric Summaries */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl sm:text-3xl text-ink font-semibold">
            {ci.length}
          </div>
          <div className="text-xs text-ink-mute mt-1">Check-ins Logged</div>
        </div>
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl sm:text-3xl text-ink font-semibold">
            {res.length}
          </div>
          <div className="text-xs text-ink-mute mt-1">Assessments Taken</div>
        </div>
        <div className="rounded-xl bg-paper-soft border border-line p-4 shadow-soft">
          <div className="font-display text-2xl sm:text-3xl text-ink font-semibold">
            {ins.length}
          </div>
          <div className="text-xs text-ink-mute mt-1">Observations Stored</div>
        </div>
      </div>
    </div>
  );
}
