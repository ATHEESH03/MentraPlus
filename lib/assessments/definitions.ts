// lib/assessments/definitions.ts
// These are clearly labeled, NON-DIAGNOSTIC self-reflection questionnaires.
// None are presented as validated clinical instruments. Each states purpose + limitations.
export interface Q {
  id: string;
  text: string;
  options: { value: string; label: string; weight: number }[];
}

export interface AssessmentDef {
  id: string;
  title: string;
  category: string;
  estMinutes: number;
  version: string;
  purpose: string;
  limitations: string;
  source: string; // 'Mentra+ self-reflection (not validated)'
  questions: Q[];
  interpretation: (score: number, max: number) => string;
}

const likert = (id: string, weight: number) => [
  { value: '1', label: 'Not at all this week', weight: 0 },
  { value: '2', label: 'A few days', weight: 1 },
  { value: '3', label: 'Several days', weight: 2 },
  { value: '4', label: 'More than half the days', weight: 3 },
  { value: '5', label: 'Nearly every day', weight: 4 },
];

export const ASSESSMENTS: AssessmentDef[] = [
  {
    id: 'perceived-stress',
    title: 'Perceived Stress',
    category: 'Perceived stress',
    estMinutes: 3,
    version: 'v1',
    purpose:
      'A short self-reflection on how pressured and stretched you feel. It describes your experience; it does not diagnose anything.',
    limitations:
      'Self-report only. Items are relabeled from a common stress self-report format and have NOT been clinically validated or normed. A higher total simply means more days you noticed stress — it is not a risk score.',
    source: 'Mentra+ self-reflection (not a validated instrument)',
    questions: [
      {
        id: 'q1',
        text: 'How often have you felt you could not control important things in your life?',
        options: likert('q1', 0),
      },
      {
        id: 'q2',
        text: 'How often have you felt nervous or stressed?',
        options: likert('q2', 0),
      },
      {
        id: 'q3',
        text: 'How often have you felt confident about handling personal problems?',
        options: likert('q3', 0).map((o) => ({ ...o, weight: 4 - o.weight })),
      },
      {
        id: 'q4',
        text: 'How often have you felt that things were going your way?',
        options: likert('q4', 0).map((o) => ({ ...o, weight: 4 - o.weight })),
      },
      {
        id: 'q5',
        text: 'How often have you been upset by things you cannot change?',
        options: likert('q5', 0),
      },
    ],
    interpretation: (s, max) => {
      const p = Math.round((s / max) * 100);
      if (p < 34)
        return `Over the recent period you reported relatively low perceived stress (${s} of ${max}). Keep doing what is working.`;
      if (p < 67)
        return `You reported a moderate level of perceived stress (${s} of ${max}). Consider which situations in your Response Map cluster around it.`;
      return `You reported frequent perceived stress (${s} of ${max}). This is a signal to be kind to yourself and consider support, not a diagnosis.`;
    },
  },
  {
    id: 'sleep-routines',
    title: 'Sleep & Daily Routines',
    category: 'Sleep habits',
    estMinutes: 2,
    version: 'v1',
    purpose: 'Self-reflection on sleep consistency and daily rhythm. Descriptive only.',
    limitations: 'Not a sleep study and not validated. Useful only as a personal trend, not a clinical measure.',
    source: 'Mentra+ self-reflection (not a validated instrument)',
    questions: [
      {
        id: 'q1',
        text: 'How consistently did you fall asleep on a similar schedule?',
        options: likert('q1', 0),
      },
      {
        id: 'q2',
        text: 'How often did you wake up feeling rested?',
        options: likert('q2', 0),
      },
      {
        id: 'q3',
        text: 'How often did screens or stress interfere with falling asleep?',
        options: likert('q3', 0),
      },
    ],
    interpretation: (s, max) =>
      `You reported ${s} of ${max} on routine consistency. Small, regular changes (see Playbook: Rest & routines) are often more useful than big overhauls.`,
  },
  {
    id: 'energy-functioning',
    title: 'Energy & Daily Functioning',
    category: 'Energy',
    estMinutes: 2,
    version: 'v1',
    purpose: 'Self-reflection on everyday energy and the ability to keep up with studies and self-care.',
    limitations: 'Not a medical or fatigue assessment. Track it for personal trends only.',
    source: 'Mentra+ self-reflection (not a validated instrument)',
    questions: [
      {
        id: 'q1',
        text: 'How often did you have enough energy to get through your day?',
        options: likert('q1', 0),
      },
      {
        id: 'q2',
        text: 'How often did you find it hard to start tasks you need to do?',
        options: likert('q2', 0),
      },
    ],
    interpretation: (s, max) =>
      `Energy self-score ${s} of ${max}. Pair this with your check-ins to see what situations drain or restore you.`,
  },
  {
    id: 'coping-resilience',
    title: 'Coping & Resilience Self-Reflection',
    category: 'Coping & resilience',
    estMinutes: 4,
    version: 'v1',
    purpose: 'Look at which coping strategies you reach for and how they feel afterward.',
    limitations: 'Educational reflection, not a resilience scale. Scores are your own pattern, not a clinical trait.',
    source: 'Mentra+ self-reflection (not a validated instrument)',
    questions: [
      {
        id: 'q1',
        text: 'How often do you have a strategy you can reach for when things feel heavy?',
        options: likert('q1', 0),
      },
      {
        id: 'q2',
        text: 'How often do you notice what you did actually helped you afterward?',
        options: likert('q2', 0),
      },
      {
        id: 'q3',
        text: 'How often do you let a hard moment stay unresolved instead of processing it?',
        options: likert('q3', 0),
      },
    ],
    interpretation: (s, max) =>
      `Coping self-reflection ${s} of ${max}. Your Playbook and experiments are built to turn “I sometimes cope” into “here is what works for me.”`,
  },
  {
    id: 'life-balance',
    title: 'General Wellbeing & Life Balance',
    category: 'Life balance',
    estMinutes: 3,
    version: 'v1',
    purpose: 'A broad self-check on whether work, rest, connection and meaning are roughly in balance.',
    limitations: 'Not a wellbeing diagnosis. Re-taking it over time shows your own trend, not a clinical status.',
    source: 'Mentra+ self-reflection (not a validated instrument)',
    questions: [
      {
        id: 'q1',
        text: 'How often did you feel your time was spent on things that matter to you?',
        options: likert('q1', 0),
      },
      {
        id: 'q2',
        text: 'How often did you feel connected to others in a meaningful way?',
        options: likert('q2', 0),
      },
      {
        id: 'q3',
        text: 'How often did you feel you were resting enough?',
        options: likert('q3', 0),
      },
    ],
    interpretation: (s, max) =>
      `Life-balance reflection ${s} of ${max}. No single score means you are “fine” or “not fine” — look at which area is lowest and design one small experiment around it.`,
  },
];

export const byId = (id: string) => ASSESSMENTS.find((a) => a.id === id);
