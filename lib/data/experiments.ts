// lib/data/experiments.ts (+ attempts subcollection)
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
import { Experiment, Attempt } from '@/lib/types';

const e = (uid: string) => collection(db, 'users', uid, 'experiments');

export const saveExperiment = async (uid: string, x: Omit<Experiment, 'id' | 'createdAt'> & { createdAt?: number }) => {
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
  const snap = await getDoc(doc(e(uid), id));
  return snap.exists() ? (snap.data() as Experiment) : undefined;
};

export const updateExperiment = async (uid: string, id: string, p: Partial<Experiment>) => {
  await setDoc(doc(e(uid), id), { ...p, updatedAt: Date.now() }, { merge: true });
  return getExperiment(uid, id);
};

export const deleteExperiment = async (uid: string, id: string) => {
  const attemptsRef = collection(doc(e(uid), id), 'attempts');
  const snap = await getDocs(query(attemptsRef));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(e(uid), id));
};

export const listExperiments = async (uid: string): Promise<Experiment[]> => {
  const s = await getDocs(query(e(uid), orderBy('createdAt', 'desc')));
  return s.docs.map((d) => ({ ...(d.data() as Experiment), id: d.id }));
};

export const saveAttempt = async (uid: string, eid: string, a: Omit<Attempt, 'id'>) => {
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
  const s = await getDocs(query(collection(doc(e(uid), eid), 'attempts'), orderBy('createdAt', 'asc')));
  return s.docs.map((d) => ({ ...(d.data() as Attempt), id: d.id }));
};
