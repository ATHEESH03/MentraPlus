// lib/data/userRepo.ts
import { db, firebaseConfigured } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { getLocal, setLocal, DEMO_PROFILE } from './localStore';

export async function getProfile(uid: string): Promise<UserProfile | null> {
  if (!firebaseConfigured) {
    return getLocal<UserProfile>('profile', DEMO_PROFILE);
  }
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function ensureProfile(uid: string, displayName: string, handle: string): Promise<UserProfile> {
  if (!firebaseConfigured) {
    const existing = getLocal<UserProfile>('profile', DEMO_PROFILE);
    return existing;
  }
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserProfile;
  const profile: UserProfile = {
    uid,
    displayName,
    handle,
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
  await setDoc(ref, profile);
  return profile;
}

export async function updateProfile(uid: string, patch: Partial<UserProfile>) {
  if (!firebaseConfigured) {
    const current = getLocal<UserProfile>('profile', DEMO_PROFILE);
    const updated = { ...current, ...patch };
    setLocal('profile', updated);
    return;
  }
  await updateDoc(doc(db, 'users', uid), patch as any);
}

export async function setPrefs(uid: string, prefs: UserProfile['preferences']) {
  if (!firebaseConfigured) {
    const current = getLocal<UserProfile>('profile', DEMO_PROFILE);
    const updated = { ...current, preferences: prefs };
    setLocal('profile', updated);
    return;
  }
  await updateDoc(doc(db, 'users', uid), { preferences: prefs });
}
