'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  listConversations,
  createConversation,
  listMessages,
  saveMessage,
} from '@/lib/data/conversations';
import { ChatMessage, Conversation } from '@/lib/types';
import { auth } from '@/lib/firebase';

export default function ChatView() {
  const { user, profile } = useAuth();

  const [conv, setConv] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      listConversations(user.uid).then(setConvs);
    }
  }, [user]);

  useEffect(() => {
    if (user && conv) {
      listMessages(user.uid, conv.id).then(setMsgs);
    }
  }, [conv, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, busy]);

  const startNew = async () => {
    if (!user) return;
    const c = await createConversation(user.uid, 'Reflective Session');
    setConvs((prev) => [c, ...prev]);
    setConv(c);
    setMsgs([]);
  };

  const send = async () => {
    if (!user || !input.trim() || busy) return;

    let cid = conv?.id;
    if (!cid) {
      const c = await createConversation(user.uid, input.slice(0, 30));
      setConv(c);
      cid = c.id;
      setConvs((prev) => [c, ...prev]);
    }

    const textToSend = input.trim();
    setInput('');

    const um: Omit<ChatMessage, 'id'> = {
      role: 'user',
      content: textToSend,
      createdAt: Date.now(),
    };

    // Save and render user message immediately
    const savedUserMsg = await saveMessage(user.uid, cid, um);
    setMsgs((m) => [...m, savedUserMsg]);
    setBusy(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/mentora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authz: token,
          conversationId: cid,
          message: textToSend,
        }),
      });

      const j = await res.json();
      if (j.error && j.error !== 'rate_limited') {
        throw new Error(j.error);
      }

      const am: Omit<ChatMessage, 'id'> = {
        role: 'assistant',
        content:
          j.error === 'rate_limited'
            ? 'You are going a bit fast — take a moment before asking again (rate limited).'
            : j.content || 'I’m here to reflect alongside you.',
        createdAt: Date.now(),
        fallback: Boolean(j.fallback),
      };

      const savedAiMsg = await saveMessage(user.uid, cid, am);
      setMsgs((m) => [...m, savedAiMsg]);
    } catch {
      const fallbackMsg: Omit<ChatMessage, 'id'> = {
        role: 'assistant',
        content:
          'Mentora is currently running in local offline reflection mode. Take a moment to write down what felt most significant in what you just shared.',
        createdAt: Date.now(),
        fallback: true,
      };
      const savedFallback = await saveMessage(user.uid, cid, fallbackMsg);
      setMsgs((m) => [...m, savedFallback]);
    } finally {
      setBusy(false);
    }
  };

  const aiOn = profile?.preferences.aiContextSharing.enabled;

  return (
    <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-10rem)] min-h-[500px]">
      {/* Sidebar for Conversations */}
      <aside className="lg:col-span-1 rounded-xl2 bg-card border border-line p-4 flex flex-col shadow-soft">
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <h2 className="font-display text-lg text-ink">Conversations</h2>
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="text-xs text-ink-mute hover:text-ink lg:hidden bg-paper-deep px-2 py-1 rounded"
          >
            {showHistory ? 'Hide' : 'History'}
          </button>
        </div>

        <button
          onClick={startNew}
          className="mt-3 bg-ink text-paper rounded-xl py-2 text-sm font-medium hover:bg-ink-soft transition"
        >
          + New Reflection
        </button>

        <div
          className={`mt-4 space-y-1.5 overflow-y-auto flex-1 ${
            showHistory ? 'block' : 'hidden lg:block'
          }`}
        >
          {convs.length === 0 ? (
            <p className="text-xs text-ink-mute p-2">No prior chats.</p>
          ) : (
            convs.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setConv(c);
                  setShowHistory(false);
                }}
                className={`w-full text-left rounded-xl px-3 py-2 text-xs truncate transition ${
                  conv?.id === c.id
                    ? 'bg-paper-deep font-semibold text-ink'
                    : 'text-ink-soft hover:bg-paper-soft'
                }`}
              >
                {c.title}
              </button>
            ))
          )}
        </div>

        <div className="mt-auto text-[11px] text-ink-mute pt-3 border-t border-line/60 space-y-1">
          <div>
            Context shared:{' '}
            <span className="font-semibold text-teal-deep">
              {aiOn ? 'Active (per settings)' : 'Off (this session only)'}
            </span>
          </div>
          <div className="leading-snug">
            Mentora is an educational reflection companion, not a counselor or clinician.
          </div>
        </div>
      </aside>

      {/* Main Chat Display */}
      <div className="lg:col-span-3 rounded-xl2 bg-paper-soft border border-line flex flex-col shadow-soft overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {msgs.length === 0 && (
            <div className="text-center text-ink-mute mt-16 max-w-sm mx-auto space-y-2">
              <div className="text-4xl">🌿</div>
              <h3 className="font-display text-xl text-ink">Welcome to Mentora</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                A calm, non-judgmental space to think out loud. Try exploring: “What’s been draining my energy this week?” or “How can I approach tomorrow’s deadlines with more calm?”
              </p>
            </div>
          )}

          {msgs.map((m, i) => (
            <div
              key={m.id || i}
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-teal text-white shadow-soft rounded-br-sm'
                  : 'bg-card border border-line text-ink-soft shadow-soft rounded-bl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.fallback && (
                <span className="block text-[10px] mt-2 pt-1 border-t border-line/40 text-ink-mute italic">
                  [Labeled local reflection — no remote AI model active]
                </span>
              )}
            </div>
          ))}

          {busy && (
            <div className="bg-card border border-line rounded-2xl p-3.5 max-w-[50%] text-xs text-ink-mute shadow-soft animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
              Mentora is reflecting...
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-line bg-card flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Type your reflection to Mentora..."
            className="flex-1 rounded-xl border border-line bg-paper-soft p-3 text-sm text-ink focus:border-teal focus:outline-none"
            disabled={busy}
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="bg-coral text-white px-6 rounded-xl text-sm font-medium hover:bg-coral-deep transition shadow-soft disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
