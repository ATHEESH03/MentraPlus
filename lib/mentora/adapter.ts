// lib/mentora/adapter.ts — one interface; swap providers without touching the app.
export interface LLMResult {
  content: string;
  model: string;
  fallback?: boolean;
}

export interface LLMInput {
  system: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  maxTokens?: number;
}

export async function complete(input: LLMInput): Promise<LLMResult> {
  const key = process.env.MENTORA_API_KEY;
  const base = process.env.MENTORA_API_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const model = process.env.MENTORA_MODEL || 'gpt-4o-mini';

  if (!key) return { content: '', model: 'local', fallback: true };

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 45000);

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: input.maxTokens ?? 512,
        messages: [{ role: 'system', content: input.system }, ...input.messages],
      }),
    });

    if (res.status === 429) throw new Error('rate_limited');
    if (!res.ok) throw new Error('provider_' + res.status);

    const j = await res.json();
    return {
      content: j.choices?.[0]?.message?.content ?? '',
      model,
    };
  } finally {
    clearTimeout(to);
  }
}
