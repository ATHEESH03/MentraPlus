'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createPost } from '@/lib/data/community';

const TOPICS = [
  'Academic pressure',
  'Everyday coping',
  'Sleep & routines',
  'Campus life',
  'Personal growth',
  'Social connection',
  'Small wins',
];

export function Composer() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [topic, setTopic] = useState(TOPICS[0]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !body.trim() || busy) return;

    setBusy(true);
    setErr('');

    try {
      await createPost(
        user.uid,
        profile.handle || 'wanderer',
        body.trim(),
        topic
      );
      router.push('/app/community');
    } catch {
      setErr('Could not publish your post. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      <div className="rounded-xl bg-paper-deep/60 p-4 border border-line text-xs text-ink-mute">
        <span className="font-semibold text-ink-soft">Pseudonymous posting:</span> You are posting as{' '}
        <span className="font-bold text-teal-deep">@{profile?.handle}</span>. Your real name, email, private check-ins, and journal entries are never linked to community posts.
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide font-medium text-ink-mute block mb-2">
          Select Circle Topic
        </label>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              className={`text-xs rounded-full px-3.5 py-1.5 border transition ${
                topic === t
                  ? 'bg-teal text-white border-teal shadow-soft'
                  : 'bg-card border-line text-ink-soft hover:bg-paper-deep'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide font-medium text-ink-mute block mb-2">
          Share your experience or thought
        </label>
        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share what worked, a reflection on a challenge, or a small win..."
          className="w-full rounded-xl border border-line bg-card p-3 text-sm text-ink focus:border-teal focus:outline-none leading-relaxed"
          maxLength={2000}
          required
        />
        <div className="text-right text-[11px] text-ink-mute mt-1">
          {body.length} / 2000
        </div>
      </div>

      {err && <p className="text-coral-deep text-sm">{err}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!body.trim() || busy}
          className="bg-coral text-white px-7 py-2.5 rounded-xl text-sm font-medium shadow-soft hover:bg-coral-deep transition disabled:opacity-50"
        >
          {busy ? 'Posting...' : 'Publish to Circles'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl border border-line text-sm text-ink-mute hover:text-ink transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
