// lib/assessments/definitions.ts
// Clearly labeled, NON-DIAGNOSTIC self-reflection questionnaires with actionable next steps.

export interface Q {
  id: string;
  text: string;
  options: { value: string; label: string; weight: number }[];
}

export interface AssessmentActionPlan {
  tier: 'low' | 'moderate' | 'high';
  tierLabel: string;
  headline: string;
  exactSteps: string[];
  recommendedStrategy: {
    name: string;
    category: string;
    why: string;
  };
  suggestedExperiment: {
    question: string;
    strategy: string;
    baseline: string;
  };
  studioActivity?: {
    name: string;
    path: string;
    description: string;
  };
  mentoraPrompt: string;
}

export interface AssessmentDef {
  id: string;
  title: string;
  category: string;
  estMinutes: number;
  version: string;
  purpose: string;
  limitations: string;
  source: string;
  questions: Q[];
  interpretation: (score: number, max: number) => string;
  actionPlan: (score: number, max: number) => AssessmentActionPlan;
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
        return `Over the recent period you reported relatively low perceived stress (${s} of ${max}). Your current strategies are providing healthy buffering.`;
      if (p < 67)
        return `You reported a moderate level of perceived stress (${s} of ${max}). Specific study or social situations are likely causing acute friction.`;
      return `You reported frequent perceived stress (${s} of ${max}). This is a strong signal to slow down, protect your energy boundaries, and reduce immediate academic friction.`;
    },
    actionPlan: (s, max) => {
      const p = Math.round((s / max) * 100);
      if (p >= 67) {
        return {
          tier: 'high',
          tierLabel: 'High Perceived Stress — Immediate Reset',
          headline: 'Your nervous system is carrying heavy acute load. Take these 4 exact steps right now:',
          exactSteps: [
            'Immediate Autonomic Reset: Step away from all study materials and do 3 minutes of Box Breathing in the Studio to downregulate cortisol.',
            'Single Micro-Action: Pick the single most overwhelming project and write down only the next 10-minute micro-step. Put the rest of the list out of sight.',
            'Physical Movement Break: Go for a 10-minute walk outdoors with zero audio/screen stimulation to release muscle tension.',
            'Boundary Triage: Postpone or decline at least one non-essential commitment or social demand over the next 24 hours.',
          ],
          recommendedStrategy: {
            name: 'Short walk',
            category: 'Movement breaks',
            why: 'Stepping outside physically interrupts cognitive overload and triggers parasympathetic recovery.',
          },
          suggestedExperiment: {
            question: 'Does taking a 10-minute walk before starting homework reduce afternoon stress spikes?',
            strategy: 'Short walk',
            baseline: 'I usually stay glued to my desk feeling paralyzed and exhausted.',
          },
          studioActivity: {
            name: 'Box Breathing Studio',
            path: '/app/studio',
            description: '4-second inhale, 4-second hold, 4-second exhale, 4-second hold.',
          },
          mentoraPrompt: `I just completed the Perceived Stress assessment with a high score of ${s}/${max}. Looking at my recent check-ins, what specific situations are driving this, and what is one small thing I should do right now?`,
        };
      }
      if (p >= 34) {
        return {
          tier: 'moderate',
          tierLabel: 'Moderate Stress — Strategic Buffering',
          headline: 'You have manageable baseline stress, but certain task clusters cause fatigue. Follow these exact steps:',
          exactSteps: [
            'Break Big Tasks into 25-min Sprints: Use the Pomodoro technique with mandatory 5-minute non-screen breaks.',
            'Map Your Triggers: Check your Personal Response Map to identify which specific course or deadline is generating the friction.',
            'Pre-Study Breathing Pause: Practice 2 minutes of measured breathing before opening lecture slides or study textbooks.',
          ],
          recommendedStrategy: {
            name: 'Break it down',
            category: 'Planning & task breakdown',
            why: 'Decomposing large study goals into bite-sized 10-minute chunks eliminates task aversion.',
          },
          suggestedExperiment: {
            question: 'Does writing down the next 3 micro-actions before study sessions reduce procrastination?',
            strategy: 'Break it down',
            baseline: 'I spend 20 minutes dreading starting my assignments.',
          },
          studioActivity: {
            name: 'Calm Breathing Studio',
            path: '/app/studio',
            description: '4s inhale, 6s exhale relaxation cycle.',
          },
          mentoraPrompt: `I scored a moderate ${s}/${max} on Perceived Stress. What strategies in my playbook have given me the best outcomes when facing study pressure?`,
        };
      }
      return {
        tier: 'low',
        tierLabel: 'Low Stress — Maintenance & Anchoring',
        headline: 'Your current rhythm is supportive and resilient. Anchor your success with these steps:',
        exactSteps: [
          'Document What Worked: Write an entry in your Private Journal noting what routines or boundaries kept you feeling balanced this week.',
          'Bank Your Energy: Maintain regular sleep and hydration so you stay resilient when finals or larger deadlines approach.',
          'Support a Peer: Check in on a friend or study buddy who might be carrying high academic pressure.',
        ],
        recommendedStrategy: {
          name: 'Breathing',
          category: 'Breathing',
          why: 'Regular brief breath pauses maintain autonomic stability even during heavy study weeks.',
        },
        suggestedExperiment: {
          question: 'Does keeping a consistent 15-minute morning review routine preserve low stress throughout the day?',
          strategy: 'Morning review',
          baseline: 'I usually jump straight into emails and messages upon waking.',
        },
        mentoraPrompt: `My stress levels are currently low (${s}/${max}). How can I use this period of clarity to set up good study habits for the upcoming weeks?`,
      };
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
      `You reported ${s} of ${max} on routine consistency. Small, regular habits are far more effective than massive overnight overhauls.`,
    actionPlan: (s, max) => {
      const p = Math.round((s / max) * 100);
      const isLow = p < 50;
      return {
        tier: isLow ? 'high' : 'moderate',
        tierLabel: isLow ? 'Irregular Sleep Patterns — Circuit Breaker' : 'Developing Sleep Rhythm',
        headline: isLow
          ? 'Your sleep rhythm is disrupted, which multiplies daytime fatigue. Implement these exact changes starting tonight:'
          : 'Your sleep habits are decent, with room for restorative optimization:',
        exactSteps: [
          'Digital Sunset at 30 Minutes: Charge your phone outside arm’s reach 30 minutes before your planned sleep time.',
          'Anchor Your Wake Time: Set an alarm for the exact same hour tomorrow morning, regardless of when you sleep tonight.',
          'Morning Sunlight: Step into outside natural light for 10 minutes within 30 minutes of waking to set your circadian clock.',
          'Zero Study in Bed: Reserve your bed strictly for sleep so your brain associates it with recovery rather than exam stress.',
        ],
        recommendedStrategy: {
          name: 'Rest',
          category: 'Sleep & routines',
          why: 'A wind-down buffer clears residual study anxiety before your head hits the pillow.',
        },
        suggestedExperiment: {
          question: 'Does keeping my phone across the room 30 minutes before bed help me fall asleep faster?',
          strategy: 'Digital sunset',
          baseline: 'I scroll social media or read notes in bed for over an hour before sleeping.',
        },
        studioActivity: {
          name: 'Sleep Wind-Down Breathing',
          path: '/app/studio',
          description: 'Slow 4-7-8 breathing pattern designed to induce drowsiness.',
        },
        mentoraPrompt: `I scored ${s}/${max} on Sleep & Routines. How does my sleep consistency correlate with my mood in my check-ins?`,
      };
    },
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
      `Energy self-score ${s} of ${max}. Pair this with your check-ins to see what situations drain or restore your focus.`,
    actionPlan: (s, max) => ({
      tier: s <= 4 ? 'high' : 'moderate',
      tierLabel: s <= 4 ? 'Low Daytime Energy — Action Protocol' : 'Moderate Energy Stability',
      headline: 'Low mental stamina is usually rooted in task initiation friction and continuous screen drain. Do these exact steps:',
      exactSteps: [
        'The 2-Minute Physical Startup: Stand up, drink a large glass of water, and stretch before sitting down to work.',
        'The 5-Minute Permission Rule: Tell yourself you only have to work on the task for 5 minutes. If you still want to stop, you may.',
        'Mid-Afternoon Movement Break: When you hit a mental slump around 3 PM, take a brisk 8-minute walk instead of reaching for caffeine.',
      ],
      recommendedStrategy: {
        name: 'Short walk',
        category: 'Movement breaks',
        why: 'Physical movement circulates oxygen and rapidly resets cognitive attention.',
      },
      suggestedExperiment: {
        question: 'Does stepping outside for 5 minutes between study blocks reduce afternoon brain fog?',
        strategy: 'Short walk',
        baseline: 'I stare at my laptop screen while feeling sluggish and unmotivated.',
      },
      studioActivity: {
        name: 'Energizing Breath Studio',
        path: '/app/studio',
        description: 'Brisk, rhythm-resetting breathwork.',
      },
      mentoraPrompt: `My energy score is ${s}/${max}. What situations in my response map drain my energy the fastest, and what strategies helped me bounce back?`,
    }),
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
      `Coping self-reflection ${s} of ${max}. Your Playbook and experiments are designed to turn “I sometimes cope” into “here is what reliably works for me.”`,
    actionPlan: (s, max) => ({
      tier: s <= 6 ? 'high' : 'moderate',
      tierLabel: s <= 6 ? 'Building Your Coping Arsenal' : 'Refining Coping Effectiveness',
      headline: 'Strengthen your emotional toolkit with these exact actionable steps:',
      exactSteps: [
        'Star 2 Default Strategies in Playbook: Go to your Playbook and favorite "Short walk" and "Breathing" so you don’t have to make decisions during high stress.',
        'Name It to Tame It: When tension rises, spend 30 seconds writing your exact feeling into your Journal before acting.',
        'Log Immediate Strategy Outcomes: After trying any calming tactic, complete a quick check-in to confirm if the result was "better" or "helpful".',
      ],
      recommendedStrategy: {
        name: 'Breathing',
        category: 'Breathing',
        why: 'A pre-practiced breath cycle creates an immediate psychological pause during acute distress.',
      },
      suggestedExperiment: {
        question: 'Does logging a check-in immediately when feeling overwhelmed help me choose a better response?',
        strategy: 'Check-in reflection',
        baseline: 'I usually react impulsively or shut down when stress spikes.',
      },
      mentoraPrompt: `I scored ${s}/${max} on Coping & Resilience. Based on my logged strategies, which ones have had the highest success rate in my check-ins?`,
    }),
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
      `Life-balance reflection ${s} of ${max}. No single score defines you — look at which area is lowest and design one small experiment around it.`,
    actionPlan: (s, max) => ({
      tier: s <= 6 ? 'high' : 'moderate',
      tierLabel: s <= 6 ? 'Rebalancing Priorities' : 'Healthy Balance Maintenance',
      headline: 'Restore harmony across your academic and personal life with these exact steps:',
      exactSteps: [
        'Protect 1 Guilt-Free Hour: Schedule 60 continuous minutes today dedicated strictly to relaxation, hobbies, or music with zero study guilt.',
        'Reach Out to One Friend: Send a quick message or phone a close friend for a 10-minute check-in today.',
        'Weekly Boundary Review: Review your upcoming week and block out designated recovery windows before exam prep fills the entire calendar.',
      ],
      recommendedStrategy: {
        name: 'Rest',
        category: 'Sleep & routines',
        why: 'Scheduled non-academic downtime rejuvenates mental endurance for tough study blocks.',
      },
      suggestedExperiment: {
        question: 'Does blocking 1 hour of non-study hobby time each evening make me more focused during the day?',
        strategy: 'Protected downtime',
        baseline: 'I study constantly with frequent low-quality distractions throughout the night.',
      },
      mentoraPrompt: `I scored ${s}/${max} on Life Balance. How can I balance my midterms and academic deadlines without burning out?`,
    }),
  },
];

export const byId = (id: string) => ASSESSMENTS.find((a) => a.id === id);
