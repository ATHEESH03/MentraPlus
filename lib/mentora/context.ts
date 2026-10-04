// lib/mentora/context.ts — comprehensive, user-authorized context synthesis.
import { db, firebaseConfigured } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import {
  UserProfile,
  CheckIn,
  Experiment,
  Attempt,
  Strategy,
  JournalEntry,
  AssessmentResult,
  Insight,
} from '@/lib/types';

export interface UserContextData {
  profile?: {
    displayName?: string;
    goals?: string[];
    areas?: string[];
    reflectionStyle?: string;
  };
  checkIns?: CheckIn[];
  experiments?: (Experiment & { attempts?: Attempt[] })[];
  strategies?: Strategy[];
  journal?: JournalEntry[];
  assessments?: AssessmentResult[];
  insights?: Insight[];
}

export function formatContextFromData(
  data: UserContextData,
  prefs: UserProfile['preferences']
): { text: string; hasData: boolean } {
  if (!prefs?.aiContextSharing?.enabled) {
    return { text: '', hasData: false };
  }

  const sections: string[] = [];

  // 1. Profile, Goals & Reflection Style
  const profileParts: string[] = [];
  if (data.profile?.displayName) profileParts.push(`Student: ${data.profile.displayName}`);
  if (data.profile?.goals?.length) profileParts.push(`Stated Goals: ${data.profile.goals.join('; ')}`);
  if (data.profile?.areas?.length) profileParts.push(`Focus Areas: ${data.profile.areas.join(', ')}`);
  if (data.profile?.reflectionStyle) {
    profileParts.push(`Preferred Reflection Style: ${data.profile.reflectionStyle} (tailor your tone accordingly)`);
  }
  if (profileParts.length > 0) {
    sections.push(`[Student Profile & Goals]\n${profileParts.join('\n')}`);
  }

  // 2. Check-Ins (Mood, Situation, Intensity, Energy, Stress, Strategies, Outcome, Thought)
  if (prefs.aiContextSharing.includeCheckIns && data.checkIns && data.checkIns.length > 0) {
    const ciLines = data.checkIns.slice(0, 8).map((c) => {
      const dateStr = new Date(c.createdAt).toLocaleDateString();
      const stressInfo = c.stress !== undefined ? `stress=${c.stress}/100` : '';
      const energyInfo = c.energy !== undefined ? `energy=${c.energy}/100` : '';
      const metrics = [stressInfo, energyInfo].filter(Boolean).join(', ');
      const strats = (c.strategiesUsed || []).length > 0 ? c.strategiesUsed.join(', ') : 'none';
      const thoughtStr = c.thought ? ` | Reflection note: "${c.thought}"` : '';
      return `- [${dateStr}] Mood: ${c.mood}${metrics ? ` (${metrics})` : ''} | Situation: ${c.situation}${thoughtStr} | Strategies tried: [${strats}] -> Outcome: ${c.outcome}`;
    });
    sections.push(`[Recent Check-Ins (Mood, Stress & Situations)]\n${ciLines.join('\n')}`);
  }

  // 3. Experiments & Attempts
  if (prefs.aiContextSharing.includeExperiments && data.experiments && data.experiments.length > 0) {
    const expLines = data.experiments.slice(0, 4).map((e) => {
      let line = `- Experiment: "${e.question}" (Status: ${e.status}, Strategy: ${e.strategy})`;
      if (e.baseline) line += `\n  Baseline: ${e.baseline}`;
      if (e.attempts && e.attempts.length > 0) {
        const attStrs = e.attempts.slice(0, 4).map(
          (a, i) =>
            `    Attempt ${i + 1}: outcome=${a.outcome}${a.note ? ` ("${a.note}")` : ''}${
              a.after ? ` (after: "${a.after}")` : ''
            }`
        );
        line += `\n  Logged Attempts:\n${attStrs.join('\n')}`;
      }
      return line;
    });
    sections.push(`[Active & Recent Self-Experiments]\n${expLines.join('\n')}`);
  }

  // 4. Saved Strategies
  if (data.strategies && data.strategies.length > 0) {
    const stratLines = data.strategies.slice(0, 6).map((s) => {
      return `- ${s.name} (${s.category})${s.favorite ? ' ★ Favorite' : ''}${s.notes ? `: ${s.notes}` : ''}`;
    });
    sections.push(`[Student Strategies Library]\n${stratLines.join('\n')}`);
  }

  // 5. Journal Entries
  if (prefs.aiContextSharing.includeJournal && data.journal && data.journal.length > 0) {
    const jLines = data.journal.slice(0, 3).map((j) => {
      const dateStr = new Date(j.createdAt).toLocaleDateString();
      const title = j.title ? `"${j.title}"` : 'Untitled Entry';
      const excerpt = j.body.length > 200 ? j.body.slice(0, 200) + '...' : j.body;
      return `- [${dateStr}] ${title}: "${excerpt}" (tags: ${j.tags?.join(', ') || 'none'})`;
    });
    sections.push(`[Personal Journal Reflections]\n${jLines.join('\n')}`);
  }

  // 6. Assessments
  if (prefs.aiContextSharing.includeAssessments && data.assessments && data.assessments.length > 0) {
    const aLines = data.assessments.slice(0, 3).map((a) => {
      const dateStr = new Date(a.completedAt).toLocaleDateString();
      return `- [${dateStr}] Assessment: ${a.assessmentId} (Score: ${a.score ?? 'N/A'})\n  Interpretation: ${a.interpretation || 'Completed'}`;
    });
    sections.push(`[Recent Wellbeing Assessments]\n${aLines.join('\n')}`);
  }

  // 7. Derived Insights
  if (prefs.aiContextSharing.includeInsights && data.insights && data.insights.length > 0) {
    const insLines = data.insights.slice(0, 4).map((i) => {
      return `- Insight (${i.status}): ${i.title}\n  Summary: ${i.body || 'Observed correlation in response data.'}`;
    });
    sections.push(`[Derived Response Insights]\n${insLines.join('\n')}`);
  }

  const text = sections.join('\n\n');
  return { text, hasData: sections.length > 0 };
}

