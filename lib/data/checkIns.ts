// lib/data/checkIns.ts
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
  limit as firestoreLimit,
} from 'firebase/firestore';
import { CheckIn } from '@/lib/types';

const c = (uid: string) => collection(db, 'users', uid, 'checkIns');

export const saveCheckIn = async (uid: string, ci: Omit<CheckIn, 'id'>) => {
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
  const snap = await getDoc(doc(c(uid), id));
  return snap.exists() ? (snap.data() as CheckIn) : undefined;
};

export const updateCheckIn = async (uid: string, id: string, patch: Partial<CheckIn>) => {
  await setDoc(doc(c(uid), id), { ...patch, updatedAt: Date.now() }, { merge: true });
  return getCheckIn(uid, id);
};

export const deleteCheckIn = (uid: string, id: string) => deleteDoc(doc(c(uid), id));

export async function listCheckIns(uid: string, opts: { limit?: number } = {}) {
  let q = query(c(uid), orderBy('createdAt', 'desc'));
  if (opts.limit) {
    q = query(q, firestoreLimit(opts.limit));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as CheckIn), id: d.id }));
}

export async function allCheckIns(uid: string): Promise<CheckIn[]> {
  const snap = await getDocs(query(c(uid), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => ({ ...(d.data() as CheckIn), id: d.id }));
}
