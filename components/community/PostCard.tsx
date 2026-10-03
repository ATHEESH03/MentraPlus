'use client';
import React, { useState } from 'react';
import { CommunityPost, Comment } from '@/lib/types';
import { relTime } from '@/lib/utils';
import {
  toggleLike,
  bookmark,
  unbookmark,
  reportPost,
  listComments,
  addComment,
} from '@/lib/data/community';
import { useAuth } from '@/lib/auth';

export function PostCard({
  post,
  isBookmarked: initialBookmarked = false,
  onLikeToggled,
}: {
  post: CommunityPost;
  isBookmarked?: boolean;
  onLikeToggled?: (postId: string, newCount: number) => void;
}) {
  const { user, profile } = useAuth();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [saved, setSaved] = useState(initialBookmarked);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reported, setReported] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    try {
      const isNowLiked = await toggleLike(user.uid, post.id);
      setLiked(isNowLiked);
      const newCount = isNowLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
      setLikeCount(newCount);
      if (onLikeToggled) onLikeToggled(post.id, newCount);
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    try {
      if (saved) {
        await unbookmark(user.uid, post.id);
        setSaved(false);
      } else {
        await bookmark(user.uid, post.id);
        setSaved(true);
      }
    } catch (e) {
      console.error('Bookmark error:', e);
    }
  };

  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      const list = await listComments(post.id);
      setComments(list);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const c = await addComment(
        user.uid,
        profile.handle || 'wanderer',
        post.id,
        newComment.trim()
      );
      setComments((prev) => [...prev, c]);
      setNewComment('');
    } catch (e) {
      console.error('Comment error:', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReport = async () => {
    if (!user || reported) return;
    const reason = prompt('Please let us know why you are reporting this post:');
    if (reason && reason.trim()) {
      await reportPost(user.uid, post.id, reason.trim().slice(0, 500));
      setReported(true);
      alert('Thank you for letting us know. Our moderation review has received your report.');
    }
  };

  return (
    <div className="rounded-xl2 bg-card border border-line p-5 shadow-soft space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center text-xs text-ink-mute">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-teal-deep">@{post.authorHandle}</span>
          <span>·</span>
          <span className="bg-paper-deep px-2 py-0.5 rounded-full text-[11px] font-medium text-ink-soft">
            {post.topic}
          </span>
        </div>
        <span>{relTime(post.createdAt)}</span>
      </div>

      {/* Body */}
      <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">
        {post.body}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-5 pt-2 border-t border-line/60 text-xs">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-medium transition ${
            liked ? 'text-coral-deep' : 'text-ink-mute hover:text-coral-deep'
          }`}
        >
          <span>{liked ? '♥' : '♡'}</span>
          <span>{likeCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="text-ink-mute hover:text-ink font-medium"
        >
          Comments {comments.length > 0 && `(${comments.length})`}
        </button>

        <button
          onClick={handleBookmark}
          className={`font-medium ${saved ? 'text-teal-deep font-semibold' : 'text-ink-mute hover:text-ink'}`}
        >
          {saved ? 'Saved' : 'Save'}
        </button>

        <button
          onClick={handleReport}
          disabled={reported}
          className="ml-auto text-ink-mute hover:text-coral-deep disabled:opacity-40"
        >
          {reported ? 'Reported' : 'Report'}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="pt-3 border-t border-line space-y-3">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-ink-mute italic">No comments yet. Start the conversation.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="text-xs bg-paper-soft p-2.5 rounded-xl">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-teal-deep">@{c.authorHandle}</span>
                    <span className="text-ink-mute text-[10px]">{relTime(c.createdAt)}</span>
                  </div>
                  <div className="text-ink-soft">{c.body}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendComment} className="flex gap-2 pt-1">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a supportive comment..."
              className="flex-1 rounded-xl border border-line bg-paper-soft p-2 text-xs focus:border-teal focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submittingComment}
              className="bg-ink text-paper px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
