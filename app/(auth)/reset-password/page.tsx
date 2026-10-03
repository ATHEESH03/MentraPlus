'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase';
import { AuthShell, Field, inputCls, friendly, NoFirebase } from '@/components/ui/auth';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;

    setBusy(true);
    setErr('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (e: any) {
      setErr(friendly(e.code));
    } finally {
      setBusy(false);
    }
  };

  if (!firebaseConfigured) return <NoFirebase />;

  return (
    <AuthShell
      title="Reset Password"
      sub="We’ll send a link to reset your account password."
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-teal/10 text-teal-deep rounded-xl text-sm leading-relaxed font-medium">
            Reset link sent! Please check your email inbox (and spam folder) for instructions.
          </div>
          <Link
            href="/sign-in"
            className="inline-block text-sm text-ink font-semibold hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Account Email address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              autoComplete="email"
              required
            />
          </Field>

          {err && <p className="text-coral-deep text-sm">{err}</p>}

          <button
            type="submit"
            disabled={!valid || busy}
            className="w-full bg-ink text-paper rounded-xl py-3 font-medium hover:bg-ink-soft transition shadow-soft disabled:opacity-50"
          >
            {busy ? 'Sending link...' : 'Send Reset Link'}
          </button>

          <div className="text-center text-xs text-ink-mute pt-2">
            Remembered your password?{' '}
            <Link href="/sign-in" className="text-teal-deep font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
