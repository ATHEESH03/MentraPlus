// lib/data/community.ts — shared state; deterministic like ids + transactional counter.
import { db, firebaseConfigured } from '@/lib/firebase';
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
import { getLocal, setLocal } from './localStore';

export async function createPost(
  uid: string,
  handle: string,
  body: string,
  topic: string
): Promise<CommunityPost> {
  if (!firebaseConfigured) {
    const list = getLocal<CommunityPost[]>('community', []);
    const p: CommunityPost = {
      id: `post-${Date.now()}`,
      authorId: uid,
      authorHandle: handle,
      body,
      topic,
      createdAt: Date.now(),
      likeCount: 0,
      deleted: false,
    };
    list.unshift(p);
    setLocal('community', list);
    return p;
  }
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
  if (!firebaseConfigured) {
    const list = getLocal<CommunityPost[]>('community', []);
    const filtered = list.filter(
      (p) => !p.deleted && (!opts.topic || opts.topic === 'All' || p.topic === opts.topic)
    );
    return opts.limit ? filtered.slice(0, opts.limit) : filtered;
  }
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
  if (!firebaseConfigured) {
    const list = getLocal<Comment[]>(`comments_${postId}`, []);
    const c: Comment = {
      id: `comm-${Date.now()}`,
      authorId: uid,
      authorHandle: handle,
      body,
      createdAt: Date.now(),
    };
    list.push(c);
    setLocal(`comments_${postId}`, list);
    return c;
  }
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
  if (!firebaseConfigured) {
    return getLocal<Comment[]>(`comments_${postId}`, []);
  }
  const s = await getDocs(query(collection(db, 'communityPosts', postId, 'comments'), orderBy('createdAt', 'asc')));
  return s.docs.map((d) => ({ ...(d.data() as Comment), id: d.id }));
}

// Deterministic like id = uid. Transaction syncs the denormalized counter atomically.
export async function toggleLike(uid: string, postId: string): Promise<boolean> {
  if (!firebaseConfigured) {
    const likedKey = `like_${postId}_${uid}`;
    const wasLiked = getLocal<boolean>(likedKey, false);
    const list = getLocal<CommunityPost[]>('community', []);
    const post = list.find((p) => p.id === postId);
    if (wasLiked) {
      setLocal(likedKey, false);
      if (post) post.likeCount = Math.max(0, post.likeCount - 1);
      setLocal('community', list);
      return false;
    } else {
      setLocal(likedKey, true);
      if (post) post.likeCount = (post.likeCount || 0) + 1;
      setLocal('community', list);
      return true;
    }
  }
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

export const bookmark = async (uid: string, postId: string) => {
  if (!firebaseConfigured) {
    const saved = getLocal<string[]>('bookmarks', []);
    if (!saved.includes(postId)) saved.push(postId);
    setLocal('bookmarks', saved);
    return;
  }
  return setDoc(doc(db, 'users', uid, 'bookmarks', postId), { postId, createdAt: Date.now() });
};

export const unbookmark = async (uid: string, postId: string) => {
  if (!firebaseConfigured) {
    const saved = getLocal<string[]>('bookmarks', []);
    setLocal(
      'bookmarks',
      saved.filter((id) => id !== postId)
    );
    return;
  }
  return deleteDoc(doc(db, 'users', uid, 'bookmarks', postId));
};

export async function isBookmarked(uid: string, postId: string): Promise<boolean> {
  if (!firebaseConfigured) {
    const saved = getLocal<string[]>('bookmarks', []);
    return saved.includes(postId);
  }
  const snap = await getDoc(doc(db, 'users', uid, 'bookmarks', postId));
  return snap.exists();
}

export async function myBookmarks(uid: string): Promise<CommunityPost[]> {
  if (!firebaseConfigured) {
    const saved = getLocal<string[]>('bookmarks', []);
    const all = getLocal<CommunityPost[]>('community', []);
    return all.filter((p) => saved.includes(p.id) && !p.deleted);
  }
  const s = await getDocs(collection(db, 'users', uid, 'bookmarks'));
  const ids = s.docs.map((d) => d.id);
  if (!ids.length) return [];
  const posts = await Promise.all(ids.map((id) => getDoc(doc(db, 'communityPosts', id))));
  return posts
    .filter((x) => x.exists() && !(x.data() as CommunityPost).deleted)
    .map((x) => ({ ...(x.data() as CommunityPost), id: x.id }));
}

export const reportPost = async (uid: string, postId: string, reason: string) => {
  if (!firebaseConfigured) {
    const reports = getLocal<any[]>('reports', []);
    reports.push({ postId, reason, reportedBy: uid, createdAt: Date.now() });
    setLocal('reports', reports);
    return;
  }
  return setDoc(doc(collection(db, 'communityReports')), {
    targetId: postId,
    targetType: 'post',
    reason,
    reportedBy: uid,
    createdAt: Date.now(),
  });
};
