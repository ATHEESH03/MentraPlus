'use client';
import React, { useState } from 'react';
import { UserProfile } from '@/lib/types';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import MoreSheet from './MoreSheet';

export default function AppShell({
  profile,
  children,
}: {
  profile: UserProfile;
  children: React.ReactNode;
}) {
  const [more, setMore] = useState(false);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout error:', e);
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased">
      <TopNav profile={profile} onMore={() => setMore(true)} onLogout={logout} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 lg:pt-24 pb-28 lg:pb-12">
        {children}
      </main>
      <BottomNav onMore={() => setMore(true)} />
      <MoreSheet open={more} onClose={() => setMore(false)} />
    </div>
  );
}
