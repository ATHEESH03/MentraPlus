// lib/data/conversations.ts
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
  limit as firestoreLimit,
} from 'firebase/firestore';
import { Conversation, ChatMessage } from '@/lib/types';
import { getLocal, setLocal } from './localStore';

const convs = (uid: string) => collection(db, 'users', uid, 'conversations');
const msgs = (uid: string, cid: string) =>
  collection(db, 'users', uid, 'conversations', cid, 'messages');

export const createConversation = async (uid: string, title: string): Promise<Conversation> => {
  if (!firebaseConfigured) {
    const list = getLocal<Conversation[]>('conversations', []);
    const c: Conversation = {
      id: `conv-${Date.now()}`,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    list.unshift(c);
    setLocal('conversations', list);
    return c;
  }
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
  if (!firebaseConfigured) {
    const list = getLocal<Conversation[]>('conversations', []);
    return list.find((c) => c.id === cid);
  }
  const snap = await getDoc(doc(convs(uid), cid));
  return snap.exists() ? (snap.data() as Conversation) : undefined;
};

export const renameConversation = async (uid: string, cid: string, title: string) => {
  if (!firebaseConfigured) {
    const list = getLocal<Conversation[]>('conversations', []);
    const c = list.find((item) => item.id === cid);
    if (c) {
      c.title = title;
      c.updatedAt = Date.now();
      setLocal('conversations', list);
    }
    return;
  }
  await setDoc(doc(convs(uid), cid), { title, updatedAt: Date.now() }, { merge: true });
};

export const deleteConversation = async (uid: string, cid: string) => {
  if (!firebaseConfigured) {
    const list = getLocal<Conversation[]>('conversations', []);
    setLocal(
      'conversations',
      list.filter((c) => c.id !== cid)
    );
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`mentra_messages_${cid}`);
    }
    return;
  }
  const messagesSnap = await getDocs(query(msgs(uid, cid)));
  await Promise.all(messagesSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(convs(uid), cid));
};

export const listConversations = async (uid: string): Promise<Conversation[]> => {
  if (!firebaseConfigured) {
    const list = getLocal<Conversation[]>('conversations', []);
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  const snap = await getDocs(query(convs(uid), orderBy('updatedAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Conversation), id: d.id }));
};

export const saveMessage = async (
  uid: string,
  cid: string,
  msg: Omit<ChatMessage, 'id'>
): Promise<ChatMessage> => {
  if (!firebaseConfigured) {
    const list = getLocal<ChatMessage[]>(`messages_${cid}`, []);
    const m: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
    };
    list.push(m);
    setLocal(`messages_${cid}`, list);
    return m;
  }
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
  if (!firebaseConfigured) {
    const list = getLocal<ChatMessage[]>(`messages_${cid}`, []);
    return limitCount ? list.slice(-limitCount) : list;
  }
  let q = query(msgs(uid, cid), orderBy('createdAt', 'asc'));
  if (limitCount) {
    q = query(q, firestoreLimit(limitCount));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as ChatMessage), id: d.id }));
};
