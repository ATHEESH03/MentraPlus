// lib/utils.ts
export const uid = () => Math.random().toString(36).slice(2, 10);
export const now = () => Date.now();
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function handleFromName(name: string) {
  const base = (name || 'wanderer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12) || 'wanderer';
  return `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function relTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fmtDateTime(ts: number) {
  const d = new Date(ts);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${fmtTime(ts)}`;
}

export function pl(n: number, s: string) {
  return `${n} ${s}${n === 1 ? '' : 's'}`;
}
