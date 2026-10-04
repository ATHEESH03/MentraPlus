'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase';
import { ensureProfile } from '@/lib/data/userRepo';
import { handleFromName } from '@/lib/utils';
import { AuthShell, Field, inputCls, friendly, NoFirebase } from '@/components/ui/auth';

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErr('Please enter your password.');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/app/home');
    } catch (e: any) {
      console.error('Sign-in error:', e);
      setErr(friendly(e.code));
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const dName = cred.user.displayName || cred.user.email?.split('@')[0] || 'Friend';
      await ensureProfile(cred.user.uid, dName, handleFromName(dName));
      router.replace('/app/home');
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setErr(friendly(e.code));
      }
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
        {/* Google Sign-in */}
        <button
          type="button"
          onClick={googleSignIn}
          disabled={busy}
          className="w-full border border-line bg-paper hover:bg-paper-deep text-ink rounded-xl py-3 text-sm font-medium transition flex items-center justify-center gap-2.5 shadow-soft disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-card px-2 text-ink-mute">Or sign in with email</span>
          </div>
        </div>

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
          disabled={busy}
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
