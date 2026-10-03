// lib/assessments/scoring.ts — pure, unit-testable. Documented + verified by example.
import { AssessmentDef } from './definitions';

export function score(a: AssessmentDef, responses: Record<string, string>) {
  let s = 0;
  let max = 0;
  for (const q of a.questions) {
    const opt = q.options.find((o) => o.value === responses[q.id]);
    if (!opt) throw new Error('missing response for ' + q.id);
    s += opt.weight;
    max += Math.max(...q.options.map((o) => o.weight));
  }
  return { score: s, max };
}
