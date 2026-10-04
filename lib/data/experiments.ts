// lib/data/experiments.ts (+ attempts subcollection)
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
import { Experiment, Attempt } from '@/lib/types';
import { getLocal, setLocal } from './localStore';

const e = (uid: string) => collection(db, 'users', uid, 'experiments');

export const saveExperiment = async (
  uid: string,
  x: Omit<Experiment, 'id' | 'createdAt'> & { createdAt?: number }
) => {
  if (!firebaseConfigured) {
    const list = getLocal<Experiment[]>('experiments', []);
    const newExp: Experiment = {
      ...x,
      id: `exp-${Date.now()}`,
      createdAt: x.createdAt || Date.now(),
    };
    list.unshift(newExp);
    setLocal('experiments', list);
    return newExp;
  }
  const ref = doc(e(uid));
  const data: Experiment = {
    ...x,
    id: ref.id,
    createdAt: x.createdAt || Date.now(),
  };
  await setDoc(ref, data);
  return data;
};

export const getExperiment = async (uid: string, id: string): Promise<Experiment | undefined> => {
  if (!firebaseConfigured) {
    const list = getLocal<Experiment[]>('experiments', []);
    return list.find((item) => item.id === id);
  }
  const snap = await getDoc(doc(e(uid), id));
  return snap.exists() ? (snap.data() as Experiment) : undefined;
};

export const updateExperiment = async (uid: string, id: string, p: Partial<Experiment>) => {
  if (!firebaseConfigured) {
    const list = getLocal<Experiment[]>('experiments', []);
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...p, updatedAt: Date.now() };
      setLocal('experiments', list);
      return list[idx];
    }
    return undefined;
  }
  await setDoc(doc(e(uid), id), { ...p, updatedAt: Date.now() }, { merge: true });
  return getExperiment(uid, id);
};

export const deleteExperiment = async (uid: string, id: string) => {
  if (!firebaseConfigured) {
    const list = getLocal<Experiment[]>('experiments', []);
    setLocal(
      'experiments',
      list.filter((item) => item.id !== id)
    );
    const attempts = getLocal<Attempt[]>('attempts', []);
    setLocal(
      'attempts',
      attempts.filter((a) => !a.id.startsWith(id))
    );
    return;
  }
  const attemptsRef = collection(doc(e(uid), id), 'attempts');
  const snap = await getDocs(query(attemptsRef));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(e(uid), id));
};

export const listExperiments = async (uid: string): Promise<Experiment[]> => {
  if (!firebaseConfigured) {
    const list = getLocal<Experiment[]>('experiments', []);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }
  const s = await getDocs(query(e(uid), orderBy('createdAt', 'desc')));
  return s.docs.map((d) => ({ ...(d.data() as Experiment), id: d.id }));
};

export const saveAttempt = async (uid: string, eid: string, a: Omit<Attempt, 'id'>) => {
  if (!firebaseConfigured) {
    const list = getLocal<Attempt[]>('attempts', []);
    const newAtt: Attempt = {
      ...a,
      id: `${eid}_att-${Date.now()}`,
      createdAt: a.createdAt || Date.now(),
    };
    list.push(newAtt);
    setLocal('attempts', list);
    return newAtt;
  }
  const ref = doc(collection(doc(e(uid), eid), 'attempts'));
  const data: Attempt = {
    ...a,
    id: `${eid}_${ref.id}`,
    createdAt: a.createdAt || Date.now(),
  };
  await setDoc(ref, data);
  return data;
};

export const listAttempts = async (uid: string, eid: string): Promise<Attempt[]> => {
  if (!firebaseConfigured) {
    const list = getLocal<Attempt[]>('attempts', []);
    return list.filter((a) => a.id.startsWith(eid));
  }
  const s = await getDocs(query(collection(doc(e(uid), eid), 'attempts'), orderBy('createdAt', 'asc')));
  return s.docs.map((d) => ({ ...(d.data() as Attempt), id: d.id }));
};
