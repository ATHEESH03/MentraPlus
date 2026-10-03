'use client';
import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  span?: number;
  footer?: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
  span,
  footer,
}: CardProps) {
  return (
    <div
      className={`rounded-xl2 bg-card border border-line p-5 shadow-soft ${
        span === 2 ? 'lg:col-span-2' : span === 3 ? 'lg:col-span-3' : ''
      } ${className}`}
    >
      {title && (
        <div className="mb-3">
          <h2 className="font-display text-lg text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-ink-mute mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
      {footer && <div className="mt-4 pt-3 border-t border-line">{footer}</div>}
    </div>
  );
}
