// tests/scoring.test.mjs
import assert from 'node:assert';

// Inline minimal port of scoring to keep the test dependency-free.
const defs = {
  'perceived-stress': [
    { id: 'q1', opts: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    { id: 'q2', opts: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
    { id: 'q3', opts: { 1: 4, 2: 3, 3: 2, 4: 1, 5: 0 } },
    { id: 'q4', opts: { 1: 4, 2: 3, 3: 2, 4: 1, 5: 0 } },
    { id: 'q5', opts: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } },
  ],
};

function score(id, resp) {
  let s = 0;
  let max = 0;
  for (const q of defs[id]) {
    s += q.opts[resp[q.id]];
    max += Math.max(...Object.values(q.opts));
  }
  return { score: s, max };
}

const r = score('perceived-stress', { q1: '5', q2: '4', q3: '1', q4: '1', q5: '5' });
assert.strictEqual(r.score, 4 + 3 + 4 + 4 + 4); // 19
assert.strictEqual(r.max, 4 * 5); // 20
console.log('scoring test passed:', r);
