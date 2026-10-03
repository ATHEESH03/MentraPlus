'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { setPrefs } from '@/lib/data/userRepo';

const GOALS = [
  'Understanding personal patterns',
  'Exploring academic pressure',
  'Improving daily routines',
  'Discovering coping strategies',
  'Developing self-awareness',
  'Reflecting on social connection',
];

const AREAS = ['Sleep', 'Study', 'Social life', 'Mood', 'Energy', 'Self-care'];

const STYLES = [
  ['balanced', 'Balanced (a gentle mix of prompts and open reflection)'],
  ['guided', 'Guided (more structured check-ins and prompts)'],
  ['free', 'Free-form (open space, minimal structure)'],
] as const;

export default function Onboarding() {
  const { profile, user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [style, setStyle] = useState<'guided' | 'free' | 'balanced'>('balanced');
  const [saving, setSaving] = useState(false);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const finish = async (skip: boolean) => {
    if (user && profile && !skip) {
      setSaving(true);
      try {
        await setPrefs(user.uid, {
          ...profile.preferences,
          goals,
          areas,
          reflectionStyle: style,
        });
      } catch (e) {
        console.error('Save prefs error:', e);
      }
    }
    router.replace('/app/home');
  };

  return (
    <div className="min-h-screen bg-paper grid place-items-center p-4">
      <div className="w-full max-w-lg bg-card rounded-xl3 border border-line shadow-soft p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center text-xs">
          <span className="uppercase tracking-widest text-teal font-semibold">
            Step {step + 1} of 3
          </span>
          <button
            onClick={() => finish(true)}
            className="text-ink-mute hover:text-ink transition"
          >
            Skip setup
          </button>
        </div>

        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink">
            {step === 0
              ? 'What would you like to understand?'
              : step === 1
              ? 'Which areas of life do you want to notice?'
              : 'How do you like to reflect?'}
          </h1>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            {step === 0
              ? 'Pick the goals that resonate right now. These help tailor your starting suggestions.'
              : step === 1
              ? 'Optional areas you can focus on. You can adjust these anytime in your Profile.'
              : 'Choose the level of guidance that feels most supportive for your flow.'}
          </p>
        </div>

        <div className="space-y-2.5">
          {step === 0 &&
            GOALS.map((g) => {
              const active = goals.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggle(goals, g, setGoals)}
                  className={`w-full text-left rounded-xl p-3.5 border transition text-sm flex items-center justify-between ${
                    active
                      ? 'bg-teal text-white border-teal shadow-soft font-medium'
                      : 'bg-paper-soft border-line text-ink-soft hover:bg-paper-deep'
                  }`}
                >
                  <span>{g}</span>
                  {active && <span>✓</span>}
                </button>
              );
            })}

          {step === 1 &&
            AREAS.map((a) => {
              const active = areas.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggle(areas, a, setAreas)}
                  className={`w-full text-left rounded-xl p-3.5 border transition text-sm flex items-center justify-between ${
                    active
                      ? 'bg-teal text-white border-teal shadow-soft font-medium'
                      : 'bg-paper-soft border-line text-ink-soft hover:bg-paper-deep'
                  }`}
                >
                  <span>{a}</span>
                  {active && <span>✓</span>}
                </button>
              );
            })}

          {step === 2 &&
            STYLES.map(([val, label]) => {
              const active = style === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStyle(val)}
                  className={`w-full text-left rounded-xl p-3.5 border transition text-sm flex items-center justify-between ${
                    active
                      ? 'bg-teal text-white border-teal shadow-soft font-medium'
                      : 'bg-paper-soft border-line text-ink-soft hover:bg-paper-deep'
                  }`}
                >
                  <span>{label}</span>
                  {active && <span>✓</span>}
                </button>
              );
            })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-line">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-ink-mute hover:text-ink font-medium"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => (step < 2 ? setStep((s) => s + 1) : finish(false))}
            className="bg-ink text-paper px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-ink-soft transition shadow-soft disabled:opacity-50"
          >
            {saving ? 'Saving...' : step < 2 ? 'Continue' : 'Start Exploring'}
          </button>
        </div>
      </div>
    </div>
  );
}
