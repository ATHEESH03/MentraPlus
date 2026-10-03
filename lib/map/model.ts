// lib/map/model.ts — pure, testable. NO fabricated edges: an edge exists only
// because a stored record contains both endpoints.
import { CheckIn, Experiment, Attempt, Insight } from '@/lib/types';

export type NodeKind = 'situation' | 'emotion' | 'response' | 'strategy' | 'outcome';

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

export interface MapModel {
  nodes: MapNode[];
  edges: MapEdge[];
  records: CheckIn[];
  experiments: Experiment[];
  attempts: Attempt[];
  insights: Insight[];
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

  for (const ci of input.checkIns) {
    const rec = ci.id;
    const situation = ci.situation?.trim()
      ? ensure(`sit:${norm(ci.situation)}`, ci.situation, 'situation', rec)
      : null;
    const emo = ensure(`emo:${ci.mood}`, cap(ci.mood), 'emotion', rec);
    const resp = ci.thought?.trim()
      ? ensure(`resp:${norm(ci.thought).slice(0, 40)}`, truncate(ci.thought, 42), 'response', rec)
      : null;
    const outcome = ensure(`out:${ci.outcome}`, cap(ci.outcome), 'outcome', rec);
    const strategies = (ci.strategiesUsed || []).map((s) =>
      ensure(`str:${norm(s)}`, s, 'strategy', rec)
    );

    if (situation) link(situation.id, emo.id, rec);
    if (resp) {
      link(emo.id, resp.id, rec);
      if (situation) link(situation.id, resp.id, rec);
    }
    for (const s of strategies) {
      link(resp ? resp.id : emo.id, s.id, rec);
      link(s.id, outcome.id, rec);
    }
    if (!strategies.length) {
      link(resp ? resp.id : emo.id, outcome.id, rec);
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

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    records: input.checkIns,
    experiments: input.experiments,
    attempts: input.attempts,
    insights: input.insights,
  };
}
