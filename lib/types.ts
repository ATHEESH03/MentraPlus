// lib/types.ts — single source of truth for documents.
export type Mood =
  | 'calm'
  | 'content'
  | 'anxious'
  | 'overwhelmed'
  | 'low'
  | 'tired'
  | 'irritated'
  | 'focused'
  | 'other';

export type Outcome = 'helpful' | 'better' | 'no-change' | 'worse' | 'unhelpful' | 'uncertain';
export type ExperimentStatus = 'planned' | 'active' | 'paused' | 'completed' | 'dropped';
export type InsightStatus =
  | 'emerging'
  | 'supported'
  | 'reviewed'
  | 'confirmed'
  | 'dismissed'
  | 'contradicted'
  | 'changing';

export interface Preferences {
  goals: string[];
  areas: string[];
  reflectionStyle: 'guided' | 'free' | 'balanced';
  aiContextSharing: {
    enabled: boolean;
    includeCheckIns: boolean;
    includeJournal: boolean;
    includeExperiments: boolean;
    includeAssessments: boolean;
    includeInsights: boolean;
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  handle: string;
  createdAt: number;
  preferences: Preferences;
  deleted?: boolean;
}

export interface CheckIn {
  id: string;
  mood: Mood;
  intensity?: number;
  energy: number;
  stress: number;
  situation: string;
  contextTags: string[];
  thought?: string;
  strategiesUsed: string[];
  outcome: Outcome;
  createdAt: number;
  updatedAt?: number;
}

export interface JournalEntry {
  id: string;
  title?: string;
  body: string;
  tags: string[];
  linkedIds: string[];
  aiSummary?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  version: string;
  responses: Record<string, string>;
  score?: number;
  interpretation?: string;
  completedAt: number;
}

export interface Experiment {
  id: string;
  question: string;
  context: string;
  strategy: string;
  attemptsPlanned?: number;
  baseline?: string;
  status: ExperimentStatus;
  notes?: string;
  createdAt: number;
  completedAt?: number;
  updatedAt?: number;
}

export interface Attempt {
  id: string;
  note?: string;
  outcome: Outcome;
  before?: string;
  after?: string;
  createdAt: number;
}

export interface Strategy {
  id: string;
  name: string;
  category: string;
  notes?: string;
  favorite: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface EvidenceRef {
  type: 'checkIn' | 'experiment';
  id: string;
}

export interface Insight {
  id: string;
  key: string;
  title: string;
  body: string;
  evidence: EvidenceRef[];
  supporting: number;
  total: number;
  status: InsightStatus;
  userNote?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  fallback?: boolean;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  earnedAt: number;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorHandle: string;
  body: string;
  topic: string;
  createdAt: number;
  updatedAt?: number;
  likeCount: number;
  deleted?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorHandle: string;
  body: string;
  createdAt: number;
}
