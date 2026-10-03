// lib/mentora/fallback.ts — HONEST, labeled. Never passed off as a model.
export function localReflect(userMsg: string, ctx: { hasData: boolean }): string {
  const has = ctx.hasData
    ? 'It looks like you have some recorded check-ins and experiments I can refer to (enable AI context in Profile → Privacy to let me). '
    : '';
  const s = userMsg.toLowerCase();

  if (/(kill|hurt|suicid|self[- ]?harm|can'?t go on|end it)/.test(s)) {
    return (
      "I'm really glad you told me, and I'm not equipped to keep this going alone. Your safety matters most right now. Please reach out to a person you trust, your campus counselling service, or local emergency services now. You do not have to figure this out by yourself. " +
      has +
      "Whenever you're ready, I'm here to think alongside you."
    );
  }

  if (/thank/.test(s)) return "You're welcome. What would be useful to think about next?";

  return (
    has +
    "Here's a gentle way to keep exploring: what was one specific moment today where you noticed a feeling, and what did you do in response? We can check it against your records and see if a pattern is worth a small experiment."
  );
}
