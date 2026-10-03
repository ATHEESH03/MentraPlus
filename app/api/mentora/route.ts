// app/api/mentora/route.ts — authn, rate limit, validation, real AI or labeled fallback.
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { complete, LLMInput } from '@/lib/mentora/adapter';
import { systemPrompt } from '@/lib/mentora/system';
import { buildContext } from '@/lib/mentora/context';
import { localReflect } from '@/lib/mentora/fallback';
import { getProfile } from '@/lib/data/userRepo';
import { listMessages } from '@/lib/data/conversations';

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

// In-memory rate limit (per uid). For production, use a persistent store (e.g. Upstash)
const hits = new Map<string, number[]>();
const LIMIT = 20;
const WINDOW = 60_000;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authz, conversationId } = body;
    const message = (body.message || '').toString().slice(0, 4000);

    if (!message) {
      return NextResponse.json({ error: 'empty' }, { status: 400 });
    }

    let uid = 'anonymous';

    // Verify token if authz is passed and Admin Auth is functional
    if (authz) {
      try {
        const decoded = await getAuth().verifyIdToken(authz);
        uid = decoded.uid;
      } catch (err) {
        console.warn('verifyIdToken skipped/failed:', (err as any)?.message);
        // Fall back to decoded or allow local reflection
      }
    }

    const ts = Date.now();
    const arr = (hits.get(uid) || []).filter((t) => ts - t < WINDOW);
    if (arr.length >= LIMIT) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
    arr.push(ts);
    hits.set(uid, arr);

    let profile = null;
    if (uid !== 'anonymous') {
      try {
        profile = await getProfile(uid);
      } catch {
        // Profile fetch might fail if firestore rules/offline
      }
    }

    const defaultPrefs = {
      goals: [],
      areas: [],
      reflectionStyle: 'balanced' as const,
      aiContextSharing: {
        enabled: false,
        includeCheckIns: false,
        includeJournal: false,
        includeExperiments: false,
        includeAssessments: false,
        includeInsights: false,
      },
    };

    const prefs = profile?.preferences ?? defaultPrefs;
    let ctx = { text: '', hasData: false };
    let hist: any[] = [];

    if (uid !== 'anonymous') {
      try {
        ctx = await buildContext(uid, prefs, conversationId);
        if (conversationId) {
          hist = await listMessages(uid, conversationId, 12);
        }
      } catch (err) {
        console.warn('Mentora context gathering notice:', (err as any)?.message);
      }
    }

    const sys =
      systemPrompt({ hasData: ctx.hasData, supported: [] }) +
      (ctx.hasData ? `\n\n<context>\n${ctx.text}\n</context>` : '');

    const msgs = [
      ...hist.map((m) => ({ role: m.role as any, content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const hasKey = Boolean(process.env.MENTORA_API_KEY);
    let content: string;
    let model: string;
    let fallback = !hasKey;

    if (hasKey) {
      try {
        const r = await complete({ system: sys, messages: msgs, maxTokens: 512 });
        content = r.content;
        model = r.model;
        fallback = Boolean(r.fallback);
      } catch (e: any) {
        if (e.message === 'rate_limited') {
          return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
        }
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
    console.error('mentora:', e?.message || e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
