'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, configured, ensureProfileFor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!configured) return;
    if (!loading && !user) {
      router.replace('/sign-in');
    }
  }, [loading, user, configured, router]);

  useEffect(() => {
    if (user && !profile) {
      ensureProfileFor(user);
    }
  }, [user, profile, ensureProfileFor]);

  if (!configured) {
    return (
      <div className="min-h-screen bg-paper grid place-items-center p-4">
        <div className="max-w-md w-full rounded-xl2 bg-card border border-line p-6 text-center shadow-soft">
          <h2 className="font-display text-xl text-ink">Firebase Not Configured</h2>
          <p className="text-sm text-ink-soft mt-2 leading-relaxed">
            Please add your Firebase web app keys to <code className="bg-paper-deep px-1 rounded text-xs">.env.local</code> to access the application.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-sm text-teal font-medium hover:underline"
          >
            Back to landing page
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="md" />
          <p className="text-xs text-ink-mute font-medium">Preparing your space...</p>
        </div>
      </div>
    );
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
