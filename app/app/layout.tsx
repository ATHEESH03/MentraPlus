'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/Spinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, configured, isDemo, ensureProfileFor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (configured && !loading && !user) {
      router.replace('/sign-in');
    }
  }, [loading, user, configured, router]);

  useEffect(() => {
    if (user && !profile) {
      ensureProfileFor(user);
    }
  }, [user, profile, ensureProfileFor]);

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

  return (
    <>
      {isDemo && (
        <div className="bg-teal-deep text-paper text-xs py-1.5 px-4 text-center font-medium fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 shadow-sm">
          <span>🌿 Running in Local Demo Mode (offline storage).</span>
          <span className="text-paper/70 hidden sm:inline">Add Firebase keys to .env.local for cloud persistence.</span>
        </div>
      )}
      <div className={isDemo ? 'pt-7' : ''}>
        <AppShell profile={profile}>{children}</AppShell>
      </div>
    </>
  );
}
