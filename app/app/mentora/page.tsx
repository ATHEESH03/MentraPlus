'use client';
import React from 'react';
import ChatView from '@/components/mentora/ChatView';

export default function MentoraPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl text-ink">Mentora</h1>
        <p className="text-ink-soft text-xs mt-0.5">
          Your reflective study and wellbeing companion. Mentora reflects on what you choose to share.
        </p>
      </div>

      <ChatView />
    </div>
  );
}
