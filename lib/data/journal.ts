// lib/data/journal.ts
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
import { JournalEntry } from '@/lib/types';

const j = (uid: string) => collection(db, 'users', uid, 'journalEntries');

export const saveJournal = async (uid: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
  const ref = doc(j(uid));
  const data: JournalEntry = {
    ...entry,
    id: ref.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(ref, data);
  return data;
};

export const getJournal = async (uid: string, id: string): Promise<JournalEntry | undefined> => {
  const snap = await getDoc(doc(j(uid), id));
  return snap.exists() ? (snap.data() as JournalEntry) : undefined;
};

export const updateJournal = async (uid: string, id: string, patch: Partial<JournalEntry>) => {
  await setDoc(doc(j(uid), id), { ...patch, updatedAt: Date.now() }, { merge: true });
  return getJournal(uid, id);
};

export const deleteJournal = (uid: string, id: string) => deleteDoc(doc(j(uid), id));

export async function listJournal(uid: string): Promise<JournalEntry[]> {
  const snap = await getDocs(query(j(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as JournalEntry), id: d.id }));
}
