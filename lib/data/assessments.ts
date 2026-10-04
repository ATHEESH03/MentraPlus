// lib/data/assessments.ts
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
import { AssessmentResult } from '@/lib/types';
import { getLocal, setLocal } from './localStore';

const ar = (uid: string) => collection(db, 'users', uid, 'assessmentResults');
const drafts = (uid: string) => collection(db, 'users', uid, 'drafts');

export const saveAssessmentResult = async (
  uid: string,
  res: Omit<AssessmentResult, 'id' | 'completedAt'>
): Promise<AssessmentResult> => {
  if (!firebaseConfigured) {
    const list = getLocal<AssessmentResult[]>('assessments', []);
    const newRes: AssessmentResult = {
      ...res,
      id: `ar-${Date.now()}`,
      completedAt: Date.now(),
    };
    list.unshift(newRes);
    setLocal('assessments', list);
    return newRes;
  }
  const ref = doc(ar(uid));
  const data: AssessmentResult = {
    ...res,
    id: ref.id,
    completedAt: Date.now(),
  };
  await setDoc(ref, data);
  // clean up draft if exists
  await deleteDoc(doc(drafts(uid), `assessment_${res.assessmentId}`));
  return data;
};

export const getAssessmentResult = async (
  uid: string,
  id: string
): Promise<AssessmentResult | undefined> => {
  if (!firebaseConfigured) {
    const list = getLocal<AssessmentResult[]>('assessments', []);
    return list.find((item) => item.id === id);
  }
  const snap = await getDoc(doc(ar(uid), id));
  return snap.exists() ? (snap.data() as AssessmentResult) : undefined;
};

export const listAssessments = async (uid: string): Promise<AssessmentResult[]> => {
  if (!firebaseConfigured) {
    const list = getLocal<AssessmentResult[]>('assessments', []);
    return [...list].sort((a, b) => b.completedAt - a.completedAt);
  }
  const snap = await getDocs(query(ar(uid), orderBy('completedAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as AssessmentResult), id: d.id }));
};

export const saveDraft = async (
  uid: string,
  assessmentId: string,
  responses: Record<string, string>
) => {
  if (!firebaseConfigured) {
    setLocal(`draft_${assessmentId}`, responses);
    return;
  }
  await setDoc(doc(drafts(uid), `assessment_${assessmentId}`), {
    assessmentId,
    responses,
    updatedAt: Date.now(),
  });
};

export const getDraft = async (
  uid: string,
  assessmentId: string
): Promise<Record<string, string> | null> => {
  if (!firebaseConfigured) {
    return getLocal<Record<string, string> | null>(`draft_${assessmentId}`, null);
  }
  const snap = await getDoc(doc(drafts(uid), `assessment_${assessmentId}`));
  return snap.exists() ? (snap.data().responses as Record<string, string>) : null;
};
