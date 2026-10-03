'use client';
import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center shadow-soft">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      <p className="text-sm text-ink-mute max-w-md mx-auto mt-2">{description}</p>
      {actionText && (
        <div className="mt-5">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center font-medium transition rounded-xl text-sm px-5 py-2.5 bg-teal text-white hover:bg-teal-deep shadow-soft"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center font-medium transition rounded-xl text-sm px-5 py-2.5 bg-teal text-white hover:bg-teal-deep shadow-soft"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
