'use client';
import React from 'react';
import CheckInForm from '@/components/checkin/CheckInForm';

export default function CheckInPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink">Check in</h1>
        <p className="text-ink-soft text-sm mt-1">
          Take a moment to record your current state. Each check-in adds real data points to your Response Map.
        </p>
      </div>

      <CheckInForm />
    </div>
  );
}
