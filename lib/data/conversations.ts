// lib/data/conversations.ts
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
import { Conversation, ChatMessage } from '@/lib/types';

const convs = (uid: string) => collection(db, 'users', uid, 'conversations');
const msgs = (uid: string, cid: string) =>
  collection(db, 'users', uid, 'conversations', cid, 'messages');

export const createConversation = async (uid: string, title: string): Promise<Conversation> => {
  const ref = doc(convs(uid));
  const data: Conversation = {
    id: ref.id,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(ref, data);
  return data;
};

export const getConversation = async (uid: string, cid: string): Promise<Conversation | undefined> => {
  const snap = await getDoc(doc(convs(uid), cid));
  return snap.exists() ? (snap.data() as Conversation) : undefined;
};

export const renameConversation = async (uid: string, cid: string, title: string) => {
  await setDoc(doc(convs(uid), cid), { title, updatedAt: Date.now() }, { merge: true });
};

export const deleteConversation = async (uid: string, cid: string) => {
  const messagesSnap = await getDocs(query(msgs(uid, cid)));
  await Promise.all(messagesSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(convs(uid), cid));
};

export const listConversations = async (uid: string): Promise<Conversation[]> => {
  const snap = await getDocs(query(convs(uid), orderBy('updatedAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Conversation), id: d.id }));
};

export const saveMessage = async (
  uid: string,
  cid: string,
  msg: Omit<ChatMessage, 'id'>
): Promise<ChatMessage> => {
  const ref = doc(msgs(uid, cid));
  const data: ChatMessage = {
    ...msg,
    id: ref.id,
  };
  await setDoc(ref, data);
  await setDoc(doc(convs(uid), cid), { updatedAt: Date.now() }, { merge: true });
  return data;
};

export const listMessages = async (
  uid: string,
  cid: string,
  limitCount?: number
): Promise<ChatMessage[]> => {
  let q = query(msgs(uid, cid), orderBy('createdAt', 'asc'));
  if (limitCount) {
    q = query(q, firestoreLimit(limitCount));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as ChatMessage), id: d.id }));
};
