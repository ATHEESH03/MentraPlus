'use client';
import { useEffect, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceX,
  forceY,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import { MapNode, MapEdge, NodeKind } from '@/lib/map/model';

export type N = MapNode & SimulationNodeDatum;

const KX: Record<NodeKind, number> = {
  situation: -260,
  emotion: -90,
  strategy: 90,
  outcome: 260,
};

export function useForceLayout(nodes: MapNode[], edges: MapEdge[], W = 900, H = 640) {
  const [tick, setTick] = useState(0);
  const simRef = useRef<any>(null);

  useEffect(() => {
    if (!nodes.length) {
      return;
    }

    const ns: N[] = nodes.map((n) => ({
      ...n,
      x: W / 2 + KX[n.kind] + (Math.random() * 40 - 20),
      y: H / 2 + (Math.random() * 200 - 100),
    }));

    const byId = new Map(ns.map((n) => [n.id, n]));
    const ls: SimulationLinkDatum<N>[] = edges
      .filter((e) => byId.has(e.source) && byId.has(e.target))
      .map((e) => ({
        source: byId.get(e.source)!,
        target: byId.get(e.target)!,
        weight: e.weight,
      } as any));

    const sim = forceSimulation(ns as any)
      .force(
        'link',
        forceLink(ls)
          .distance((l: any) => Math.max(50, 120 - (l.weight || 1) * 8))
          .strength(0.7)
      )
      .force('charge', forceManyBody().strength(-320))
      .force('center', forceCenter(W / 2, H / 2))
      .force('x', forceX((d: any) => W / 2 + (KX[d.kind as NodeKind] || 0)).strength(0.12))
      .force('y', forceY(H / 2).strength(0.06))
      .alpha(1)
      .alphaDecay(0.03)
      .on('tick', () => setTick((t) => t + 1));

    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes, edges, W, H]);

  return { nodes: (simRef.current?.nodes() ?? []) as N[], tick };
}
