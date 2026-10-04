// app/api/mentora/route.ts — authn, rate limit, validation, real AI or labeled fallback.
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { complete } from '@/lib/mentora/adapter';
import { systemPrompt } from '@/lib/mentora/system';
import { buildContext, formatContextFromData, UserContextData } from '@/lib/mentora/context';
import { localReflect } from '@/lib/mentora/fallback';
import { getProfile } from '@/lib/data/userRepo';
import { listMessages } from '@/lib/data/conversations';
import { UserProfile, ChatMessage } from '@/lib/types';

// Initialize Firebase Admin if credentials are provided
if (getApps().length === 0) {
  try {
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
      const creds = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
      initializeApp({ credential: cert(creds) });
    } else {
      initializeApp();
    }
  } catch (e) {
    // Allows local development without crashing if admin sdk isn't fully configured
    console.warn('Firebase Admin init notice:', e);
  }
}

// In-memory rate limit (per uid/ip).
const hits = new Map<string, number[]>();
const LIMIT = 30;
const WINDOW = 60_000;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authz, conversationId, clientContext, userPreferences, recentHistory } = body;
    const message = (body.message || '').toString().slice(0, 4000);

    if (!message) {
      return NextResponse.json({ error: 'empty' }, { status: 400 });
    }

    let uid = 'anonymous';

    // Verify token if authz is passed and Admin Auth is functional
    if (authz && authz !== 'demo-token') {
      try {
        const decoded = await getAuth().verifyIdToken(authz);
        uid = decoded.uid;
      } catch (err) {
        console.warn('verifyIdToken skipped/failed:', (err as any)?.message);
      }
    } else if (authz === 'demo-token') {
      uid = 'demo-student-01';
    }

    const ts = Date.now();
    const arr = (hits.get(uid) || []).filter((t) => ts - t < WINDOW);
    if (arr.length >= LIMIT) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
    arr.push(ts);
    hits.set(uid, arr);

    let profile: UserProfile | null = null;
    if (uid !== 'anonymous' && uid !== 'demo-student-01') {
      try {
        profile = (await getProfile(uid)) || null;
      } catch {
        // Offline / fallback
      }
    }

    const defaultPrefs: UserProfile['preferences'] = {
      goals: ['Understanding personal patterns', 'Exploring study stress'],
      areas: ['Study', 'Sleep', 'Energy'],
      reflectionStyle: 'balanced',
      aiContextSharing: {
        enabled: true,
        includeCheckIns: true,
        includeJournal: true,
        includeExperiments: true,
        includeAssessments: true,
        includeInsights: true,
      },
    };

    const prefs: UserProfile['preferences'] =
      profile?.preferences ?? userPreferences ?? defaultPrefs;

    let ctx: { text: string; hasData: boolean } = { text: '', hasData: false };

    // 1. If client provided authorized context directly (demo mode or offline client sync)
    if (clientContext && prefs.aiContextSharing.enabled) {
      ctx = formatContextFromData(clientContext as UserContextData, prefs);
    }

    // 2. If client didn't provide context or hasData is false, try server-side Firestore query
    if (!ctx.hasData && uid !== 'anonymous') {
      try {
        ctx = await buildContext(uid, prefs, conversationId);
      } catch (err) {
        console.warn('Mentora context gathering notice:', (err as any)?.message);
      }
    }

    // Gather conversation history
    let hist: { role: 'user' | 'assistant'; content: string }[] = [];
    if (Array.isArray(recentHistory) && recentHistory.length > 0) {
      hist = recentHistory.slice(-8).map((m: ChatMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    } else if (uid !== 'anonymous' && conversationId) {
      try {
        const ms = await listMessages(uid, conversationId, 8);
        hist = ms.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      } catch {}
    }

    const sys =
      systemPrompt({ hasData: ctx.hasData, supported: [] }) +
      (ctx.hasData ? `\n\n<context>\n${ctx.text}\n</context>` : '');

    const msgs = [
      ...hist,
      { role: 'user' as const, content: message },
    ];

    const hasKey = Boolean(process.env.MENTORA_API_KEY?.trim());
    let content: string;
    let model: string;
    let fallback = !hasKey;

    if (hasKey) {
      try {
        const r = await complete({ system: sys, messages: msgs, maxTokens: 700 });
        content = r.content;
        model = r.model;
        fallback = Boolean(r.fallback);
      } catch (e: any) {
        if (e.message === 'rate_limited') {
          return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
        }
        console.warn('Falling back to localReflect due to LLM call error:', e.message);
        content = localReflect(message, ctx);
        model = 'local-fallback';
        fallback = true;
      }
    } else {
      content = localReflect(message, ctx);
      model = 'local';
      fallback = true;
    }

    return NextResponse.json({ content, model, fallback });
  } catch (e: any) {
    console.error('mentora route error:', e?.message || e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
