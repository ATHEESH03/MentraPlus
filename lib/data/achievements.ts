// lib/data/achievements.ts
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { Achievement } from '@/lib/types';

const a = (uid: string) => collection(db, 'users', uid, 'achievements');

export const saveAchievement = async (
  uid: string,
  ach: { key: string; title: string; description: string }
): Promise<Achievement> => {
  const ref = doc(a(uid), ach.key);
  const data: Achievement = {
    id: ach.key,
    ...ach,
    earnedAt: Date.now(),
  };
  await setDoc(ref, data, { merge: true });
  return data;
};

export const listAchievements = async (uid: string): Promise<Achievement[]> => {
  const snap = await getDocs(query(a(uid), orderBy('earnedAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Achievement), id: d.id }));
};
