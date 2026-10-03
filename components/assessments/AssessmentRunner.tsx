'use client';
import React, { useState, useEffect } from 'react';
import { AssessmentDef } from '@/lib/assessments/definitions';
import { score } from '@/lib/assessments/scoring';
import { saveAssessmentResult, saveDraft, getDraft } from '@/lib/data/assessments';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function AssessmentRunner({
  assessment,
  initialResponses = {},
}: {
  assessment: AssessmentDef;
  initialResponses?: Record<string, string>;
}) {
  const { user } = useAuth();
  const router = useRouter();

  const [responses, setResponses] = useState<Record<string, string>>(initialResponses);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    max: number;
    interpretation: string;
  } | null>(null);

  useEffect(() => {
    if (user && Object.keys(responses).length === 0) {
      getDraft(user.uid, assessment.id).then((draft) => {
        if (draft) setResponses(draft);
      });
    }
  }, [user, assessment.id]);

  const q = assessment.questions[currentIdx];
  const isLast = currentIdx === assessment.questions.length - 1;
  const allAnswered = assessment.questions.every((item) => Boolean(responses[item.id]));

  const selectOption = async (val: string) => {
    const updated = { ...responses, [q.id]: val };
    setResponses(updated);
    if (user) {
      await saveDraft(user.uid, assessment.id, updated);
    }
    if (!isLast) {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleFinish = async () => {
    if (!user || !allAnswered || submitting) return;
    setSubmitting(true);
    try {
      const scored = score(assessment, responses);
      const interp = assessment.interpretation(scored.score, scored.max);

      await saveAssessmentResult(user.uid, {
        assessmentId: assessment.id,
        version: assessment.version,
        responses,
        score: scored.score,
        interpretation: interp,
      });

      setResult({
        score: scored.score,
        max: scored.max,
        interpretation: interp,
      });
    } catch (e) {
      console.error('Assessment submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-xl2 bg-card border border-line p-6 sm:p-8 shadow-soft max-w-2xl mx-auto space-y-6 animate-breathe-in">
        <div>
          <span className="text-xs uppercase tracking-wider text-teal font-semibold">
            Reflection Complete
          </span>
          <h2 className="font-display text-3xl text-ink mt-1">{assessment.title}</h2>
          <p className="text-sm text-ink-mute mt-1">
            Recorded score: {result.score} of {result.max}
          </p>
        </div>

        <div className="rounded-xl bg-paper-soft border border-line p-5">
          <h4 className="font-display text-lg text-ink">Personal Observation</h4>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            {result.interpretation}
          </p>
        </div>

        <div className="rounded-xl bg-paper-deep/60 p-4 text-xs text-ink-mute space-y-1">
          <div className="font-semibold text-ink-soft">Important limitations:</div>
          <div>{assessment.limitations}</div>
          <div className="italic pt-1">{assessment.source}</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/app/assess')}
            className="bg-ink text-paper px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-ink-soft"
          >
            Back to assessments
          </button>
          <button
            onClick={() => router.push('/app/map')}
            className="border border-line px-5 py-2.5 rounded-xl text-sm text-ink-soft hover:bg-paper-deep"
          >
            View in Response Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & disclaimer */}
      <div className="border-b border-line pb-4">
        <h1 className="font-display text-3xl text-ink">{assessment.title}</h1>
        <p className="text-sm text-ink-soft mt-1">{assessment.purpose}</p>
        <div className="mt-3 text-xs text-ink-mute bg-paper-deep/50 p-3 rounded-xl border border-line">
          <strong>Non-diagnostic self-reflection:</strong> {assessment.limitations}
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-ink-mute mb-1.5 font-medium">
          <span>
            Question {currentIdx + 1} of {assessment.questions.length}
          </span>
          <span>
            {Math.round(((currentIdx + 1) / assessment.questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-paper-deep rounded-full overflow-hidden">
          <div
            className="h-full bg-teal transition-all duration-300"
            style={{
              width: `${((currentIdx + 1) / assessment.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current Question */}
      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft space-y-5">
        <h3 className="font-display text-xl text-ink leading-snug">{q.text}</h3>

        <div className="space-y-2.5">
          {q.options.map((opt) => {
            const selected = responses[q.id] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => selectOption(opt.value)}
                className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between text-sm ${
                  selected
                    ? 'border-teal bg-teal/10 text-teal-deep font-semibold'
                    : 'border-line bg-paper-soft text-ink-soft hover:bg-paper-deep'
                }`}
              >
                <span>{opt.label}</span>
                {selected && <span className="text-teal font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          className="text-sm text-ink-mute hover:text-ink disabled:opacity-30 px-3 py-2"
        >
          Previous
        </button>

        {isLast ? (
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={handleFinish}
            className="bg-coral text-white px-7 py-2.5 rounded-xl text-sm font-medium shadow-soft hover:bg-coral-deep disabled:opacity-50 transition"
          >
            {submitting ? 'Saving...' : 'Submit Reflection'}
          </button>
        ) : (
          <button
            type="button"
            disabled={!responses[q.id]}
            onClick={() => setCurrentIdx((i) => Math.min(assessment.questions.length - 1, i + 1))}
            className="bg-ink text-paper px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-ink-soft disabled:opacity-50 transition"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
