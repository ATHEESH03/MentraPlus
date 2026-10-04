// lib/map/model.ts — pure, testable. NO fabricated edges: an edge exists only
// because a stored record contains both endpoints.
import { CheckIn, Experiment, Attempt, Insight } from '@/lib/types';

export type NodeKind = 'situation' | 'emotion' | 'strategy' | 'outcome';

export interface MapNode {
  id: string;
  label: string;
  kind: NodeKind;
  count: number;
  recordIds: string[];
}

export interface MapEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  recordIds: string[];
}

export interface DiscoveredPathway {
  id: string;
  situation: string;
  mood: string;
  strategy: string;
  outcomes: Record<string, number>;
  totalCount: number;
  helpfulCount: number;
  helpfulRate: number;
  dominantOutcome: string;
  recordIds: string[];
  lastOccurred: number;
}

export interface MapModel {
  nodes: MapNode[];
  edges: MapEdge[];
  records: CheckIn[];
  experiments: Experiment[];
  attempts: Attempt[];
  insights: Insight[];
  pathways: DiscoveredPathway[];
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

export function buildMap(input: {
  checkIns: CheckIn[];
  experiments: Experiment[];
  attempts: Attempt[];
  insights: Insight[];
}): MapModel {
  const nodes = new Map<string, MapNode>();
  const edges = new Map<string, MapEdge>();

  const ensure = (id: string, label: string, kind: NodeKind, recId: string) => {
    let n = nodes.get(id);
    if (!n) {
      n = { id, label, kind, count: 0, recordIds: [] };
      nodes.set(id, n);
    }
    if (!n.recordIds.includes(recId)) {
      n.recordIds.push(recId);
    }
    n.count = n.recordIds.length;
    return n;
  };

  const link = (a: string, b: string, recId: string) => {
    const key = `${a}>${b}`;
    let e = edges.get(key);
    if (!e) {
      e = { id: key, source: a, target: b, weight: 0, recordIds: [] };
      edges.set(key, e);
    }
    if (!e.recordIds.includes(recId)) {
      e.recordIds.push(recId);
    }
    e.weight = e.recordIds.length;
  };

  // Group check-ins into meaningful, actionable pathways: Trigger -> Mood -> Strategy
  const pathwayMap = new Map<string, {
    situation: string;
    mood: string;
    strategy: string;
    outcomes: Record<string, number>;
    totalCount: number;
    helpfulCount: number;
    recordIds: string[];
    lastOccurred: number;
  }>();

  for (const ci of input.checkIns) {
    const rec = ci.id;
    const sitLabel = ci.situation?.trim() || 'General state';
    const situation = ensure(`sit:${norm(sitLabel)}`, sitLabel, 'situation', rec);
    const emo = ensure(`emo:${ci.mood}`, cap(ci.mood), 'emotion', rec);
    const outcome = ensure(`out:${ci.outcome}`, cap(ci.outcome), 'outcome', rec);
    const strategies = (ci.strategiesUsed || []).map((s) =>
      ensure(`str:${norm(s)}`, s, 'strategy', rec)
    );

    // Link: Situation -> Emotion
    link(situation.id, emo.id, rec);

    if (strategies.length > 0) {
      for (const s of strategies) {
        // Link: Emotion -> Strategy
        link(emo.id, s.id, rec);
        // Link: Strategy -> Outcome
        link(s.id, outcome.id, rec);

        // Track in pathway map
        const pathKey = `${sitLabel}:::${ci.mood}:::${s.label}`;
        let p = pathwayMap.get(pathKey);
        if (!p) {
          p = {
            situation: sitLabel,
            mood: ci.mood,
            strategy: s.label,
            outcomes: {},
            totalCount: 0,
            helpfulCount: 0,
            recordIds: [],
            lastOccurred: ci.createdAt,
          };
          pathwayMap.set(pathKey, p);
        }
        p.outcomes[ci.outcome] = (p.outcomes[ci.outcome] || 0) + 1;
        p.totalCount += 1;
        if (ci.outcome === 'better' || ci.outcome === 'helpful') {
          p.helpfulCount += 1;
        }
        if (!p.recordIds.includes(ci.id)) {
          p.recordIds.push(ci.id);
        }
        p.lastOccurred = Math.max(p.lastOccurred, ci.createdAt);
      }
    } else {
      // Direct link if no strategy was recorded: Emotion -> Outcome
      link(emo.id, outcome.id, rec);

      const pathKey = `${sitLabel}:::${ci.mood}:::Unassisted pause`;
      let p = pathwayMap.get(pathKey);
      if (!p) {
        p = {
          situation: sitLabel,
          mood: ci.mood,
          strategy: 'Unassisted pause',
          outcomes: {},
          totalCount: 0,
          helpfulCount: 0,
          recordIds: [],
          lastOccurred: ci.createdAt,
        };
        pathwayMap.set(pathKey, p);
      }
      p.outcomes[ci.outcome] = (p.outcomes[ci.outcome] || 0) + 1;
      p.totalCount += 1;
      if (ci.outcome === 'better' || ci.outcome === 'helpful') {
        p.helpfulCount += 1;
      }
      if (!p.recordIds.includes(ci.id)) {
        p.recordIds.push(ci.id);
      }
      p.lastOccurred = Math.max(p.lastOccurred, ci.createdAt);
    }
  }

  // Experiments add strategy and context chains
  for (const ex of input.experiments) {
    const strat = ensure(`str:${norm(ex.strategy)}`, ex.strategy, 'strategy', ex.id);
    const ctx = ex.context?.trim()
      ? ensure(`sit:${norm(ex.context)}`, ex.context, 'situation', ex.id)
      : null;
    if (ctx) link(ctx.id, strat.id, ex.id);
  }

  // Convert pathways to sorted array
  const pathways: DiscoveredPathway[] = Array.from(pathwayMap.entries()).map(([key, data]) => {
    // Find dominant outcome
    let dominantOutcome = 'uncertain';
    let maxVotes = 0;
    for (const [out, count] of Object.entries(data.outcomes)) {
      if (count > maxVotes) {
        maxVotes = count;
        dominantOutcome = out;
      }
    }
    const helpfulRate = data.totalCount > 0 ? Math.round((data.helpfulCount / data.totalCount) * 100) : 0;

    return {
      id: key,
      situation: data.situation,
      mood: data.mood,
      strategy: data.strategy,
      outcomes: data.outcomes,
      totalCount: data.totalCount,
      helpfulCount: data.helpfulCount,
      helpfulRate,
      dominantOutcome,
      recordIds: data.recordIds,
      lastOccurred: data.lastOccurred,
    };
  }).sort((a, b) => b.totalCount - a.totalCount || b.helpfulRate - a.helpfulRate);

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    records: input.checkIns,
    experiments: input.experiments,
    attempts: input.attempts,
    insights: input.insights,
    pathways,
  };
}
