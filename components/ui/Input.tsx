'use client';
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <div className="flex justify-between items-baseline">
            <label className="text-xs uppercase tracking-wide text-ink-mute font-medium">
              {label}
            </label>
            {hint && <span className="text-[11px] text-ink-mute">{hint}</span>}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border border-line bg-card p-3 text-sm text-ink placeholder:text-ink-mute focus:border-teal focus:outline-none transition ${
            error ? 'border-coral-deep' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-coral-deep mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
