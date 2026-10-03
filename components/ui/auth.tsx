'use client';
import React from 'react';
import Link from 'next/link';

export const inputCls =
  'w-full rounded-xl border border-line bg-card p-3 text-sm focus:border-teal focus:outline-none transition';

export function AuthShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper grid place-items-center p-4">
      <div className="w-full max-w-md bg-card rounded-xl3 border border-line shadow-soft p-6 sm:p-8">
        <div className="mb-6">
          <Link href="/" className="font-display text-2xl tracking-tight">
            Mentra<span className="text-coral">+</span>
          </Link>
          <h1 className="font-display text-2xl mt-4 text-ink">{title}</h1>
          <p className="text-sm text-ink-soft mt-1">{sub}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs uppercase tracking-wide text-ink-mute font-medium">
          {label}
        </span>
        {hint && <span className="text-[11px] text-ink-mute">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function NoFirebase() {
  return (
    <div className="min-h-screen bg-paper grid place-items-center p-4">
      <div className="w-full max-w-md bg-card rounded-xl3 border border-line shadow-soft p-6 text-center">
        <h2 className="font-display text-xl text-ink">Firebase Not Configured</h2>
        <p className="text-sm text-ink-soft mt-2">
          Please add your Firebase web credentials to <code className="bg-paper-deep px-1.5 py-0.5 rounded text-xs">.env.local</code> and restart the development server.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-sm text-teal font-medium hover:underline"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
}

export function friendly(code?: string): string {
  if (!code) return 'An unexpected error occurred. Please try again.';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return code.replace('auth/', '').replace(/-/g, ' ');
  }
}
