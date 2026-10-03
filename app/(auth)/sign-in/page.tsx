'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase';
import { AuthShell, Field, inputCls, friendly, NoFirebase } from '@/components/ui/auth';

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;

    setBusy(true);
    setErr('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/app/home');
    } catch (e: any) {
      setErr(friendly(e.code));
    } finally {
      setBusy(false);
    }
  };

  if (!firebaseConfigured) return <NoFirebase />;

  return (
    <AuthShell
      title="Welcome back"
      sub="Sign in to your private personal reflection space."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email address">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            autoComplete="email"
            required
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            autoComplete="current-password"
            required
          />
        </Field>

        {err && <p className="text-coral-deep text-sm">{err}</p>}

        <button
          type="submit"
          disabled={!valid || busy}
          className="w-full bg-ink text-paper rounded-xl py-3 font-medium hover:bg-ink-soft transition shadow-soft disabled:opacity-50"
        >
          {busy ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="flex justify-between items-center text-xs text-ink-mute pt-2">
          <Link href="/reset-password" className="hover:text-ink hover:underline">
            Forgot password?
          </Link>
          <Link href="/sign-up" className="text-teal-deep font-semibold hover:underline">
            Create account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
