'use client';
import React, { useEffect, useState } from 'react';

export function BreathingCircle() {
  const [phase, setPhase] = useState<'idle' | 'in' | 'out'>('idle');
  const [counter, setCounter] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (phase === 'idle') return;

    const interval = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          setPhase((p) => {
            if (p === 'in') return 'out';
            setCycleCount((c) => c + 1);
            return 'in';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const handleToggle = () => {
    if (phase === 'idle') {
      setPhase('in');
      setCounter(4);
      setCycleCount(0);
    } else {
      setPhase('idle');
      setCounter(4);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl2 bg-teal-deep text-paper shadow-lift">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer pulse circle */}
        <div
          className={`absolute rounded-full bg-paper/10 transition-all duration-1000 ease-in-out ${
            phase === 'in'
              ? 'w-60 h-60'
              : phase === 'out'
              ? 'w-40 h-40'
              : 'w-48 h-48 opacity-40'
          }`}
        />

        {/* Central interactive circle */}
        <div
          className={`rounded-full bg-paper/20 backdrop-blur border border-paper/30 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out shadow-lift ${
            phase === 'in'
              ? 'w-48 h-48 scale-110'
              : phase === 'out'
              ? 'w-36 h-36 scale-90'
              : 'w-40 h-40'
          }`}
        >
          <span className="font-display text-2xl tracking-wide text-white">
            {phase === 'in' ? 'Breathe in' : phase === 'out' ? 'Breathe out' : 'Ready'}
          </span>
          {phase !== 'idle' && (
            <span className="text-3xl font-display mt-1 text-sage-soft font-light">
              {counter}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <button
          onClick={handleToggle}
          className="bg-paper text-teal-deep px-8 py-3 rounded-xl font-medium shadow-soft hover:bg-white transition"
        >
          {phase === 'idle' ? 'Begin Breathing' : 'Pause'}
        </button>
        {cycleCount > 0 && (
          <span className="text-xs text-paper/70">
            Completed {cycleCount} breath cycle{cycleCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}
