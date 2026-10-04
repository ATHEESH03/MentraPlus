// lib/auth.tsx — 'use client'
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, firebaseConfigured } from './firebase';
import { getProfile, ensureProfile } from './data/userRepo';
import { UserProfile } from './types';
import { handleFromName } from './utils';
import { initLocalStore, DEMO_PROFILE, DEMO_UID } from './data/localStore';

interface Ctx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  isDemo: boolean;
  ensureProfileFor: (u: User) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  enterDemoMode: () => void;
}

const mockDemoUser = {
  uid: DEMO_UID,
  displayName: DEMO_PROFILE.displayName,
  email: 'alex@mentraplus.local',
  getIdToken: async () => 'demo-token',
} as unknown as User;

const AuthCtx = createContext<Ctx>({
  user: null,
  profile: null,
  loading: true,
  configured: false,
  isDemo: false,
  ensureProfileFor: async () => {
    throw new Error('AuthProvider not ready');
  },
  refreshProfile: async () => {},
  enterDemoMode: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(!firebaseConfigured);

  const enterDemoMode = () => {
    initLocalStore();
    setUser(mockDemoUser);
    setProfile(DEMO_PROFILE);
    setIsDemo(true);
    setLoading(false);
  };

  const ensureProfileFor = async (u: User) => {
    const name = u.displayName || u.email?.split('@')[0] || 'Friend';
    try {
      const existing = await getProfile(u.uid);
      if (existing) {
        setProfile(existing);
        return existing;
      }
      const created = await ensureProfile(u.uid, name, handleFromName(name));
      setProfile(created);
      return created;
    } catch (err) {
      console.warn('ensureProfileFor fallback:', err);
      const fallback: UserProfile = {
        uid: u.uid,
        displayName: name,
        handle: handleFromName(name),
        createdAt: Date.now(),
        preferences: {
          goals: [],
          areas: [],
          reflectionStyle: 'balanced',
          aiContextSharing: {
            enabled: false,
            includeCheckIns: false,
            includeJournal: false,
            includeExperiments: false,
            includeAssessments: false,
            includeInsights: false,
          },
        },
      };
      setProfile(fallback);
      return fallback;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        const p = await getProfile(user.uid);
        if (p) setProfile(p);
      } catch (e) {
        console.warn('refreshProfile error:', e);
      }
    }
  };

  useEffect(() => {
    if (!firebaseConfigured) {
      enterDemoMode();
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsDemo(false);
      if (u) {
        await ensureProfileFor(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        profile,
        loading,
        configured: firebaseConfigured,
        isDemo,
        ensureProfileFor,
        refreshProfile,
        enterDemoMode,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
