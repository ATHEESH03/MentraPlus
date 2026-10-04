'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapModel, MapNode, DiscoveredPathway } from '@/lib/map/model';
import { useForceLayout } from './useForceLayout';

const KIND_COLOR: Record<string, string> = {
  situation: '#E86A55',
  emotion: '#D98A2B',
  strategy: '#2F6F6A',
  outcome: '#8FA88A',
};

const KIND_LABEL: Record<string, string> = {
  situation: 'Situations & Triggers',
  emotion: 'Emotions & Moods',
  strategy: 'Coping Strategies',
  outcome: 'Reported Outcomes',
};

const KIND_ICON: Record<string, string> = {
  situation: '⚡',
  emotion: '💭',
  strategy: '🛠️',
  outcome: '🌟',
};

export default function ResponseMap({
  model,
  recordsById,
}: {
  model: MapModel;
  recordsById: (id: string) => React.ReactNode | null;
}) {
  const [view, setView] = useState<'map' | 'pathways' | 'timeline'>('map');
  const [sel, setSel] = useState<{ kind: 'node' | 'edge'; id: string } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [presetFilter, setPresetFilter] = useState<string>('all');
  const [filter, setFilter] = useState<{
    from?: number;
    to?: number;
    kind?: string;
  }>({});
  const [t, setT] = useState({ x: 0, y: 0, k: 1 });
  const [drag, setDrag] = useState<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const ids = new Set<string>();
    model.records.forEach((r) => {
      // Disallow any future timestamps
      if (r.createdAt > now + 60000) return;
      if (filter.from && r.createdAt < filter.from) return;
      if (filter.to && r.createdAt > filter.to + 86400000 - 1) return;

      // Preset filter checks
      if (presetFilter === 'helpful-only') {
        if (r.outcome !== 'better' && r.outcome !== 'helpful') return;
      } else if (presetFilter === 'stress-only') {
        if (r.stress < 50 && r.mood !== 'anxious' && r.mood !== 'overwhelmed') return;
      }
      ids.add(r.id);
    });

    const nodes = model.nodes.filter(
      (n) =>
        n.recordIds.some((id) => ids.has(id)) &&
        (!filter.kind || n.kind === filter.kind)
    );
    const nids = new Set(nodes.map((n) => n.id));
    const edges = model.edges.filter(
      (e) =>
        nids.has(e.source) &&
        nids.has(e.target) &&
        e.recordIds.some((id) => ids.has(id))
    );
    const records = model.records.filter((r) => ids.has(r.id));
    const pathways = (model.pathways || []).filter((p) =>
      p.recordIds.some((id) => ids.has(id))
    );

    return { nodes, edges, records, pathways };
  }, [model, filter, presetFilter]);

  const { nodes } = useForceLayout(filtered.nodes, filtered.edges);

  // Connected nodes & edges calculation for active highlighting
  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    if (!sel || sel.kind !== 'node') {
      return { connectedNodeIds: new Set<string>(), connectedEdgeIds: new Set<string>() };
    }
    const nodeIds = new Set<string>([sel.id]);
    const edgeIds = new Set<string>();

    filtered.edges.forEach((e) => {
      if (e.source === sel.id || e.target === sel.id) {
        edgeIds.add(e.id);
        nodeIds.add(e.source);
        nodeIds.add(e.target);
      }
    });

    return { connectedNodeIds: nodeIds, connectedEdgeIds: edgeIds };
  }, [sel, filtered.edges]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const k = Math.max(0.4, Math.min(3, t.k - e.deltaY * 0.001));
    setT((p) => ({ ...p, k }));
  };

  const onDown = (e: React.PointerEvent) => {
    setDrag({ sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    setT((p) => ({
      ...p,
      x: drag.ox + (e.clientX - drag.sx),
      y: drag.oy + (e.clientY - drag.sy),
    }));
  };

  const zoom = (f: number) =>
    setT((p) => ({ ...p, k: Math.max(0.4, Math.min(3, p.k * f)) }));
  const reset = () => setT({ x: 0, y: 0, k: 1 });

  const selected = sel
    ? sel.kind === 'node'
      ? filtered.nodes.find((n) => n.id === sel.id)
      : filtered.edges.find((e) => e.id === sel.id)
    : null;

  const selRecs = selected
    ? selected.recordIds.map(recordsById).filter(Boolean)
    : [];

  return (
    <div className="space-y-4">
      {/* View Switcher & Exploratory Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-line p-3 rounded-xl2 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main View Tabs */}
          <div className="flex rounded-xl bg-paper-deep p-1">
            {[
              { id: 'map', label: '🗺️ Network Map' },
              { id: 'pathways', label: '✨ Discovered Pathways' },
              { id: 'timeline', label: '📅 Detailed Timeline' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  view === v.id ? 'bg-card text-ink shadow-soft' : 'text-ink-mute hover:text-ink'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-ink-mute hidden sm:inline">Explore:</span>
            {[
              { id: 'all', label: 'All records' },
              { id: 'helpful-only', label: '🌟 Helpful paths' },
              { id: 'stress-only', label: '⚡ High stress' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPresetFilter(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  presetFilter === p.id
                    ? 'bg-teal text-white font-semibold shadow-soft'
                    : 'bg-paper-soft text-ink-soft hover:bg-paper-deep'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters: Category & Dates */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter.kind ?? ''}
            onChange={(e) =>
              setFilter((f) => ({ ...f, kind: e.target.value || undefined }))
            }
            className="rounded-lg border border-line bg-paper-soft px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-teal"
          >
            <option value="">All node types</option>
            {Object.keys(KIND_LABEL).map((k) => (
              <option key={k} value={k}>
                {KIND_ICON[k]} {KIND_LABEL[k]}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-ink-soft bg-paper-soft border border-line rounded-lg px-2.5 py-1.5">
            <span>From</span>
            <input
              type="date"
              max={todayStr}
              value={filter.from ? new Date(filter.from).toISOString().slice(0, 10) : ''}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  from: e.target.value ? new Date(e.target.value).getTime() : undefined,
                }))
              }
              className="bg-transparent focus:outline-none text-ink text-xs"
            />
            <span>to</span>
            <input
              type="date"
              max={todayStr}
              value={filter.to ? new Date(filter.to).toISOString().slice(0, 10) : ''}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  to: e.target.value ? new Date(e.target.value).getTime() : undefined,
                }))
              }
              className="bg-transparent focus:outline-none text-ink text-xs"
            />
          </div>

          {view === 'map' && (
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => zoom(1.2)}
                aria-label="Zoom in"
                className="w-8 h-8 rounded-lg bg-paper-soft border border-line shadow-soft flex items-center justify-center font-bold text-ink hover:bg-paper-deep text-xs"
              >
                +
              </button>
              <button
                onClick={() => zoom(0.8)}
                aria-label="Zoom out"
                className="w-8 h-8 rounded-lg bg-paper-soft border border-line shadow-soft flex items-center justify-center font-bold text-ink hover:bg-paper-deep text-xs"
              >
                −
              </button>
              <button
                onClick={reset}
                aria-label="Reset view"
                className="px-2.5 h-8 rounded-lg bg-paper-soft border border-line text-xs text-ink hover:bg-paper-deep"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE NETWORK MAP */}
      {view === 'map' && (
        <div
          className="relative overflow-hidden rounded-xl2 bg-paper-soft border border-line shadow-soft cursor-grab active:cursor-grabbing select-none"
          style={{ height: 560 }}
          onWheel={onWheel}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => {
            setDrag(null);
            setHoveredNode(null);
          }}
          role="application"
          aria-label="Personal Response Map. Click any node to trace its complete response pathway."
        >
          {/* Floating Instructions & Hover Card */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-none">
            <div className="rounded-xl bg-card/90 backdrop-blur border border-line px-3 py-1.5 text-xs text-ink-soft shadow-soft">
              💡 <span className="font-semibold text-ink">Click any node</span> to highlight its complete cause-and-effect pathway
            </div>
            {hoveredNode && (
              <div className="rounded-xl bg-ink/90 text-paper backdrop-blur px-3 py-1.5 text-xs shadow-lift animate-breathe-in">
                <span className="mr-1.5">{KIND_ICON[hoveredNode.kind]}</span>
                <span className="font-semibold">{hoveredNode.label}</span>
                <span className="text-paper/70 ml-1.5">({hoveredNode.count} check-ins)</span>
              </div>
            )}
          </div>

          {/* SVG Map Canvas */}
          <svg width="100%" height="100%">
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E86A55" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#2F6F6A" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8FA88A" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            <g
              transform={`translate(${t.x},${t.y}) scale(${t.k})`}
              style={{ transformOrigin: 'center center' }}
            >
              {/* Edges */}
              {filtered.edges.map((e) => {
                const s = nodes.find((n) => n.id === e.source);
                const tt = nodes.find((n) => n.id === e.target);
                if (!s || !tt || s.x === undefined || s.y === undefined || tt.x === undefined || tt.y === undefined)
                  return null;

                const isHighlighted = sel ? connectedEdgeIds.has(e.id) : true;
                const isDirectlySelected = sel?.id === e.id;

                return (
                  <line
                    key={e.id}
                    x1={s.x}
                    y1={s.y}
                    x2={tt.x}
                    y2={tt.y}
                    stroke={isHighlighted ? (isDirectlySelected ? '#2F6F6A' : '#A3B899') : '#DCD6C8'}
                    strokeWidth={isHighlighted ? (isDirectlySelected ? 3.5 : 1.5 + e.weight * 0.8) : 1}
                    strokeOpacity={isHighlighted ? (sel ? 0.95 : 0.6) : 0.15}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((n) => {
                if (n.x === undefined || n.y === undefined) return null;
                const isSelected = sel?.id === n.id;
                const isConnected = sel ? connectedNodeIds.has(n.id) : true;
                const r = 12 + Math.min(18, n.recordIds.length * 2.5);

                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSel(sel?.id === n.id ? null : { kind: 'node', id: n.id });
                    }}
                    onPointerEnter={() => setHoveredNode(n)}
                    onPointerLeave={() => setHoveredNode(null)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && setSel(sel?.id === n.id ? null : { kind: 'node', id: n.id })
                    }
                    className="cursor-pointer outline-none group"
                    role="button"
                    aria-label={`${n.label}, ${KIND_LABEL[n.kind]}, ${n.count} records`}
                    opacity={isConnected ? 1 : 0.22}
                  >
                    {/* Pulsing ring on selection */}
                    {isSelected && (
                      <circle
                        r={r + 6}
                        fill="none"
                        stroke={KIND_COLOR[n.kind] || '#2F6F6A'}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ animationDuration: '8s' }}
                      />
                    )}

                    <circle
                      r={r}
                      fill={KIND_COLOR[n.kind] || '#2F6F6A'}
                      fillOpacity={isSelected ? 1 : 0.9}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3.5 : 2}
                      className="transition-all duration-150 group-hover:scale-115 drop-shadow-sm"
                    />

                    {/* Kind Icon Inside Node */}
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="10"
                      fill="#ffffff"
                      className="pointer-events-none font-bold"
                    >
                      {KIND_ICON[n.kind]}
                    </text>

                    {/* Node Label Below */}
                    <text
                      textAnchor="middle"
                      dy={r + 14}
                      fontSize="11"
                      fill={isSelected ? '#111827' : '#3A4A4B'}
                      fontWeight={isSelected ? 700 : 600}
                      className="pointer-events-none drop-shadow-sm select-none"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 rounded-xl bg-card/95 backdrop-blur border border-line px-3.5 py-2 text-xs flex flex-wrap items-center gap-3.5 shadow-soft z-10">
            <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">Flow:</span>
            {Object.keys(KIND_LABEL).map((k) => (
              <span key={k} className="flex items-center gap-1.5 font-medium text-ink-soft">
                <span>{KIND_ICON[k]}</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: KIND_COLOR[k] }}
                />
                {KIND_LABEL[k]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: DISCOVERED PATHWAYS (NEW EXPLORATORY MODE) */}
      {view === 'pathways' && (
        <DiscoveredPathwaysExplorer pathways={filtered.pathways} />
      )}

      {/* VIEW 3: DETAILED TIMELINE */}
      {view === 'timeline' && (
        <Timeline model={filtered} />
      )}

      {/* Selected Node Inspector Drawer */}
      {selected && (
        <div className="rounded-xl2 bg-card border-2 border-teal/40 p-6 shadow-soft space-y-4 animate-breathe-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-xl bg-paper-deep">
                {KIND_ICON[(selected as any).kind] || '🔍'}
              </span>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-teal-deep">
                  {KIND_LABEL[(selected as any).kind] ?? 'Pathway Link'}
                </span>
                <h3 className="font-display text-2xl text-ink font-semibold">
                  {(selected as any).label ?? 'Relationship'}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSel(null)}
              className="text-xs text-ink-mute hover:text-ink px-3 py-1.5 rounded-lg bg-paper-deep font-medium"
            >
              ✕ Close Inspector
            </button>
          </div>

          <div className="text-xs text-ink-soft bg-paper-soft p-3 rounded-xl border border-line flex flex-wrap justify-between items-center gap-2">
            <span>
              Supported by <strong>{(selected as any).recordIds?.length}</strong> personal check-in
              {(selected as any).recordIds?.length === 1 ? '' : 's'}.
            </span>
            {(selected as any).kind === 'strategy' && (
              <Link
                href={`/app/experiments/new?strategy=${encodeURIComponent((selected as any).label)}&question=${encodeURIComponent(`Does practicing ${(selected as any).label} reliably improve my focus and calm?`)}`}
                className="text-teal-deep font-semibold hover:underline"
              >
                Test in a 3-Day Experiment →
              </Link>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <span className="text-xs uppercase tracking-wider text-ink-mute font-bold block">
              Linked Check-in Details:
            </span>
            {selRecs.length > 0 ? (
              selRecs
            ) : (
              <p className="text-xs text-ink-mute">Linked record details will display here.</p>
            )}
          </div>
        </div>
      )}

      {filtered.nodes.length === 0 && (
        <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center text-ink-mute">
          Not enough recorded experiences for this filter yet. Try a check-in to begin the map.
        </div>
      )}
    </div>
  );
}

// Exploratory Pathways Component
function DiscoveredPathwaysExplorer({
  pathways,
}: {
  pathways: DiscoveredPathway[];
}) {
  const [selectedSituation, setSelectedSituation] = useState<string>('All');
  const [selectedMood, setSelectedMood] = useState<string>('All');

  const uniqueSituations = useMemo(() => {
    const set = new Set<string>();
    pathways.forEach((p) => set.add(p.situation));
    return ['All', ...Array.from(set)];
  }, [pathways]);

  const uniqueMoods = useMemo(() => {
    const set = new Set<string>();
    pathways.forEach((p) => set.add(p.mood));
    return ['All', ...Array.from(set)];
  }, [pathways]);

  const filteredPathways = useMemo(() => {
    return pathways.filter((p) => {
      if (selectedSituation !== 'All' && p.situation !== selectedSituation) return false;
      if (selectedMood !== 'All' && p.mood !== selectedMood) return false;
      return true;
    });
  }, [pathways, selectedSituation, selectedMood]);

  if (pathways.length === 0) {
    return (
      <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center text-ink-mute text-sm">
        No pathways recorded yet. Log a check-in with a strategy to trace your response patterns.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Overview Callout */}
      <div className="rounded-xl2 bg-card border border-line p-5 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-teal-deep font-bold">
            Personal Response Insights
          </span>
          <h3 className="font-display text-xl text-ink mt-0.5">
            Discovered Cause-and-Effect Chains
          </h3>
          <p className="text-xs text-ink-soft mt-1">
            Mentra+ discovers what strategies actually work for specific academic and emotional triggers.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSituation}
            onChange={(e) => setSelectedSituation(e.target.value)}
            className="rounded-lg border border-line bg-paper-soft px-3 py-1.5 text-xs text-ink focus:border-teal focus:outline-none"
          >
            <option value="All">All Triggers</option>
            {uniqueSituations.filter((s) => s !== 'All').map((s) => (
              <option key={s} value={s}>
                Trigger: {s}
              </option>
            ))}
          </select>

          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="rounded-lg border border-line bg-paper-soft px-3 py-1.5 text-xs text-ink focus:border-teal focus:outline-none"
          >
            <option value="All">All Feelings</option>
            {uniqueMoods.filter((m) => m !== 'All').map((m) => (
              <option key={m} value={m}>
                Feeling: {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pathways Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredPathways.map((p) => {
          const isHighSuccess = p.helpfulRate >= 60;

          return (
            <div
              key={p.id}
              className="rounded-xl bg-card border border-line p-5 shadow-soft hover:border-teal/50 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Pathway Badges Header */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isHighSuccess
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {p.helpfulRate}% Helpful Outcome
                  </span>
                  <span className="text-xs text-ink-mute font-medium">
                    {p.totalCount} logged instance{p.totalCount === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Chain Visualization */}
                <div className="p-3.5 bg-paper-soft rounded-xl border border-line space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-ink flex-wrap">
                    <span className="bg-coral/10 text-coral-deep font-semibold px-2 py-0.5 rounded">
                      ⚡ {p.situation}
                    </span>
                    <span className="text-ink-mute">➔</span>
                    <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded">
                      💭 {p.mood}
                    </span>
                    <span className="text-ink-mute">➔</span>
                    <span className="bg-teal/10 text-teal-deep font-bold px-2 py-0.5 rounded">
                      🛠️ {p.strategy}
                    </span>
                    <span className="text-ink-mute">➔</span>
                    <span className="bg-sage/20 text-teal-deep font-bold px-2 py-0.5 rounded">
                      🌟 {p.dominantOutcome}
                    </span>
                  </div>
                </div>

                {/* Breakdown by outcome */}
                <div className="text-xs text-ink-soft space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-ink-mute font-semibold block">
                    Recorded Results:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(p.outcomes).map(([outcome, count]) => (
                      <span
                        key={outcome}
                        className="text-[11px] px-2 py-0.5 rounded bg-paper-deep text-ink-soft"
                      >
                        {count}× {outcome}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                <Link
                  href={`/app/experiments/new?strategy=${encodeURIComponent(
                    p.strategy
                  )}&question=${encodeURIComponent(
                    `When ${p.situation} triggers feeling ${p.mood}, does practicing ${p.strategy} help?`
                  )}`}
                  className="text-teal-deep font-semibold hover:underline"
                >
                  Turn into 3-Day Test →
                </Link>
                <Link
                  href="/app/check-in"
                  className="text-ink-mute hover:text-ink"
                >
                  Log check-in
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Timeline({
  model,
}: {
  model: { records: any[]; experiments?: any[] };
}) {
  const items = [...(model.records || [])].sort((a, b) => b.createdAt - a.createdAt);

  if (!items.length) {
    return (
      <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center text-ink-mute">
        No records in range.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
      {items.map((r) => (
        <div key={r.id} className="rounded-xl bg-card border border-line p-4 text-sm shadow-soft">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-ink-mute font-medium">
              {new Date(r.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="font-mono bg-paper-deep px-2 py-0.5 rounded text-[11px] text-teal-deep font-semibold">
              {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-ink font-medium">
            <span className="text-coral-deep">⚡ {r.situation || 'Situation'}</span> →{' '}
            <span className="text-amber-600">💭 {r.mood}</span>
            {r.strategiesUsed?.length ? (
              <>
                {' '}
                → <span className="text-teal-deep">🛠️ {r.strategiesUsed.join(', ')}</span>
              </>
            ) : (
              ''
            )}{' '}
            → <span className="text-sage font-semibold">🌟 {r.outcome}</span>
          </div>
          {r.thought && (
            <div className="text-ink-soft text-xs mt-2 italic bg-paper-soft p-2 rounded-lg">
              "{r.thought}"
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
