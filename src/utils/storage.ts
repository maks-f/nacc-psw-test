import {
  AppExportData,
  CustomGroup,
  DailyReminderSettings,
  OverallStats,
  QuestionProgress,
  QuizResult,
} from '../types';
import { getQuestionMasteryInfo } from './mastery';

const STORAGE_KEYS = {
  PROGRESS: 'nacc_question_progress_v1',
  QUIZ_HISTORY: 'nacc_quiz_history_v1',
  STREAK: 'nacc_streak_data_v1',
  REMINDERS: 'nacc_reminders_v1',
  SETTINGS: 'nacc_user_settings_v1',
  LAST_TICKET: 'nacc_last_ticket_index_v1',
  ACTIVE_TAB: 'nacc_last_active_tab_v1',
  CUSTOM_GROUPS: 'nacc_custom_groups_v1',
};

// Safe localStorage access
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('LocalStorage get failed:', e);
    return null;
  }
}

function safeSetItem(key: string, val: string): void {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    console.warn('LocalStorage set failed:', e);
  }
}

export function getProgressMap(): Record<number, QuestionProgress> {
  const raw = safeGetItem(STORAGE_KEYS.PROGRESS);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveProgressMap(map: Record<number, QuestionProgress>): void {
  safeSetItem(STORAGE_KEYS.PROGRESS, JSON.stringify(map));
}

export function getQuestionProgress(questionId: number): QuestionProgress {
  const map = getProgressMap();
  return (
    map[questionId] || {
      questionId,
      viewed: false,
      bookmarked: false,
      correctCount: 0,
      incorrectCount: 0,
    }
  );
}

export function markQuestionViewed(questionId: number): QuestionProgress {
  const map = getProgressMap();
  const current = map[questionId] || {
    questionId,
    viewed: false,
    bookmarked: false,
    correctCount: 0,
    incorrectCount: 0,
  };

  current.viewed = true;
  map[questionId] = current;
  saveProgressMap(map);
  updateDailyStreak();
  return current;
}

export function toggleQuestionBookmark(questionId: number): boolean {
  const map = getProgressMap();
  const current = map[questionId] || {
    questionId,
    viewed: false,
    bookmarked: false,
    correctCount: 0,
    incorrectCount: 0,
  };

  current.bookmarked = !current.bookmarked;
  map[questionId] = current;
  saveProgressMap(map);
  return current.bookmarked;
}

export function recordQuestionAnswer(
  questionId: number,
  isCorrect: boolean,
  selectedOptionId: string
): QuestionProgress {
  const map = getProgressMap();
  const current = map[questionId] || {
    questionId,
    viewed: false,
    bookmarked: false,
    correctCount: 0,
    incorrectCount: 0,
  };

  current.viewed = true;
  if (isCorrect) {
    current.correctCount = (current.correctCount || 0) + 1;
    current.lastResult = 'correct';
  } else {
    current.incorrectCount = (current.incorrectCount || 0) + 1;
    current.lastResult = 'incorrect';
  }
  current.lastAttemptDate = new Date().toISOString();
  current.lastSelectedOption = selectedOptionId;

  map[questionId] = current;
  saveProgressMap(map);
  updateDailyStreak();
  return current;
}

export function saveQuestionNote(questionId: number, note: string): void {
  const map = getProgressMap();
  const current = map[questionId] || {
    questionId,
    viewed: false,
    bookmarked: false,
    correctCount: 0,
    incorrectCount: 0,
  };
  current.notes = note;
  map[questionId] = current;
  saveProgressMap(map);
}

export function getQuizHistory(): QuizResult[] {
  const raw = safeGetItem(STORAGE_KEYS.QUIZ_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveQuizResult(result: QuizResult): void {
  const history = getQuizHistory();
  history.unshift(result);
  // Keep last 100 quiz runs
  if (history.length > 100) {
    history.length = 100;
  }
  safeSetItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(history));
  updateDailyStreak();
}

export function getDailyReminderSettings(): DailyReminderSettings {
  const defaultSettings: DailyReminderSettings = {
    enabled: false,
    time: '19:30',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    goalType: 'tickets',
    customMessage: 'Time for your daily NACC exam practice!',
    soundEnabled: true,
  };

  const raw = safeGetItem(STORAGE_KEYS.REMINDERS);
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function saveDailyReminderSettings(settings: DailyReminderSettings): void {
  safeSetItem(STORAGE_KEYS.REMINDERS, JSON.stringify(settings));
}

export function updateDailyStreak(): { streakDays: number; lastActiveDate: string } {
  const raw = safeGetItem(STORAGE_KEYS.STREAK);
  const today = new Date().toISOString().split('T')[0];
  let data: { streakDays: number; lastActiveDate: string } = {
    streakDays: 1,
    lastActiveDate: today,
  };

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.lastActiveDate === today) {
        return parsed;
      }
      const lastDate = new Date(parsed.lastActiveDate);
      const currDate = new Date(today);
      const diffDays = Math.round(
        (currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
      );

      if (diffDays === 1) {
        data = { streakDays: (parsed.streakDays || 0) + 1, lastActiveDate: today };
      } else if (diffDays > 1) {
        data = { streakDays: 1, lastActiveDate: today };
      } else {
        data = parsed;
      }
    } catch {
      data = { streakDays: 1, lastActiveDate: today };
    }
  }

  safeSetItem(STORAGE_KEYS.STREAK, JSON.stringify(data));
  return data;
}

export function calculateOverallStats(_totalQuestions: number): OverallStats {
  const map = getProgressMap();
  let totalViewed = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let masteredCount = 0;
  let improvingCount = 0;
  let unstableCount = 0;
  let needsReviewCount = 0;
  let bookmarkedCount = 0;
  let totalAnswered = 0;

  Object.values(map).forEach((p) => {
    if (p.viewed) totalViewed++;
    if (p.bookmarked) bookmarkedCount++;

    const mastery = getQuestionMasteryInfo(p);
    if (mastery.status !== 'unanswered') {
      totalAnswered++;
      if (mastery.status === 'mastered') {
        masteredCount++;
        totalCorrect++;
      } else {
        totalIncorrect++;
        if (mastery.status === 'unstable') {
          unstableCount++;
        } else if (mastery.status === 'improving') {
          improvingCount++;
        } else if (mastery.status === 'needs_review') {
          needsReviewCount++;
        }
      }
    }
  });

  const streakRaw = safeGetItem(STORAGE_KEYS.STREAK);
  let streakDays = 1;
  let lastActiveDate = new Date().toISOString().split('T')[0];
  if (streakRaw) {
    try {
      const parsed = JSON.parse(streakRaw);
      streakDays = parsed.streakDays || 1;
      lastActiveDate = parsed.lastActiveDate || lastActiveDate;
    } catch {}
  }

  return {
    totalViewed,
    totalAnswered,
    totalCorrect,
    totalIncorrect,
    masteredCount,
    improvingCount,
    unstableCount,
    needsReviewCount,
    bookmarkedCount,
    streakDays,
    lastActiveDate,
  };
}

export function getCustomGroups(): CustomGroup[] {
  const raw = safeGetItem(STORAGE_KEYS.CUSTOM_GROUPS);
  if (!raw) {
    // Provide clean starter groups in English
    const defaultGroups: CustomGroup[] = [
      {
        id: 'group_pharm',
        name: 'Difficult Medications & Dosages',
        color: '#6366f1',
        createdAt: new Date().toISOString(),
        questionIds: [],
      },
      {
        id: 'group_dementia',
        name: 'Dementia & Behavioral Symptoms',
        color: '#f59e0b',
        createdAt: new Date().toISOString(),
        questionIds: [],
      },
      {
        id: 'group_ethics',
        name: 'Legal, Consent & Ethics Scenarios',
        color: '#10b981',
        createdAt: new Date().toISOString(),
        questionIds: [],
      },
      {
        id: 'group_night_before',
        name: 'Exam Eve Rapid Drill',
        color: '#f43f5e',
        createdAt: new Date().toISOString(),
        questionIds: [],
      },
    ];
    saveCustomGroups(defaultGroups);
    return defaultGroups;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomGroups(groups: CustomGroup[]): void {
  safeSetItem(STORAGE_KEYS.CUSTOM_GROUPS, JSON.stringify(groups));
}

export function createCustomGroup(name: string, color = '#0284c7'): CustomGroup {
  const groups = getCustomGroups();
  const newGroup: CustomGroup = {
    id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    color,
    createdAt: new Date().toISOString(),
    questionIds: [],
  };
  groups.push(newGroup);
  saveCustomGroups(groups);
  return newGroup;
}

export function deleteCustomGroup(groupId: string): void {
  const groups = getCustomGroups().filter((g) => g.id !== groupId);
  saveCustomGroups(groups);
}

export function toggleQuestionInGroup(groupId: string, questionId: number): boolean {
  const groups = getCustomGroups();
  const group = groups.find((g) => g.id === groupId);
  if (!group) return false;

  let isNowIncluded = false;
  if (group.questionIds.includes(questionId)) {
    group.questionIds = group.questionIds.filter((id) => id !== questionId);
    isNowIncluded = false;
  } else {
    group.questionIds.push(questionId);
    isNowIncluded = true;
  }

  saveCustomGroups(groups);
  return isNowIncluded;
}

export function getGroupsForQuestion(questionId: number): CustomGroup[] {
  const groups = getCustomGroups();
  return groups.filter((g) => g.questionIds.includes(questionId));
}

export function exportAllDataJSON(): string {
  const exportPayload: AppExportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    progress: getProgressMap(),
    quizHistory: getQuizHistory(),
    reminderSettings: getDailyReminderSettings(),
    customGroups: getCustomGroups(),
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function importAllDataJSON(jsonStr: string): boolean {
  try {
    const data: AppExportData = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') return false;

    if (data.progress && typeof data.progress === 'object') {
      saveProgressMap(data.progress);
    }
    if (Array.isArray(data.quizHistory)) {
      safeSetItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(data.quizHistory));
    }
    if (data.reminderSettings) {
      saveDailyReminderSettings(data.reminderSettings);
    }
    if (Array.isArray(data.customGroups)) {
      saveCustomGroups(data.customGroups);
    }
    return true;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

export function getLastStudiedTicketIndex(): number {
  const raw = safeGetItem(STORAGE_KEYS.LAST_TICKET);
  if (!raw) return 0;
  const num = parseInt(raw, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
}

export function saveLastStudiedTicketIndex(index: number): void {
  safeSetItem(STORAGE_KEYS.LAST_TICKET, index.toString());
}

export function getLastActiveTab(): string {
  return safeGetItem(STORAGE_KEYS.ACTIVE_TAB) || 'study';
}

export function saveLastActiveTab(tab: string): void {
  safeSetItem(STORAGE_KEYS.ACTIVE_TAB, tab);
}

export function resetAllData(): void {
  Object.values(STORAGE_KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}
