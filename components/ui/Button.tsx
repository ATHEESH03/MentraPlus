'use client';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium transition rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-coral text-white hover:bg-coral-deep focus:ring-coral shadow-soft',
    secondary: 'bg-teal text-white hover:bg-teal-deep focus:ring-teal shadow-soft',
    outline: 'border border-line bg-card text-ink hover:bg-paper-deep focus:ring-teal',
    ghost: 'text-ink-soft hover:bg-paper-deep focus:ring-teal',
    danger: 'bg-coral-deep text-white hover:bg-red-700 focus:ring-coral shadow-soft',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
