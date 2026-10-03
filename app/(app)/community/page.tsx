'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { listPosts, isBookmarked } from '@/lib/data/community';
import { CommunityPost } from '@/lib/types';
import { PostCard } from '@/components/community/PostCard';
import { Spinner } from '@/components/ui/Spinner';

const TOPICS = [
  'All',
  'Academic pressure',
  'Everyday coping',
  'Sleep & routines',
  'Campus life',
  'Personal growth',
  'Social connection',
  'Small wins',
];

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [bookmarksMap, setBookmarksMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    if (!user) return;
    try {
      const all = await listPosts({ topic: selectedTopic });
      setPosts(all);

      const bMap: Record<string, boolean> = {};
      for (const p of all) {
        bMap[p.id] = await isBookmarked(user.uid, p.id);
      }
      setBookmarksMap(bMap);
    } catch (e) {
      console.error('Failed to load posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user, selectedTopic]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink">Circles</h1>
          <p className="text-ink-soft text-xs mt-1">
            Pseudonymous student community · Posting as{' '}
            <strong className="text-teal-deep">@{profile?.handle}</strong>
          </p>
        </div>
        <Link
          href="/app/community/new"
          className="bg-coral text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-soft hover:bg-coral-deep transition"
        >
          + New Post
        </Link>
      </div>

      {/* Topic Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelectedTopic(t)}
            className={`text-xs rounded-full px-3 py-1.5 border transition ${
              selectedTopic === t
                ? 'bg-ink text-paper border-ink'
                : 'bg-card border-line text-ink-soft hover:bg-paper-deep'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="md" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl2 bg-paper-soft border border-line p-10 text-center shadow-soft space-y-3">
          <p className="text-xs text-ink-mute">
            No posts found in this Circle yet. Be the first to share an experience or small win.
          </p>
          <Link
            href="/app/community/new"
            className="inline-block text-xs text-teal-deep font-semibold hover:underline"
          >
            Create the first post →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isBookmarked={Boolean(bookmarksMap[post.id])}
            />
          ))}
        </div>
      )}

      {/* Moderation & safety note */}
      <div className="rounded-xl bg-paper-deep/60 p-4 border border-line text-[11px] text-ink-mute leading-relaxed">
        <strong>Community Guidelines & Notice:</strong> Circles is intended for mutual student peer encouragement. Moderation is best-effort based on community reports. Medical advice, harassment, or crisis disclosures should not be directed to public threads; please reach out to licensed services if in distress.
      </div>
    </div>
  );
}
