'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  listConversations,
  createConversation,
  listMessages,
  saveMessage,
} from '@/lib/data/conversations';
import { listCheckIns } from '@/lib/data/checkIns';
import { listExperiments, listAttempts } from '@/lib/data/experiments';
import { listStrategies } from '@/lib/data/strategies';
import { listJournal } from '@/lib/data/journal';
import { listAssessments } from '@/lib/data/assessments';
import { listInsights } from '@/lib/data/insightsRepo';
import { UserContextData } from '@/lib/mentora/context';
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
  const [engineModel, setEngineModel] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean | null>(null);
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

  const handleSuggestedPrompt = (promptText: string) => {
    setInput(promptText);
  };

  const send = async (explicitText?: string) => {
    const textToSend = (explicitText ?? input).trim();
    if (!user || !textToSend || busy) return;

    let cid = conv?.id;
    if (!cid) {
      const c = await createConversation(user.uid, textToSend.slice(0, 30));
      setConv(c);
      cid = c.id;
      setConvs((prev) => [c, ...prev]);
    }

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
      // Gather authorized client context if enabled
      let clientContext: UserContextData | undefined = undefined;
      const aiPrefs = profile?.preferences.aiContextSharing;

      if (aiPrefs?.enabled) {
        try {
          const checkIns = aiPrefs.includeCheckIns
            ? await listCheckIns(user.uid, { limit: 8 })
            : [];
          let experimentsWithAttempts: any[] = [];
          if (aiPrefs.includeExperiments) {
            const rawExps = await listExperiments(user.uid);
            experimentsWithAttempts = await Promise.all(
              rawExps.slice(0, 4).map(async (exp) => {
                const attempts = await listAttempts(user.uid, exp.id);
                return { ...exp, attempts };
              })
            );
          }
          const strategies = await listStrategies(user.uid);
          const journal = aiPrefs.includeJournal ? await listJournal(user.uid) : [];
          const assessments = aiPrefs.includeAssessments ? await listAssessments(user.uid) : [];
          const insights = aiPrefs.includeInsights ? await listInsights(user.uid) : [];

          clientContext = {
            profile: {
              displayName: profile?.displayName,
              goals: profile?.preferences.goals,
              areas: profile?.preferences.areas,
              reflectionStyle: profile?.preferences.reflectionStyle,
            },
            checkIns,
            experiments: experimentsWithAttempts,
            strategies,
            journal: journal.slice(0, 3),
            assessments: assessments.slice(0, 3),
            insights: insights.slice(0, 4),
          };
        } catch (ctxErr) {
          console.warn('Mentora client context collection notice:', ctxErr);
        }
      }

      const token = (await auth.currentUser?.getIdToken()) || 'demo-token';
      const res = await fetch('/api/mentora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authz: token,
          conversationId: cid,
          message: textToSend,
          clientContext,
          userPreferences: profile?.preferences,
          recentHistory: msgs.slice(-6),
        }),
      });

      const j = await res.json();
      if (j.error && j.error !== 'rate_limited') {
        throw new Error(j.error);
      }

      setEngineModel(j.model || null);
      setIsFallback(Boolean(j.fallback));

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
    } catch (e: any) {
      const fallbackMsg: Omit<ChatMessage, 'id'> = {
        role: 'assistant',
        content:
          'Mentora is currently running in local offline reflection mode. Take a moment to write down what felt most significant in what you just shared.',
        createdAt: Date.now(),
        fallback: true,
      };
      const savedFallback = await saveMessage(user.uid, cid, fallbackMsg);
      setMsgs((m) => [...m, savedFallback]);
      setIsFallback(true);
      setEngineModel('local-fallback');
    } finally {
      setBusy(false);
    }
  };

  const aiOn = profile?.preferences.aiContextSharing.enabled;

  return (
    <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-10rem)] min-h-[520px]">
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

        {/* Engine & Context Status */}
        <div className="mt-auto text-[11px] text-ink-mute pt-3 border-t border-line/60 space-y-2">
          <div className="flex items-center justify-between">
            <span>Context Sharing:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                aiOn
                  ? 'bg-teal/10 text-teal-deep'
                  : 'bg-paper-deep text-ink-mute'
              }`}
            >
              {aiOn ? 'Active (Records Synced)' : 'Off (This Chat Only)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span>AI Status:</span>
            <span className="font-medium text-ink-soft text-[10px]">
              {isFallback === false && engineModel
                ? `Live AI (${engineModel})`
                : 'Reflection Engine'}
            </span>
          </div>

          <div className="leading-snug text-[10px] text-ink-mute pt-1">
            Mentora is an educational reflection companion, not a counselor or clinician.
          </div>
        </div>
      </aside>

      {/* Main Chat Display */}
      <div className="lg:col-span-3 rounded-xl2 bg-paper-soft border border-line flex flex-col shadow-soft overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {msgs.length === 0 && (
            <div className="text-center text-ink-mute mt-10 max-w-md mx-auto space-y-4">
              <div className="text-4xl">🌿</div>
              <h3 className="font-display text-xl text-ink">Welcome to Mentora</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                A calm, non-judgmental space to think out loud. Mentora analyzes your check-ins, experiments, and strategies to help you discover what works for your wellbeing and study rhythm.
              </p>

              <div className="pt-2 text-left space-y-2">
                <span className="text-[11px] font-semibold text-ink-mute uppercase tracking-wider block">
                  Suggested Prompts:
                </span>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() =>
                      handleSuggestedPrompt(
                        "What patterns do you notice in what helps me settle down when I'm stressed?"
                      )
                    }
                    className="text-left text-xs bg-card hover:bg-paper border border-line rounded-xl px-3 py-2 text-ink-soft hover:text-ink transition shadow-soft"
                  >
                    💡 “What patterns do you notice in what helps me settle down when I&apos;m stressed?”
                  </button>
                  <button
                    onClick={() =>
                      handleSuggestedPrompt(
                        'Can you analyze my recent check-ins and tell me which strategies were most effective?'
                      )
                    }
                    className="text-left text-xs bg-card hover:bg-paper border border-line rounded-xl px-3 py-2 text-ink-soft hover:text-ink transition shadow-soft"
                  >
                    📊 “Analyze my recent check-ins and what strategies worked best.”
                  </button>
                  <button
                    onClick={() =>
                      handleSuggestedPrompt(
                        'How is my 10-minute walk experiment going, and what should my next step be?'
                      )
                    }
                    className="text-left text-xs bg-card hover:bg-paper border border-line rounded-xl px-3 py-2 text-ink-soft hover:text-ink transition shadow-soft"
                  >
                    🧪 “How is my 10-minute walk experiment going, and what should my next step be?”
                  </button>
                </div>
              </div>
            </div>
          )}

          {msgs.map((m, i) => (
            <div
              key={m.id || i}
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-teal text-white shadow-soft rounded-br-sm'
                  : 'bg-card border border-line text-ink-soft shadow-soft rounded-bl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.fallback && (
                <span className="block text-[10px] mt-2 pt-1.5 border-t border-line/40 text-ink-mute italic">
                  [Reflective analysis mode — add an API key in .env.local for live LLM completions]
                </span>
              )}
            </div>
          ))}

          {busy && (
            <div className="bg-card border border-line rounded-2xl p-3.5 max-w-[50%] text-xs text-ink-mute shadow-soft animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
              Mentora is analyzing and reflecting...
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
            placeholder="Ask Mentora to analyze patterns, explore strategies, or reflect on your day..."
            className="flex-1 rounded-xl border border-line bg-paper-soft p-3 text-sm text-ink focus:border-teal focus:outline-none"
            disabled={busy}
          />
          <button
            onClick={() => send()}
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
