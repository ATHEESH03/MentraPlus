'use client';
import React from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-xl2 border border-line shadow-lift p-6 animate-breathe-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-xl text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-ink-mute hover:text-ink text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
