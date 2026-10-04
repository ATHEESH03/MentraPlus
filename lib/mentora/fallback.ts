// lib/mentora/fallback.ts — Honest, labeled offline reflection engine that analyzes context when available.
export function localReflect(userMsg: string, ctx: { text?: string; hasData: boolean }): string {
  const s = userMsg.toLowerCase();

  // Crisis check
  if (/(kill|hurt|suicid|self[- ]?harm|can'?t go on|end it|give up on life)/.test(s)) {
    return (
      "I'm really glad you reached out, but I'm an educational companion and not equipped to help with immediate crises alone. Your safety and wellbeing matter above everything else right now.\n\n" +
      "Please connect with a person you trust, your campus counseling center, or call/text your local emergency line (like 988 in the US/Canada, or 112/999 in your region). You don't have to carry this alone."
    );
  }

  if (/^(thank|thanks|thank you)/.test(s.trim())) {
    return "You're very welcome! Whenever you want to explore another pattern, review what’s draining your focus, or test a new experiment, I'm here.";
  }

  if (ctx.hasData && ctx.text) {
    // Extract key elements from context
    const lines = ctx.text.split('\n');
    const situations: string[] = [];
    const helpfulStrategies = new Set<string>();
    const experiments: string[] = [];
    let assessmentSummary = '';

    for (const line of lines) {
      if (line.includes('Situation:')) {
        const match = line.match(/Situation:\s*([^|]+)/);
        if (match) situations.push(match[1].trim());
      }
      if (line.includes('Outcome: helpful') || line.includes('Outcome: better')) {
        const stratMatch = line.match(/Strategies tried:\s*\[([^\]]+)\]/);
        if (stratMatch) {
          stratMatch[1].split(',').forEach((st) => helpfulStrategies.add(st.trim()));
        }
      }
      if (line.includes('Experiment:')) {
        const expMatch = line.match(/Experiment:\s*"([^"]+)"/);
        if (expMatch) experiments.push(expMatch[1]);
      }
      if (line.includes('Assessment:') && !assessmentSummary) {
        assessmentSummary = line.trim();
      }
    }

    const uniqueSituations = Array.from(new Set(situations)).slice(0, 3);
    const topStrats = Array.from(helpfulStrategies).filter((st) => st && st !== 'none');

    // Build synthesized reflection
    const analysisParts: string[] = [];

    if (uniqueSituations.length > 0) {
      analysisParts.push(
        `• **Recurring Situations**: In your check-ins, your reflections frequently center around *${uniqueSituations.join(
          '*, *'
        )}*.`
      );
    }

    if (topStrats.length > 0) {
      analysisParts.push(
        `• **What's Been Effective**: When stress rose, turning to **${topStrats.join(
          '** and **'
        )}** reliably produced 'helpful' or 'better' outcomes.`
      );
    }

    if (experiments.length > 0) {
      analysisParts.push(
        `• **Active Experiment**: You are currently exploring: *"${experiments[0]}"*.`
      );
    }

    if (assessmentSummary) {
      analysisParts.push(`• **Recent Assessment**: ${assessmentSummary}`);
    }

    return (
      `Looking closely at your recorded reflections and check-ins, here are the key patterns that emerge:\n\n` +
      analysisParts.join('\n\n') +
      `\n\nConnecting this to what you just shared ("${userMsg.slice(0, 80)}${
        userMsg.length > 80 ? '...' : ''
      }"): ` +
      (topStrats.length > 0
        ? `would experimenting with something like a **${topStrats[0]}** or taking a small pause help create some breathing room right now? What feels most doable in this moment?`
        : `what is one small action or micro-experiment that might give you some clarity today?`)
    );
  }

  // Fallback when no context data is shared
  return (
    "I'm here to reflect alongside you. Currently, no personal check-in or experiment records are shared with me (you can enable AI Context Sharing in Profile → Settings to let me analyze your trends).\n\n" +
    `Thinking about what you just shared: what feels like the most demanding part of this right now, and what has helped you find a little calm in similar moments before?`
  );
}
