// lib/data/checkIns.ts
import { db, firebaseConfigured } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { CheckIn } from '@/lib/types';
import { getLocal, setLocal } from './localStore';

const c = (uid: string) => collection(db, 'users', uid, 'checkIns');

export const saveCheckIn = async (uid: string, ci: Omit<CheckIn, 'id'>) => {
  if (!firebaseConfigured) {
    const list = getLocal<CheckIn[]>('checkIns', []);
    const newCi: CheckIn = {
      ...ci,
      id: `ci-${Date.now()}`,
      createdAt: ci.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    list.unshift(newCi);
    setLocal('checkIns', list);
    return newCi;
  }
  const ref = doc(c(uid));
  const data: CheckIn = {
    ...ci,
    id: ref.id,
    createdAt: ci.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(ref, data);
  return data;
};

export const getCheckIn = async (uid: string, id: string): Promise<CheckIn | undefined> => {
  if (!firebaseConfigured) {
    const list = getLocal<CheckIn[]>('checkIns', []);
    return list.find((item) => item.id === id);
  }
  const snap = await getDoc(doc(c(uid), id));
  return snap.exists() ? (snap.data() as CheckIn) : undefined;
};

export const updateCheckIn = async (uid: string, id: string, patch: Partial<CheckIn>) => {
  if (!firebaseConfigured) {
    const list = getLocal<CheckIn[]>('checkIns', []);
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
      setLocal('checkIns', list);
      return list[idx];
    }
    return undefined;
  }
  await setDoc(doc(c(uid), id), { ...patch, updatedAt: Date.now() }, { merge: true });
  return getCheckIn(uid, id);
};

export const deleteCheckIn = async (uid: string, id: string) => {
  if (!firebaseConfigured) {
    const list = getLocal<CheckIn[]>('checkIns', []);
    setLocal(
      'checkIns',
      list.filter((item) => item.id !== id)
    );
    return;
  }
  return deleteDoc(doc(c(uid), id));
};

export async function listCheckIns(uid: string, opts: { limit?: number } = {}) {
  if (!firebaseConfigured) {
    const list = getLocal<CheckIn[]>('checkIns', []);
    const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
    return opts.limit ? sorted.slice(0, opts.limit) : sorted;
  }
  let q = query(c(uid), orderBy('createdAt', 'desc'));
  if (opts.limit) {
    q = query(q, firestoreLimit(opts.limit));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as CheckIn), id: d.id }));
}

export async function allCheckIns(uid: string): Promise<CheckIn[]> {
  if (!firebaseConfigured) {
    const list = getLocal<CheckIn[]>('checkIns', []);
    return [...list].sort((a, b) => a.createdAt - b.createdAt);
  }
  const snap = await getDocs(query(c(uid), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => ({ ...(d.data() as CheckIn), id: d.id }));
}
