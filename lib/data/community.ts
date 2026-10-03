// lib/data/community.ts — shared state; deterministic like ids + transactional counter.
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  runTransaction,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { CommunityPost, Comment } from '@/lib/types';

export async function createPost(
  uid: string,
  handle: string,
  body: string,
  topic: string
): Promise<CommunityPost> {
  const ref = doc(collection(db, 'communityPosts'));
  const p: CommunityPost = {
    id: ref.id,
    authorId: uid,
    authorHandle: handle,
    body,
    topic,
    createdAt: Date.now(),
    likeCount: 0,
    deleted: false,
  };
  await setDoc(ref, p);
  return p;
}

export async function listPosts(opts: { topic?: string; limit?: number } = {}): Promise<CommunityPost[]> {
  let q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
  if (opts.limit) {
    q = query(q, firestoreLimit(opts.limit));
  }
  const s = await getDocs(q);
  return s.docs
    .map((d) => ({ ...(d.data() as CommunityPost), id: d.id }))
    .filter((p) => !p.deleted && (!opts.topic || opts.topic === 'All' || p.topic === opts.topic));
}

export async function addComment(
  uid: string,
  handle: string,
  postId: string,
  body: string
): Promise<Comment> {
  const ref = doc(collection(db, 'communityPosts', postId, 'comments'));
  const c: Comment = {
    id: ref.id,
    authorId: uid,
    authorHandle: handle,
    body,
    createdAt: Date.now(),
  };
  await setDoc(ref, c);
  return c;
}

export async function listComments(postId: string): Promise<Comment[]> {
  const s = await getDocs(query(collection(db, 'communityPosts', postId, 'comments'), orderBy('createdAt', 'asc')));
  return s.docs.map((d) => ({ ...(d.data() as Comment), id: d.id }));
}

// Deterministic like id = uid. Transaction syncs the denormalized counter atomically.
export async function toggleLike(uid: string, postId: string): Promise<boolean> {
  const likeRef = doc(db, 'communityPosts', postId, 'likes', uid);
  return runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef);
    const postRef = doc(db, 'communityPosts', postId);
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists()) throw new Error('post not found');
    const cur = (postSnap.data() as CommunityPost).likeCount || 0;
    if (likeSnap.exists()) {
      tx.delete(likeRef);
      tx.update(postRef, { likeCount: Math.max(0, cur - 1) });
      return false;
    } else {
      tx.set(likeRef, { uid, createdAt: Date.now() });
      tx.update(postRef, { likeCount: cur + 1 });
      return true;
    }
  });
}

export const bookmark = (uid: string, postId: string) =>
  setDoc(doc(db, 'users', uid, 'bookmarks', postId), { postId, createdAt: Date.now() });

export const unbookmark = (uid: string, postId: string) =>
  deleteDoc(doc(db, 'users', uid, 'bookmarks', postId));

export async function isBookmarked(uid: string, postId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid, 'bookmarks', postId));
  return snap.exists();
}

export async function myBookmarks(uid: string): Promise<CommunityPost[]> {
  const s = await getDocs(collection(db, 'users', uid, 'bookmarks'));
  const ids = s.docs.map((d) => d.id);
  if (!ids.length) return [];
  const posts = await Promise.all(ids.map((id) => getDoc(doc(db, 'communityPosts', id))));
  return posts
    .filter((x) => x.exists() && !(x.data() as CommunityPost).deleted)
    .map((x) => ({ ...(x.data() as CommunityPost), id: x.id }));
}

export const reportPost = (uid: string, postId: string, reason: string) =>
  setDoc(doc(collection(db, 'communityReports')), {
    targetId: postId,
    targetType: 'post',
    reason,
    reportedBy: uid,
    createdAt: Date.now(),
  });
