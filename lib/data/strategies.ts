// lib/data/strategies.ts
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
} from 'firebase/firestore';
import { Strategy } from '@/lib/types';
import { getLocal, setLocal } from './localStore';

const s = (uid: string) => collection(db, 'users', uid, 'strategies');

export const saveStrategy = async (uid: string, strat: Omit<Strategy, 'id' | 'createdAt'>) => {
  if (!firebaseConfigured) {
    const list = getLocal<Strategy[]>('strategies', []);
    const newStrat: Strategy = {
      ...strat,
      id: `str-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    list.unshift(newStrat);
    setLocal('strategies', list);
    return newStrat;
  }
  const ref = doc(s(uid));
  const data: Strategy = {
    ...strat,
    id: ref.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(ref, data);
  return data;
};

export const getStrategy = async (uid: string, id: string): Promise<Strategy | undefined> => {
  if (!firebaseConfigured) {
    const list = getLocal<Strategy[]>('strategies', []);
    return list.find((item) => item.id === id);
  }
  const snap = await getDoc(doc(s(uid), id));
  return snap.exists() ? (snap.data() as Strategy) : undefined;
};

export const updateStrategy = async (uid: string, id: string, patch: Partial<Strategy>) => {
  if (!firebaseConfigured) {
    const list = getLocal<Strategy[]>('strategies', []);
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
      setLocal('strategies', list);
      return list[idx];
    }
    return undefined;
  }
  await setDoc(doc(s(uid), id), { ...patch, updatedAt: Date.now() }, { merge: true });
  return getStrategy(uid, id);
};

export const toggleFavorite = async (uid: string, id: string, favorite: boolean) => {
  if (!firebaseConfigured) {
    return updateStrategy(uid, id, { favorite });
  }
  await setDoc(doc(s(uid), id), { favorite, updatedAt: Date.now() }, { merge: true });
  return getStrategy(uid, id);
};

export const deleteStrategy = async (uid: string, id: string) => {
  if (!firebaseConfigured) {
    const list = getLocal<Strategy[]>('strategies', []);
    setLocal(
      'strategies',
      list.filter((item) => item.id !== id)
    );
    return;
  }
  return deleteDoc(doc(s(uid), id));
};

export async function listStrategies(uid: string): Promise<Strategy[]> {
  if (!firebaseConfigured) {
    const list = getLocal<Strategy[]>('strategies', []);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }
  const snap = await getDocs(query(s(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Strategy), id: d.id }));
}
