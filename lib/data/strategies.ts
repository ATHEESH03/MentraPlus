// lib/data/strategies.ts
import { db } from '@/lib/firebase';
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

const s = (uid: string) => collection(db, 'users', uid, 'strategies');

export const saveStrategy = async (uid: string, strat: Omit<Strategy, 'id' | 'createdAt'>) => {
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
  const snap = await getDoc(doc(s(uid), id));
  return snap.exists() ? (snap.data() as Strategy) : undefined;
};

export const updateStrategy = async (uid: string, id: string, patch: Partial<Strategy>) => {
  await setDoc(doc(s(uid), id), { ...patch, updatedAt: Date.now() }, { merge: true });
  return getStrategy(uid, id);
};

export const toggleFavorite = async (uid: string, id: string, favorite: boolean) => {
  await setDoc(doc(s(uid), id), { favorite, updatedAt: Date.now() }, { merge: true });
  return getStrategy(uid, id);
};

export const deleteStrategy = (uid: string, id: string) => deleteDoc(doc(s(uid), id));

export async function listStrategies(uid: string): Promise<Strategy[]> {
  const snap = await getDocs(query(s(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Strategy), id: d.id }));
}
