'use client';
import React, { useState } from 'react';
import { BreathingCircle } from '@/components/studio/BreathingCircle';

type StudioMode = 'breathe' | 'ground' | 'pause';

export default function StudioPage() {
  const [mode, setMode] = useState<StudioMode>('breathe');

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Studio</h1>
        <p className="text-ink-soft text-sm mt-1 leading-relaxed">
          Gentle, non-judgmental exercises for nervous system regulation. Stop at any point if it doesn’t feel right for you today.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex rounded-xl bg-paper-deep p-1 gap-1">
        {(['breathe', 'ground', 'pause'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition ${
              mode === m ? 'bg-card text-ink shadow-soft' : 'text-ink-mute hover:text-ink'
            }`}
          >
            {m === 'breathe' ? 'Breathing' : m === 'ground' ? 'Grounding' : 'Mindful Pause'}
          </button>
        ))}
      </div>

      {/* Active Studio Mode */}
      {mode === 'breathe' && <BreathingCircle />}

      {mode === 'ground' && <GroundingExercise />}

      {mode === 'pause' && (
        <div className="rounded-xl2 bg-card border border-line p-8 shadow-soft space-y-4 text-center">
          <div className="text-4xl">☕</div>
          <h2 className="font-display text-2xl text-ink">A Mindful Pause</h2>
          <p className="text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
            Take 30 seconds to drop your shoulders, unclench your jaw, and let your body simply sit supported by your chair or floor. There is nothing to achieve or fix in this moment.
          </p>
          <div className="pt-2">
            <span className="text-xs text-ink-mute bg-paper-soft px-3 py-1.5 rounded-full border border-line">
              When ready, return to your day at your own pace.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function GroundingExercise() {
  const steps = [
    { title: 'Look around', prompt: 'Notice 3 things you can see near you right now.' },
    { title: 'Listen', prompt: 'Notice 2 distinct sounds in your current environment.' },
    { title: 'Touch', prompt: 'Notice 1 physical sensation (e.g. feet on the floor, texture of your sleeves).' },
    { title: 'Breathe', prompt: 'Take one unhurried, gentle breath and let your shoulders drop.' },
  ];

  const [stepIdx, setStepIdx] = useState(0);

  return (
    <div className="rounded-xl2 bg-card border border-line p-8 shadow-soft space-y-6 text-center">
      <span className="text-xs uppercase tracking-widest font-semibold text-teal-deep">
        Sensory Grounding · Step {stepIdx + 1} of {steps.length}
      </span>
      <h3 className="font-display text-2xl text-ink">{steps[stepIdx].title}</h3>
      <p className="text-base text-ink-soft max-w-sm mx-auto leading-relaxed">
        {steps[stepIdx].prompt}
      </p>

      <div className="flex justify-center gap-3 pt-4">
        {stepIdx > 0 && (
          <button
            onClick={() => setStepIdx((i) => i - 1)}
            className="px-4 py-2 border border-line text-xs font-semibold text-ink-soft rounded-xl hover:bg-paper-deep transition"
          >
            Previous
          </button>
        )}
        {stepIdx < steps.length - 1 ? (
          <button
            onClick={() => setStepIdx((i) => i + 1)}
            className="bg-ink text-paper px-6 py-2 rounded-xl text-xs font-semibold hover:bg-ink-soft transition shadow-soft"
          >
            Next Step
          </button>
        ) : (
          <button
            onClick={() => setStepIdx(0)}
            className="bg-teal text-white px-6 py-2 rounded-xl text-xs font-semibold hover:bg-teal-deep transition shadow-soft"
          >
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}
