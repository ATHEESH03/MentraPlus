'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AssessmentDef } from '@/lib/assessments/definitions';
import { score } from '@/lib/assessments/scoring';
import { saveAssessmentResult, saveDraft, getDraft, getLatestAssessmentResult } from '@/lib/data/assessments';
import { useAuth } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';

export function AssessmentRunner({
  assessment,
  initialResponses = {},
}: {
  assessment: AssessmentDef;
  initialResponses?: Record<string, string>;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams ? searchParams.get('view') : null;

  const [responses, setResponses] = useState<Record<string, string>>(initialResponses);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [loadingObservation, setLoadingObservation] = useState(viewMode === 'last');
  const [result, setResult] = useState<{
    score: number;
    max: number;
    interpretation: string;
    isPastObservation?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    if (viewMode === 'last') {
      setLoadingObservation(true);
      getLatestAssessmentResult(user.uid, assessment.id)
        .then((latest) => {
          if (latest) {
            const scored = score(assessment, latest.responses || {});
            setResult({
              score: latest.score !== undefined ? latest.score : scored.score,
              max: scored.max,
              interpretation: latest.interpretation || assessment.interpretation(latest.score ?? scored.score, scored.max),
              isPastObservation: true,
            });
            if (latest.responses) {
              setResponses(latest.responses);
            }
          }
        })
        .finally(() => setLoadingObservation(false));
    } else if (Object.keys(responses).length === 0) {
      getDraft(user.uid, assessment.id).then((draft) => {
        if (draft) setResponses(draft);
      });
    }
  }, [user, assessment.id, viewMode]);

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

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loadingObservation) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="md" />
        <p className="text-xs text-ink-mute">Loading your last observation...</p>
      </div>
    );
  }

  if (result) {
    const plan = assessment.actionPlan(result.score, result.max);
    const tierBadgeStyle =
      plan.tier === 'high'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : plan.tier === 'moderate'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

    return (
      <div className="rounded-xl2 bg-card border border-line p-6 sm:p-8 shadow-soft max-w-3xl mx-auto space-y-6 animate-breathe-in">
        {result.isPastObservation && (
          <div className="bg-paper-deep text-teal-deep text-xs font-semibold px-3.5 py-2 rounded-xl inline-flex items-center gap-2 border border-line">
            <span>📋</span>
            <span>Viewing your most recent recorded observation</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-teal-deep font-semibold">
              {result.isPastObservation ? 'Recorded Reflection' : 'Assessment Completed'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-ink mt-0.5">
              {assessment.title}
            </h2>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-xs text-ink-mute block">Recorded Score</span>
            <span className="font-display text-2xl text-ink font-bold">
              {result.score} <span className="text-sm font-normal text-ink-mute">/ {result.max}</span>
            </span>
          </div>
        </div>

        {/* Observation Callout */}
        <div className="rounded-xl bg-paper-soft border border-line p-4.5">
          <h4 className="font-display text-base text-ink font-semibold">Personal Observation</h4>
          <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed">
            {result.interpretation}
          </p>
        </div>

        {/* EXACT WHAT TO DO NEXT SECTION */}
        <div className="rounded-xl2 bg-gradient-to-b from-paper-deep/40 to-paper-soft border-2 border-teal/20 p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tierBadgeStyle}`}>
                {plan.tierLabel}
              </span>
              <h3 className="font-display text-xl text-ink mt-1.5 flex items-center gap-2">
                <span>🎯 Exact Things To Do Next</span>
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-ink-soft font-medium leading-relaxed">
            {plan.headline}
          </p>

          {/* Actionable Steps Checklist */}
          <div className="space-y-2.5">
            <span className="text-xs uppercase tracking-wider text-ink-mute font-bold block">
              Prioritized Action Steps (Check off as you do them):
            </span>
            {plan.exactSteps.map((step, idx) => {
              const isDone = Boolean(completedSteps[idx]);
              return (
                <div
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition flex items-start gap-3 select-none ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 line-through opacity-80'
                      : 'bg-card border-line text-ink hover:border-teal/50 shadow-soft'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-teal focus:ring-teal cursor-pointer"
                  />
                  <div className="flex-1 leading-relaxed font-medium">
                    <span className="font-bold text-teal-deep mr-1.5">Step {idx + 1}:</span>
                    {step}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strategy & Experiment Recommended Cards */}
          <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
            {/* Recommended Strategy Card */}
            <div className="rounded-xl bg-card border border-line p-4 space-y-2 shadow-soft">
              <span className="text-[11px] uppercase tracking-wider text-teal-deep font-bold block">
                ⭐ Recommended Coping Tool
              </span>
              <div className="font-display text-base text-ink font-semibold">
                {plan.recommendedStrategy.name}
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                {plan.recommendedStrategy.why}
              </p>
              <Link
                href="/app/playbook"
                className="inline-block text-xs font-semibold text-teal-deep hover:underline pt-1"
              >
                View in Strategy Playbook →
              </Link>
            </div>

            {/* Suggested Experiment Card */}
            <div className="rounded-xl bg-card border border-line p-4 space-y-2 shadow-soft">
              <span className="text-[11px] uppercase tracking-wider text-coral-deep font-bold block">
                🧪 Suggested Micro-Experiment
              </span>
              <div className="font-display text-base text-ink font-semibold">
                3-Day Trial
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                "{plan.suggestedExperiment.question}"
              </p>
              <Link
                href={`/app/experiments/new?question=${encodeURIComponent(
                  plan.suggestedExperiment.question
                )}&strategy=${encodeURIComponent(plan.suggestedExperiment.strategy)}`}
                className="inline-block text-xs font-semibold text-coral-deep hover:underline pt-1"
              >
                Launch this experiment now →
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {plan.studioActivity && (
              <Link
                href={plan.studioActivity.path}
                className="inline-flex items-center gap-1.5 bg-card border border-line hover:border-teal px-3.5 py-2 rounded-xl text-xs font-medium text-ink transition shadow-soft"
              >
                <span>🫧</span>
                <span>{plan.studioActivity.name}</span>
              </Link>
            )}

            <Link
              href={`/app/mentora?prompt=${encodeURIComponent(
                `I just completed the ${assessment.title} self-assessment and scored ${result.score}/${result.max} (${plan.tierLabel}). The observation noted: "${result.interpretation}". My recommended strategy is ${plan.recommendedStrategy.name}. Can you reflect with me on what this score means for my daily routine, and what small adjustments or experiments would help me most right now?`
              )}&autoSend=true&title=${encodeURIComponent(`${assessment.title} Reflection`)}`}
              className="inline-flex items-center gap-1.5 bg-teal/10 hover:bg-teal/20 border border-teal/30 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-deep transition shadow-soft"
            >
              <span>🌿</span>
              <span>Reflect on this score with Mentora AI</span>
            </Link>
          </div>
        </div>

        {/* Limitations Notice */}
        <div className="rounded-xl bg-paper-deep/60 p-3.5 text-xs text-ink-mute space-y-1">
          <div className="font-semibold text-ink-soft">Non-diagnostic educational reflection:</div>
          <div>{assessment.limitations}</div>
          <div className="italic pt-0.5">{assessment.source}</div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => router.push('/app/assess')}
            className="bg-ink text-paper px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-ink-soft shadow-soft transition"
          >
            ← Back to all assessments
          </button>
          <button
            onClick={() => {
              setResult(null);
              setResponses({});
              setCurrentIdx(0);
              setCompletedSteps({});
            }}
            className="bg-coral text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-coral-deep shadow-soft transition"
          >
            🔄 Retake Assessment
          </button>
          <button
            onClick={() => router.push('/app/map')}
            className="border border-line bg-card px-5 py-2.5 rounded-xl text-sm font-medium text-ink-soft hover:bg-paper-deep transition shadow-soft"
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