export async function buildContext(
  uid: string,
  prefs: UserProfile['preferences'],
  convId?: string,
  historyLimit = 12
): Promise<{ text: string; hasData: boolean }> {
  if (!prefs?.aiContextSharing?.enabled || !firebaseConfigured) {
    return { text: '', hasData: false };
  }

  try {
    const data: UserContextData = {
      profile: {
        goals: prefs.goals,
        areas: prefs.areas,
        reflectionStyle: prefs.reflectionStyle,
      },
      checkIns: [],
      experiments: [],
      strategies: [],
      journal: [],
      assessments: [],
      insights: [],
    };

    if (prefs.aiContextSharing.includeCheckIns) {
      const s = await getDocs(
        query(collection(db, 'users', uid, 'checkIns'), orderBy('createdAt', 'desc'), limit(8))
      );
      data.checkIns = s.docs.map((d) => d.data() as CheckIn);
    }

    if (prefs.aiContextSharing.includeExperiments) {
      const s = await getDocs(
        query(collection(db, 'users', uid, 'experiments'), orderBy('createdAt', 'desc'), limit(4))
      );
      const exps = s.docs.map((d) => ({ ...d.data(), id: d.id } as Experiment));
      const expsWithAttempts = await Promise.all(
        exps.map(async (exp) => {
          try {
            const attSnap = await getDocs(
              query(
                collection(db, 'users', uid, 'experiments', exp.id, 'attempts'),
                orderBy('createdAt', 'desc'),
                limit(4)
              )
            );
            const attempts = attSnap.docs.map((ad) => ad.data() as Attempt);
            return { ...exp, attempts };
          } catch {
            return exp;
          }
        })
      );
      data.experiments = expsWithAttempts;
    }

    // Strategies
    try {
      const stratSnap = await getDocs(
        query(collection(db, 'users', uid, 'strategies'), orderBy('createdAt', 'desc'), limit(6))
      );
      data.strategies = stratSnap.docs.map((d) => d.data() as Strategy);
    } catch {}

    if (prefs.aiContextSharing.includeJournal) {
      try {
        const jSnap = await getDocs(
          query(collection(db, 'users', uid, 'journalEntries'), orderBy('createdAt', 'desc'), limit(3))
        );
        data.journal = jSnap.docs.map((d) => d.data() as JournalEntry);
      } catch {}
    }

    if (prefs.aiContextSharing.includeAssessments) {
      try {
        const aSnap = await getDocs(
          query(collection(db, 'users', uid, 'assessmentResults'), orderBy('completedAt', 'desc'), limit(3))
        );
        data.assessments = aSnap.docs.map((d) => d.data() as AssessmentResult);
      } catch {}
    }

    if (prefs.aiContextSharing.includeInsights) {
      try {
        const iSnap = await getDocs(
          query(collection(db, 'users', uid, 'insights'), orderBy('createdAt', 'desc'), limit(4))
        );
        data.insights = iSnap.docs.map((d) => d.data() as Insight);
      } catch {}
    }

    return formatContextFromData(data, prefs);
  } catch (err) {
    console.warn('buildContext error:', err);
    return { text: '', hasData: false };
  }
}
