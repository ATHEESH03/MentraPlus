'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { byId } from '@/lib/assessments/definitions';
import { AssessmentRunner } from '@/components/assessments/AssessmentRunner';

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const assessment = byId(id || '');

  if (!assessment) {
    return (
      <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center space-y-4">
        <h2 className="font-display text-2xl text-ink">Assessment Not Found</h2>
        <Link
          href="/app/assess"
          className="text-sm text-teal font-medium hover:underline"
        >
          ← Back to all assessments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/app/assess"
        className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink font-medium"
      >
        ← Back to Assessments
      </Link>
      <AssessmentRunner assessment={assessment} />
    </div>
  );
}
