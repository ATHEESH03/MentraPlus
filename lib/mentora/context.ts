// lib/mentora/context.ts — minimal, user-authorized context only.
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserProfile, CheckIn, Experiment } from '@/lib/types';

export async function buildContext(
  uid: string,
  prefs: UserProfile['preferences'],
  convId?: string,
  historyLimit = 12
) {
  if (!prefs.aiContextSharing.enabled) return { text: '', hasData: false };

  const parts: string[] = [];
  const cap = 400;

  if (prefs.aiContextSharing.includeCheckIns) {
    const s = await getDocs(
      query(collection(db, 'users', uid, 'checkIns'), orderBy('createdAt', 'desc'), limit(6))
    );
    s.forEach((d) => {
      const c = d.data() as CheckIn;
      parts.push(
        `[check-in ${new Date(c.createdAt).toLocaleDateString()}] mood=${c.mood} situation=${
          c.situation
        } strategies=${(c.strategiesUsed || []).join(',') || 'none'} outcome=${c.outcome}`
      );
    });
  }

  if (prefs.aiContextSharing.includeExperiments) {
    const s = await getDocs(
      query(collection(db, 'users', uid, 'experiments'), orderBy('createdAt', 'desc'), limit(4))
    );
    s.forEach((d) => {
      const e = d.data() as Experiment;
      parts.push(`[experiment] ${e.question} (status ${e.status}) strategy=${e.strategy}`);
    });
  }

  const text = parts.map((p) => p.slice(0, cap)).join('\n');
  return { text, hasData: parts.length > 0 };
}
