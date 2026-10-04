// lib/data/localStore.ts — robust offline fallback storage when Firebase is not configured
import {
  CheckIn,
  Experiment,
  Attempt,
  Strategy,
  JournalEntry,
  CommunityPost,
  AssessmentResult,
  Insight,
  UserProfile,
} from '@/lib/types';

export const DEMO_UID = 'demo-student-01';

export const DEMO_PROFILE: UserProfile = {
  uid: DEMO_UID,
  displayName: 'Alex Rivera',
  handle: 'alex-rivera',
  createdAt: Date.now() - 7 * 86400000,
  preferences: {
    goals: ['Understanding personal patterns', 'Exploring academic pressure'],
    areas: ['Study', 'Sleep', 'Energy'],
    reflectionStyle: 'balanced',
    aiContextSharing: {
      enabled: true,
      includeCheckIns: true,
      includeJournal: false,
      includeExperiments: true,
      includeAssessments: false,
      includeInsights: true,
    },
  },
};

const SEED_CHECKINS: CheckIn[] = [
  {
    id: 'ci-1',
    situation: 'Academic pressure',
    mood: 'overwhelmed',
    intensity: 85,
    energy: 40,
    stress: 85,
    contextTags: ['Study'],
    thought: 'Three midterms next week, felt paralyzed on where to start.',
    strategiesUsed: ['Short walk', 'Breathing'],
    outcome: 'helpful',
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'ci-2',
    situation: 'Late night study session',
    mood: 'tired',
    intensity: 65,
    energy: 25,
    stress: 60,
    contextTags: ['Study', 'Sleep'],
    thought: 'Stared at my screen for 3 hours with diminishing focus.',
    strategiesUsed: ['Short walk'],
    outcome: 'better',
    createdAt: Date.now() - 4 * 86400000,
  },
  {
    id: 'ci-3',
    situation: 'Group project meeting',
    mood: 'anxious',
    intensity: 60,
    energy: 55,
    stress: 50,
    contextTags: ['Social', 'Study'],
    thought: 'Unclear role expectations made me second-guess myself.',
    strategiesUsed: ['Break it down', 'Short walk'],
    outcome: 'helpful',
    createdAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'ci-4',
    situation: 'Morning review',
    mood: 'focused',
    intensity: 70,
    energy: 75,
    stress: 35,
    contextTags: ['Study'],
    thought: 'Taking a 10-minute walk before opening books settled my mind.',
    strategiesUsed: ['Short walk'],
    outcome: 'helpful',
    createdAt: Date.now() - 1 * 86400000,
  },
];

const SEED_EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-1',
    question: 'Does a 10-minute walk help reduce brain fog after studying?',
    context: 'Late afternoon study sessions',
    strategy: 'Short walk',
    attemptsPlanned: 4,
    baseline: 'Usually I stay at my desk, scroll my phone, and feel drained for the rest of the evening.',
    status: 'active',
    createdAt: Date.now() - 5 * 86400000,
  },
];

const SEED_ATTEMPTS: Attempt[] = [
  {
    id: 'exp-1_att-1',
    outcome: 'helpful',
    before: 'Heavy eyes after 2hr reading',
    after: 'Refreshed, head felt clearer',
    note: 'Walked 10 mins around the campus quad without headphones.',
    createdAt: Date.now() - 4 * 86400000,
  },
  {
    id: 'exp-1_att-2',
    outcome: 'better',
    before: 'Restless and stuck on a coding problem',
    after: 'Thought of a new angle to try',
    note: 'Stepped outside for fresh air when stuck.',
    createdAt: Date.now() - 2 * 86400000,
  },
];

const SEED_STRATEGIES: Strategy[] = [
  {
    id: 'str-1',
    name: 'Short walk',
    category: 'Movement breaks',
    notes: '10 minutes outdoors without phone.',
    favorite: true,
    createdAt: Date.now() - 6 * 86400000,
  },
  {
    id: 'str-2',
    name: 'Breathing',
    category: 'Breathing',
    notes: '4-second inhale, 4-second exhale cycle.',
    favorite: true,
    createdAt: Date.now() - 6 * 86400000,
  },
  {
    id: 'str-3',
    name: 'Break it down',
    category: 'Planning & task breakdown',
    notes: 'Write the very next 10-minute micro-action.',
    favorite: false,
    createdAt: Date.now() - 5 * 86400000,
  },
];

const SEED_JOURNAL: JournalEntry[] = [
  {
    id: 'j-1',
    title: 'Midterm week reflections',
    body: 'Felt much more in control today after testing the 10-minute walk idea. Realized that pausing before panic sets in is the most critical window.',
    tags: ['study', 'walk', 'insight'],
    linkedIds: ['ci-1'],
    createdAt: Date.now() - 3 * 86400000,
  },
];

const SEED_COMMUNITY: CommunityPost[] = [
  {
    id: 'post-1',
    authorId: 'user-other-1',
    authorHandle: 'campus-wanderer',
    topic: 'Academic pressure',
    body: 'Setting a 25-minute timer and stepping outside for 5 minutes made a huge difference during midterm week.',
    likeCount: 5,
    createdAt: Date.now() - 2 * 86400000,
    deleted: false,
  },
  {
    id: 'post-2',
    authorId: 'user-other-2',
    authorHandle: 'quiet-learner',
    topic: 'Small wins',
    body: 'Finally kept my sleep schedule consistent for 4 nights in a row. Small win, but proud of it.',
    likeCount: 8,
    createdAt: Date.now() - 1 * 86400000,
    deleted: false,
  },
];

const SEED_ASSESSMENTS: AssessmentResult[] = [
  {
    id: 'ar-1',
    assessmentId: 'perceived-stress',
    version: 'v1',
    responses: { q1: '3', q2: '3', q3: '2', q4: '2', q5: '3' },
    score: 12,
    interpretation: 'You reported a moderate level of perceived stress (12 of 20). Consider which situations in your Response Map cluster around it.',
    completedAt: Date.now() - 4 * 86400000,
  },
];

export function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(`mentra_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`mentra_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage set failed:', e);
  }
}

export function initLocalStore() {
  if (typeof window === 'undefined') return;
  if (!window.localStorage.getItem('mentra_initialized')) {
    setLocal('checkIns', SEED_CHECKINS);
    setLocal('experiments', SEED_EXPERIMENTS);
    setLocal('attempts', SEED_ATTEMPTS);
    setLocal('strategies', SEED_STRATEGIES);
    setLocal('journal', SEED_JOURNAL);
    setLocal('community', SEED_COMMUNITY);
    setLocal('assessments', SEED_ASSESSMENTS);
    setLocal('profile', DEMO_PROFILE);
    window.localStorage.setItem('mentra_initialized', 'true');
  }
}
