// lib/data/insightsRepo.ts
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
import { Insight, InsightStatus } from '@/lib/types';
import { getLocal, setLocal } from './localStore';

const ins = (uid: string) => collection(db, 'users', uid, 'insights');

export const saveInsight = async (uid: string, item: Omit<Insight, 'id' | 'createdAt'>) => {
  if (!firebaseConfigured) {
    const list = getLocal<Insight[]>('insights', []);
    const data: Insight = {
      ...item,
      id: item.key,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const idx = list.findIndex((i) => i.key === item.key);
    if (idx !== -1) list[idx] = data;
    else list.push(data);
    setLocal('insights', list);
    return data;
  }
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
  if (!firebaseConfigured) {
    const list = getLocal<Insight[]>('insights', []);
    return list.find((i) => i.id === id || i.key === id);
  }
  const snap = await getDoc(doc(ins(uid), id));
  return snap.exists() ? (snap.data() as Insight) : undefined;
};

export const setInsightStatus = async (uid: string, id: string, status: InsightStatus, userNote?: string) => {
  if (!firebaseConfigured) {
    const list = getLocal<Insight[]>('insights', []);
    const idx = list.findIndex((i) => i.id === id || i.key === id);
    if (idx !== -1) {
      list[idx].status = status;
      if (userNote !== undefined) list[idx].userNote = userNote;
      list[idx].updatedAt = Date.now();
      setLocal('insights', list);
      return list[idx];
    } else {
      const newIns: Insight = {
        id,
        key: id,
        title: id,
        body: '',
        evidence: [],
        supporting: 0,
        total: 0,
        status,
        userNote,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      list.push(newIns);
      setLocal('insights', list);
      return newIns;
    }
  }
  const patch: Partial<Insight> = { status, updatedAt: Date.now() };
  if (userNote !== undefined) patch.userNote = userNote;
  await setDoc(doc(ins(uid), id), patch, { merge: true });
  return getInsight(uid, id);
};

export const listInsights = async (uid: string): Promise<Insight[]> => {
  if (!firebaseConfigured) {
    return getLocal<Insight[]>('insights', []);
  }
  const snap = await getDocs(query(ins(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Insight), id: d.id }));
};

export const deleteInsight = async (uid: string, id: string) => {
  if (!firebaseConfigured) {
    const list = getLocal<Insight[]>('insights', []);
    setLocal(
      'insights',
      list.filter((i) => i.id !== id && i.key !== id)
    );
    return;
  }
  return deleteDoc(doc(ins(uid), id));
};
