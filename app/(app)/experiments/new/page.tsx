'use client';
import React from 'react';
import Link from 'next/link';
import { ExperimentForm } from '@/components/experiments/ExperimentForm';

export default function NewExperimentPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link
          href="/app/experiments"
          className="text-xs text-ink-mute hover:text-ink font-medium"
        >
          ← Back to experiments
        </Link>
        <h1 className="font-display text-3xl sm:text-4xl text-ink mt-2">
          New Personal Experiment
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Formulate a supportive question to test over the coming days.
        </p>
      </div>

      <div className="rounded-xl2 bg-card border border-line p-6 shadow-soft">
        <ExperimentForm />
      </div>
    </div>
  );
}
