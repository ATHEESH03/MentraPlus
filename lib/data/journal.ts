// lib/data/journal.ts
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
import { JournalEntry } from '@/lib/types';
import { getLocal, setLocal } from './localStore';

const j = (uid: string) => collection(db, 'users', uid, 'journalEntries');

export const saveJournal = async (uid: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
  if (!firebaseConfigured) {
    const list = getLocal<JournalEntry[]>('journal', []);
    const newEntry: JournalEntry = {
      ...entry,
      id: `j-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    list.unshift(newEntry);
    setLocal('journal', list);
    return newEntry;
  }
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
  if (!firebaseConfigured) {
    const list = getLocal<JournalEntry[]>('journal', []);
    return list.find((item) => item.id === id);
  }
  const snap = await getDoc(doc(j(uid), id));
  return snap.exists() ? (snap.data() as JournalEntry) : undefined;
};

export const updateJournal = async (uid: string, id: string, patch: Partial<JournalEntry>) => {
  if (!firebaseConfigured) {
    const list = getLocal<JournalEntry[]>('journal', []);
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
      setLocal('journal', list);
      return list[idx];
    }
    return undefined;
  }
  await setDoc(doc(j(uid), id), { ...patch, updatedAt: Date.now() }, { merge: true });
  return getJournal(uid, id);
};

export const deleteJournal = async (uid: string, id: string) => {
  if (!firebaseConfigured) {
    const list = getLocal<JournalEntry[]>('journal', []);
    setLocal(
      'journal',
      list.filter((item) => item.id !== id)
    );
    return;
  }
  return deleteDoc(doc(j(uid), id));
};

export async function listJournal(uid: string): Promise<JournalEntry[]> {
  if (!firebaseConfigured) {
    const list = getLocal<JournalEntry[]>('journal', []);
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }
  const snap = await getDocs(query(j(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as JournalEntry), id: d.id }));
}
