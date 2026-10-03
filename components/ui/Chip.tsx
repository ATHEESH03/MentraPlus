'use client';
import React from 'react';

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'pill' | 'box';
}

export function Chip({
  active = false,
  onClick,
  children,
  className = '',
  variant = 'pill',
}: ChipProps) {
  const shape = variant === 'pill' ? 'rounded-full px-4 py-2 text-sm' : 'rounded-xl px-4 py-3 text-sm text-left';
  const color = active
    ? 'bg-teal text-paper border-teal shadow-soft'
    : 'bg-card border-line text-ink-soft hover:bg-paper-deep';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border transition duration-150 inline-flex items-center gap-1.5 font-medium ${shape} ${color} ${className}`}
    >
      {children}
    </button>
  );
}
