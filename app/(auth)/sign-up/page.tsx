'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase';
import { ensureProfile } from '@/lib/data/userRepo';
import { handleFromName } from '@/lib/utils';
import { AuthShell, Field, inputCls, friendly, NoFirebase } from '@/components/ui/auth';

export default function SignUp() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const valid =
    name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;

    setBusy(true);
    setErr('');

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await ensureProfile(cred.user.uid, name.trim(), handleFromName(name.trim()));
      router.replace('/onboarding');
    } catch (e: any) {
      setErr(friendly(e.code));
    } finally {
      setBusy(false);
    }
  };

  if (!firebaseConfigured) return <NoFirebase />;

  return (
    <AuthShell
      title="Create your space"
      sub="Private to you. No community or sharing required."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Your name" hint="Private display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            autoComplete="name"
            placeholder="e.g. Alex"
            required
          />
        </Field>

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

        <Field label="Password" hint="8+ characters">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            autoComplete="new-password"
            required
          />
        </Field>

        {err && <p className="text-coral-deep text-sm">{err}</p>}

        <button
          type="submit"
          disabled={!valid || busy}
          className="w-full bg-coral text-white rounded-xl py-3 font-medium hover:bg-coral-deep transition shadow-soft disabled:opacity-50"
        >
          {busy ? 'Creating your account...' : 'Start Exploring'}
        </button>

        <p className="text-[11px] text-ink-mute text-center leading-relaxed">
          By signing up, your data is stored securely and privately in your own owner-only database partition.
        </p>

        <div className="text-center text-xs text-ink-mute pt-2 border-t border-line">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-teal-deep font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
