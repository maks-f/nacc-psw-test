export type QuestionType = 'mc' | 'tf';

export interface OptionItem {
  id: string;
  textEn: string;
  textUa: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  num: number;
  type: QuestionType;
  category: string;
  questionEn: string;
  questionUa: string;
  options: OptionItem[];
  correctOptionId: string;
  explanation: string;
  howToRemember: string;
}

export interface QuestionProgress {
  questionId: number;
  viewed: boolean;
  bookmarked: boolean;
  notes?: string;
  correctCount: number;
  incorrectCount: number;
  lastAttemptDate?: string;
  lastSelectedOption?: string;
  lastResult?: 'correct' | 'incorrect';
}

export type QuestionMasteryStatus =
  | 'unanswered'
  | 'needs_review'
  | 'unstable'
  | 'improving'
  | 'mastered';

export interface OverallStats {
  totalViewed: number;
  totalAnswered: number;
  totalCorrect: number; // Mastered questions (>= 80% accuracy)
  totalIncorrect: number; // Unmastered attempted questions
  masteredCount: number;
  improvingCount: number;
  unstableCount: number;
  needsReviewCount: number;
  bookmarkedCount: number;
  streakDays: number;
  lastActiveDate: string;
}

export interface CustomGroup {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  questionIds: number[];
}

export type QuizMode = 'range' | 'failed' | 'unstable' | 'bookmarked' | 'spaced' | 'category' | 'group' | 'random';

export interface QuizConfig {
  mode: QuizMode;
  startTicket: number;
  endTicket: number;
  category?: string;
  groupId?: string;
  questionCount: number;
  shuffle: boolean;
  instantFeedback: boolean;
  showExplanations: boolean;
}

export interface QuizAnswerRecord {
  questionId: number;
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface QuizResult {
  id: string;
  date: string;
  mode: QuizMode;
  total: number;
  correct: number;
  incorrect: number;
  answers: QuizAnswerRecord[];
  timeSpentSeconds: number;
}

export interface DailyReminderSettings {
  enabled: boolean;
  time: string; // "HH:MM" 24h
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  goalType: 'tickets' | 'mistakes' | 'quiz' | 'custom';
  customMessage?: string;
  soundEnabled: boolean;
  lastNotifiedDate?: string;
}

export interface AppExportData {
  version: number;
  exportDate: string;
  progress: Record<number, QuestionProgress>;
  quizHistory: QuizResult[];
  reminderSettings: DailyReminderSettings;
  customGroups?: CustomGroup[];
}
