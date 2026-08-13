// Core TypeScript model interfaces mirroring the Java backend entities

export interface SubTopic {
  id: number;
  name: string;
  isCompleted: boolean;
}

export interface SyllabusCategory {
  id: number;
  part: 'A' | 'B' | 'C' | 'D';
  name: string;
  totalMarks: number;
  negativeMarking: boolean;
  subTopics: SubTopic[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficultyEstimate?: 'EASY' | 'MEDIUM' | 'HARD';
  topicName?: string;
  verificationStatus?: string;
  // correctOption is NOT sent by backend during active quiz (anti-cheat)
  correctOption?: string;
}

export interface QuizSession {
  id: number;
  mockMode: 'BALANCED_DIAGNOSTIC' | 'OFFICIAL_FORMAT' | 'PRACTICE';
  sessionStatus: 'IN_PROGRESS' | 'SUBMITTED';
  analysisStatus: 'ANALYSIS_PENDING' | 'COMPLETED';
  startedAt: string;
  completedAt?: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  rawScore: number;
  accuracyPct: number;
  durationSeconds: number;
  weakTopicsJson: string;
  version: number;
}

export interface QuizStartRequest {
  mockMode: string;
  questionPool?: string;
}

export interface QuizStartResponse {
  sessionId: number;
  mockMode: string;
  totalQuestions: number;
  questions: Question[];
  version: number;
}

export interface QuizAnswerRequest {
  questionId: number;
  selectedOption?: string;
  isGuess?: boolean;
  isSkipped?: boolean;
  confidenceLevel?: string;
  timeSpentSeconds?: number;
}

export interface QuizSubmitRequest {
  version?: number;
  answers: QuizAnswerRequest[];
}

export interface ErrorClassificationRequest {
  answerId: number;
  errorType: string;
  reviewNote?: string;
}

export interface ErrorClassificationPayload {
  classifications: ErrorClassificationRequest[];
}

export interface DailyLog {
  id: number;
  logDate: string;
  questionsAttempted: number;
  correctAnswers: number;
  score: number;
  accuracyPct: number;
  studyTimeMinutes: number;
  weakTopicsJson: string;
}

export interface PartProgress {
  total: number;
  completed: number;
  pct: number;
}

export interface ProgressOverview {
  partA: PartProgress;
  partB: PartProgress;
  partC: PartProgress;
  partD: PartProgress;
}

export interface DashboardSummary {
  totalSessions: number;
  averageScore: number;
  averageAccuracy: number;
  syllabusCompletionPct: number;
  recentSessions: { id: number; score: number; accuracy: number; date: string }[];
}

export interface IngestionResult {
  message: string;
  count: number;
  savedIds?: number[];
}

// Countdown timer tick
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}
