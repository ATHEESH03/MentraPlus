'use client';
import React, { useMemo, useState } from 'react';
import { MapModel } from '@/lib/map/model';
import { useForceLayout } from './useForceLayout';

const KIND_COLOR: Record<string, string> = {
  situation: '#E86A55',
  emotion: '#D98A2B',
  response: '#5C9A94',
  strategy: '#2F6F6A',
  outcome: '#8FA88A',
};

const KIND_LABEL: Record<string, string> = {
  situation: 'Situations',
  emotion: 'Feelings',
  response: 'Thoughts',
  strategy: 'Strategies',
  outcome: 'Outcomes',
};

export default function ResponseMap({
  model,
  recordsById,
}: {
  model: MapModel;
  recordsById: (id: string) => React.ReactNode | null;
}) {
  const [view, setView] = useState<'map' | 'timeline'>('map');
  const [sel, setSel] = useState<{ kind: 'node' | 'edge'; id: string } | null>(null);
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

  const filtered = useMemo(() => {
    const ids = new Set<string>();
    model.records.forEach((r) => {
      if (filter.from && r.createdAt < filter.from) return;
      if (filter.to && r.createdAt > filter.to) return;
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
    return { nodes, edges, records };
  }, [model, filter]);

  const { nodes } = useForceLayout(filtered.nodes, filtered.edges);

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
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-paper-deep p-1">
          {(['map', 'timeline'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                view === v ? 'bg-card text-ink shadow-soft' : 'text-ink-mute hover:text-ink'
              }`}
            >
              {v === 'map' ? 'Map' : 'Timeline'}
            </button>
          ))}
        </div>

        <select
          value={filter.kind ?? ''}
          onChange={(e) =>
            setFilter((f) => ({ ...f, kind: e.target.value || undefined }))
          }
          className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-ink focus:outline-none focus:border-teal"
        >
          <option value="">All node types</option>
          {Object.keys(KIND_LABEL).map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-xs text-ink-soft bg-card border border-line rounded-lg px-2.5 py-1.5">
          <span>From</span>
          <input
            type="date"
            value={filter.from ? new Date(filter.from).toISOString().slice(0, 10) : ''}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                from: e.target.value ? new Date(e.target.value).getTime() : undefined,
              }))
            }
            className="bg-transparent focus:outline-none text-ink"
          />
          <span>to</span>
          <input
            type="date"
            value={filter.to ? new Date(filter.to).toISOString().slice(0, 10) : ''}
            onChange={(e) =>
              setFilter((f) => ({
                ...f,
                to: e.target.value ? new Date(e.target.value).getTime() : undefined,
              }))
            }
            className="bg-transparent focus:outline-none text-ink"
          />
        </div>

        <div className="ml-auto flex gap-1">
          <button
            onClick={() => zoom(1.2)}
            aria-label="Zoom in"
            className="w-9 h-9 rounded-lg bg-card border border-line shadow-soft flex items-center justify-center font-bold text-ink hover:bg-paper-deep"
          >
            +
          </button>
          <button
            onClick={() => zoom(0.8)}
            aria-label="Zoom out"
            className="w-9 h-9 rounded-lg bg-card border border-line shadow-soft flex items-center justify-center font-bold text-ink hover:bg-paper-deep"
          >
            −
          </button>
          <button
            onClick={reset}
            aria-label="Reset view"
            className="px-3 h-9 rounded-lg bg-card border border-line text-sm text-ink hover:bg-paper-deep"
          >
            Reset
          </button>
        </div>
      </div>

      {/* SVG Canvas View */}
      {view === 'map' ? (
        <div
          className="relative overflow-hidden rounded-xl2 bg-paper-soft border border-line shadow-soft cursor-grab active:cursor-grabbing select-none"
          style={{ height: 540 }}
          onWheel={onWheel}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
          role="application"
          aria-label="Personal Response Map. Use Tab to focus nodes and Enter to inspect."
        >
          <svg width="100%" height="100%">
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
                return (
                  <line
                    key={e.id}
                    x1={s.x}
                    y1={s.y}
                    x2={tt.x}
                    y2={tt.y}
                    stroke="#C9BEA6"
                    strokeWidth={1 + e.weight * 0.8}
                    strokeOpacity={sel?.id === e.id ? 1 : 0.45}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((n) => {
                if (n.x === undefined || n.y === undefined) return null;
                const isSelected = sel?.id === n.id;
                const r = 10 + Math.min(18, n.recordIds.length * 2.5);
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x},${n.y})`}
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSel({ kind: 'node', id: n.id });
                    }}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && setSel({ kind: 'node', id: n.id })
                    }
                    className="cursor-pointer outline-none group"
                    role="button"
                    aria-label={`${n.label}, ${KIND_LABEL[n.kind]}, ${n.count} records`}
                  >
                    <circle
                      r={r}
                      fill={KIND_COLOR[n.kind] || '#2F6F6A'}
                      fillOpacity={isSelected ? 1 : 0.85}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3.5 : 2}
                      className="transition-all duration-150 group-hover:scale-110"
                    />
                    <text
                      textAnchor="middle"
                      dy={r + 14}
                      fontSize="11"
                      fill="#3A4A4B"
                      fontWeight={600}
                      className="pointer-events-none drop-shadow-sm"
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 rounded-xl bg-card/90 backdrop-blur border border-line px-3 py-2 text-xs flex flex-wrap gap-3 shadow-soft">
            {Object.keys(KIND_LABEL).map((k) => (
              <span key={k} className="flex items-center gap-1.5 font-medium text-ink-soft">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: KIND_COLOR[k] }}
                />
                {KIND_LABEL[k]}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <Timeline model={filtered} />
      )}

      {/* Selected Inspector Card */}
      {selected && (
        <div className="rounded-xl2 bg-card border border-line p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide font-medium text-ink-mute">
                {KIND_LABEL[(selected as any).kind] ?? 'Connection'}
              </div>
              <div className="font-display text-xl text-ink mt-0.5">
                {(selected as any).label ?? 'Relationship'}
              </div>
            </div>
            <button
              onClick={() => setSel(null)}
              className="text-xs text-ink-mute hover:text-ink px-2 py-1 rounded bg-paper-deep"
            >
              Close
            </button>
          </div>
          <div className="text-sm text-ink-soft mt-1">
            Supported by {(selected as any).recordIds?.length} recorded experience
            {(selected as any).recordIds?.length === 1 ? '' : 's'}.
          </div>
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
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
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
      {items.map((r) => (
        <div key={r.id} className="rounded-xl bg-card border border-line p-4 text-sm shadow-soft">
          <div className="text-ink-mute text-xs mb-1">
            {new Date(r.createdAt).toLocaleString()}
          </div>
          <div className="text-ink font-medium">
            <span className="text-coral-deep">{r.situation || 'Situation'}</span> →{' '}
            <span className="text-amber-600">{r.mood}</span>
            {r.strategiesUsed?.length ? (
              <>
                {' '}
                → <span className="text-teal-deep">{r.strategiesUsed.join(', ')}</span>
              </>
            ) : (
              ''
            )}{' '}
            → <span className="text-sage font-semibold">{r.outcome}</span>
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
