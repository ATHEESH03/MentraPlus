// lib/insights/engine.ts
import { CheckIn, Experiment, Attempt, Insight } from '@/lib/types';

const STATUS_META: Record<
  Insight['status'],
  { label: string; tone: string; blurb: string }
> = {
  emerging: {
    label: 'A possible pattern is emerging',
    tone: 'amber',
    blurb: 'Few records so far — keep reflecting to see if it holds.',
  },
  supported: {
    label: 'Pattern supported by multiple recorded experiences',
    tone: 'teal',
    blurb: 'Several of your own records point the same direction.',
  },
  reviewed: {
    label: 'Reviewed by you',
    tone: 'teal',
    blurb: 'You reviewed this observation.',
  },
  confirmed: {
    label: 'Confirmed by you',
    tone: 'sage',
    blurb: 'You marked this as something you recognise.',
  },
  dismissed: {
    label: 'Dismissed',
    tone: 'mute',
    blurb: 'You chose not to treat this as useful. It is kept for your records.',
  },
  contradicted: {
    label: 'Contradicted by newer records',
    tone: 'coral',
    blurb: 'Recent records do not match an earlier observation.',
  },
  changing: {
    label: 'Changing over time',
    tone: 'amber',
    blurb: 'Earlier and more recent records point differently.',
  },
};

// For a strategy S across N check-ins that used S, P had a positive outcome.
// Only emitted when N >= 3 (enough to be non-trivial) and the ratio is computed, not assumed.
export function deriveInsights(
  checkIns: CheckIn[],
  experiments: Experiment[],
  attempts: Attempt[],
  existing: Insight[]
): Insight[] {
  const out: Insight[] = [];
  const byStrat = new Map<string, CheckIn[]>();

  checkIns.forEach((ci) =>
    (ci.strategiesUsed || []).forEach((s) => {
      const k = s.trim().toLowerCase();
      if (!byStrat.has(k)) byStrat.set(k, []);
      byStrat.get(k)!.push(ci);
    })
  );

  for (const [key, list] of byStrat) {
    const N = list.length;
    const P = list.filter((c: CheckIn) => c.outcome === 'better' || c.outcome === 'helpful').length;
    if (N < 3) continue;
    const ratio = P / N;
    const status: Insight['status'] =
      ratio >= 0.6 ? 'supported' : ratio <= 0.34 ? 'contradicted' : 'emerging';
    const prev = existing.find((e) => e.key === `strat:${key}`);
    const originalStrategyName =
      list[0].strategiesUsed.find((s: string) => s.toLowerCase() === key) || key;

    out.push({
      id: prev?.id ?? `strat:${key}`,
      key: `strat:${key}`,
      title: `Using “${originalStrategyName}”`,
      body: `Across ${N} recorded experiences, you reported this strategy helped in ${P} (${Math.round(
        ratio * 100
      )}%). This is your own data, not a claim of cause.`,
      evidence: list.map((c: CheckIn) => ({ type: 'checkIn', id: c.id })),
      supporting: P,
      total: N,
      status,
      userNote: prev?.userNote,
      createdAt: prev?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Experiment summaries: helpful vs unhelpful attempts
  for (const ex of experiments) {
    const a = attempts.filter((at) => at.id.startsWith(ex.id));
    if (a.length < 2) continue;
    const help = a.filter((x) => x.outcome === 'better' || x.outcome === 'helpful').length;
    const unhelp = a.filter((x) => x.outcome === 'worse' || x.outcome === 'unhelpful').length;
    const status: Insight['status'] =
      help > unhelp ? 'supported' : unhelp > help ? 'contradicted' : 'emerging';
    const prev = existing.find((e) => e.key === `exp:${ex.id}`);

    out.push({
      id: prev?.id ?? `exp:${ex.id}`,
      key: `exp:${ex.id}`,
      title: `Experiment: ${ex.question}`,
      body: `In ${a.length} attempts you recorded ${help} helpful and ${unhelp} unhelpful outcomes. Compare without assuming the strategy caused the result.`,
      evidence: a.map((at) => ({ type: 'experiment', id: at.id })),
      supporting: help,
      total: a.length,
      status,
      userNote: prev?.userNote,
      createdAt: prev?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Preserve user-set statuses (confirm/dismiss/reviewed) that the engine would otherwise overwrite
  for (const o of out) {
    const p = existing.find((e) => e.key === o.key);
    if (p && (p.status === 'confirmed' || p.status === 'dismissed' || p.status === 'reviewed')) {
      o.status = p.status;
      o.userNote = p.userNote;
    }
  }

  return out;
}

export const STATUS_META_ = STATUS_META;
export { STATUS_META };
