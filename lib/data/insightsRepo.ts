// lib/data/insightsRepo.ts
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
import { Insight, InsightStatus } from '@/lib/types';

const ins = (uid: string) => collection(db, 'users', uid, 'insights');

export const saveInsight = async (uid: string, item: Omit<Insight, 'id' | 'createdAt'>) => {
  const ref = doc(ins(uid), item.key);
  const data: Insight = {
    ...item,
    id: item.key,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(ref, data, { merge: true });
  return data;
};

export const getInsight = async (uid: string, id: string): Promise<Insight | undefined> => {
  const snap = await getDoc(doc(ins(uid), id));
  return snap.exists() ? (snap.data() as Insight) : undefined;
};

export const setInsightStatus = async (uid: string, id: string, status: InsightStatus, userNote?: string) => {
  const patch: Partial<Insight> = { status, updatedAt: Date.now() };
  if (userNote !== undefined) patch.userNote = userNote;
  await setDoc(doc(ins(uid), id), patch, { merge: true });
  return getInsight(uid, id);
};

export const listInsights = async (uid: string): Promise<Insight[]> => {
  const snap = await getDocs(query(ins(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Insight), id: d.id }));
};

export const deleteInsight = (uid: string, id: string) => deleteDoc(doc(ins(uid), id));
