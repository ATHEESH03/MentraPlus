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
  const key = process.env.MENTORA_API_KEY?.trim();
  const base =
    process.env.MENTORA_API_BASE_URL?.trim().replace(/\/$/, '') || 'https://api.openai.com/v1';
  const model = process.env.MENTORA_MODEL?.trim() || 'gemini-flash-lite-latest';

  if (!key) return { content: '', model: 'local', fallback: true };

  const callModel = async (targetModel: string) => {
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
          model: targetModel,
          temperature: 0.7,
          max_tokens: input.maxTokens ?? 700,
          messages: [{ role: 'system', content: input.system }, ...input.messages],
        }),
      });

      if (res.status === 429) {
        throw new Error('rate_limited');
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`Mentora LLM notice (${res.status} for ${targetModel}):`, errText);
        throw new Error(`provider_${res.status}`);
      }

      const j = await res.json();
      return j.choices?.[0]?.message?.content ?? '';
    } finally {
      clearTimeout(to);
    }
  };

  try {
    const content = await callModel(model);
    return { content, model, fallback: false };
  } catch (err: any) {
    if (err.message === 'rate_limited') throw err;

    // If using Google Gemini and initial model experienced high demand (503) or 404, retry with resilient fallback
    if (base.includes('googleapis.com') && model !== 'gemini-flash-lite-latest') {
      try {
        console.log('Retrying with backup model gemini-flash-lite-latest...');
        const fallbackContent = await callModel('gemini-flash-lite-latest');
        return { content: fallbackContent, model: 'gemini-flash-lite-latest', fallback: false };
      } catch (fallbackErr: any) {
        console.error('Gemini backup model failed:', fallbackErr?.message);
      }
    }
    throw err;
  }
}
