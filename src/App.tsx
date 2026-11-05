import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GraduationCap, Zap, Sliders } from 'lucide-react';
import questionsDataRaw from './data/questions.json';
import {
  CustomGroup,
  Question,
  QuestionProgress,
  QuizConfig,
  QuizResult,
} from './types';
import {
  calculateOverallStats,
  createCustomGroup,
  deleteCustomGroup,
  getCustomGroups,
  getDailyReminderSettings,
  getLastActiveTab,
  getLastStudiedTicketIndex,
  getProgressMap,
  getQuizHistory,
  markQuestionViewed,
  recordQuestionAnswer,
  resetAllData,
  saveLastActiveTab,
  saveLastStudiedTicketIndex,
  saveQuestionNote,
  saveQuizResult,
  toggleQuestionBookmark,
  toggleQuestionInGroup,
} from './utils/storage';
import { getQuestionMasteryInfo } from './utils/mastery';
import { Header } from './components/Header';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { LinearStudyView } from './components/LinearStudyView';
import { QuizConfigModal } from './components/QuizConfigModal';
import { QuizView } from './components/QuizView';
import { SmartReviewView } from './components/SmartReviewView';
import { BookmarksView } from './components/BookmarksView';
import { AnalyticsView } from './components/AnalyticsView';
import { ExportSyncModal } from './components/ExportSyncModal';
import { ReminderModal } from './components/ReminderModal';
import { QuestionGroupModal } from './components/QuestionGroupModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';

const allQuestions = questionsDataRaw as Question[];

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nacc_theme_v1');
    if (saved) return saved === 'dark';
    return true; // Default dark theme for comfortable night study
  });

  // Translation & Hints preference state (persisted across sessions)
  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    const saved = localStorage.getItem('nacc_show_translation_v1');
    return saved === 'true';
  });

  const [showHints, setShowHints] = useState<boolean>(() => {
    const saved = localStorage.getItem('nacc_show_hints_v1');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('nacc_show_translation_v1', String(showTranslation));
  }, [showTranslation]);

  useEffect(() => {
    localStorage.setItem('nacc_show_hints_v1', String(showHints));
  }, [showHints]);

  // State: Progress and stored data
  const [progressMap, setProgressMap] = useState<Record<number, QuestionProgress>>(
    () => getProgressMap()
  );
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>(() => getQuizHistory());
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>(() => getCustomGroups());

  // State: Active Category / Collection Filter across header and study view
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // State: Last studied position and active tab (persisted across page refresh)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(() => {
    const savedIdx = getLastStudiedTicketIndex();
    return savedIdx >= 0 && savedIdx < allQuestions.length ? savedIdx : 0;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const savedTab = getLastActiveTab();
    if (['study', 'quiz', 'smart', 'bookmarks', 'analytics'].includes(savedTab)) {
      return savedTab as ActiveTab;
    }
    return 'study';
  });

  // State: Active quiz session
  const [activeQuizConfig, setActiveQuizConfig] = useState<QuizConfig | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[] | null>(null);

  // Modals state
  const [isQuizConfigOpen, setIsQuizConfigOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Question Collections assignment modal
  const [groupModalQuestionId, setGroupModalQuestionId] = useState<number | null>(null);

  // Synchronize Dark Theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('nacc_theme_v1', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('nacc_theme_v1', 'light');
    }
  }, [darkMode]);

  // Persist current ticket position and mark viewed whenever index changes
  useEffect(() => {
    saveLastStudiedTicketIndex(currentQuestionIndex);
    const currQ = allQuestions[currentQuestionIndex];
    if (currQ && !progressMap[currQ.id]?.viewed) {
      const updated = markQuestionViewed(currQ.id);
      setProgressMap((prev) => ({ ...prev, [currQ.id]: updated }));
    }
  }, [currentQuestionIndex]);

  // Persist active tab whenever it changes
  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    saveLastActiveTab(tab);
    if (tab === 'quiz' && !activeQuizQuestions) {
      setIsQuizConfigOpen(true);
    }
  }, [activeQuizQuestions]);

  // Background reminder scheduler check (runs every 60s)
  useEffect(() => {
    const checkReminder = () => {
      const settings = getDailyReminderSettings();
      if (!settings.enabled || typeof window === 'undefined' || !('Notification' in window)) {
        return;
      }
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      // Check day of week
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
      const currentDayName = dayNames[now.getDay()];

      if (
        currentTimeStr === settings.time &&
        settings.days.includes(currentDayName) &&
        settings.lastNotifiedDate !== todayStr
      ) {
        settings.lastNotifiedDate = todayStr;
        localStorage.setItem('nacc_reminders_v1', JSON.stringify(settings));

        let message = 'Time for your daily NACC exam preparation session!';
        if (settings.goalType === 'mistakes') {
          message = 'Drill past mistakes to reinforce memory today.';
        } else if (settings.goalType === 'quiz') {
          message = 'Take a 20-question practice test today!';
        } else if (settings.goalType === 'custom' && settings.customMessage) {
          message = settings.customMessage;
        }

        try {
          new Notification('📚 NACC Exam Prep Study Time', {
            body: message,
            icon: '/apple-touch-icon.png',
          });
        } catch {}
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => set.add(q.category));
    return Array.from(set);
  }, []);

  // Computed statistics
  const stats = useMemo(
    () => calculateOverallStats(allQuestions.length),
    [progressMap]
  );

  const mistakesCount = useMemo(() => {
    return Object.values(progressMap).filter((p) => {
      const mastery = getQuestionMasteryInfo(p);
      return mastery.status === 'needs_review' || mastery.status === 'unstable';
    }).length;
  }, [progressMap]);

  // Handlers for Progress Modifications
  const handleRecordAnswer = useCallback(
    (questionId: number, isCorrect: boolean, optionId: string) => {
      const updated = recordQuestionAnswer(questionId, isCorrect, optionId);
      setProgressMap((prev) => ({ ...prev, [questionId]: updated }));
    },
    []
  );

  const handleToggleBookmark = useCallback((questionId: number) => {
    const isBookmarked = toggleQuestionBookmark(questionId);
    setProgressMap((prev) => {
      const current = prev[questionId] || {
        questionId,
        viewed: true,
        bookmarked: false,
        correctCount: 0,
        incorrectCount: 0,
      };
      return {
        ...prev,
        [questionId]: { ...current, bookmarked: isBookmarked },
      };
    });
  }, []);

  const handleSaveNote = useCallback((questionId: number, note: string) => {
    saveQuestionNote(questionId, note);
    setProgressMap((prev) => {
      const current = prev[questionId] || {
        questionId,
        viewed: true,
        bookmarked: false,
        correctCount: 0,
        incorrectCount: 0,
      };
      return {
        ...prev,
        [questionId]: { ...current, notes: note },
      };
    });
  }, []);

  // Handlers for Custom Collections
  const handleToggleQuestionInGroup = useCallback((groupId: string, questionId: number) => {
    toggleQuestionInGroup(groupId, questionId);
    setCustomGroups(getCustomGroups());
  }, []);

  const handleCreateGroup = useCallback((name: string, color: string) => {
    const created = createCustomGroup(name, color);
    setCustomGroups(getCustomGroups());
    return created;
  }, []);

  const handleDeleteGroup = useCallback((groupId: string) => {
    deleteCustomGroup(groupId);
    setCustomGroups(getCustomGroups());
  }, []);

  const handleResetProgress = () => {
    setIsResetModalOpen(true);
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      setToastMessage('Offline cache cleared! Reloading fresh data...');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch {
      setToastMessage('Offline cache cleared. Please reload the app.');
    }
  };

  const handleConfirmReset = () => {
    resetAllData();
    setProgressMap({});
    setQuizHistory([]);
    setCustomGroups(getCustomGroups());
    setCurrentQuestionIndex(0);
    saveLastStudiedTicketIndex(0);
    setToastMessage('All study progress and statistics have been successfully reset.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDataImported = () => {
    setProgressMap(getProgressMap());
    setQuizHistory(getQuizHistory());
    setCustomGroups(getCustomGroups());
  };

  // Fair, uniform Fisher-Yates shuffle
  const fisherYatesShuffle = <T,>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  };

  // Quiz Launch Generator
  const handleStartQuiz = (config: QuizConfig) => {
    let pool: Question[] = [];

    if (config.mode === 'range') {
      pool = allQuestions.filter(
        (q) => q.num >= config.startTicket && q.num <= config.endTicket
      );
    } else if (config.mode === 'group' && config.groupId) {
      const group = customGroups.find((g) => g.id === config.groupId);
      if (group) {
        pool = allQuestions.filter((q) => group.questionIds.includes(q.id));
      }
    } else if (config.mode === 'unstable') {
      pool = allQuestions.filter(
        (q) => getQuestionMasteryInfo(progressMap[q.id]).status === 'unstable'
      );
    } else if (config.mode === 'failed') {
      pool = allQuestions
        .filter((q) => {
          const mastery = getQuestionMasteryInfo(progressMap[q.id]);
          return mastery.status === 'needs_review' || (progressMap[q.id]?.incorrectCount || 0) > 0;
        })
        .sort((a, b) => {
          const masteryA = getQuestionMasteryInfo(progressMap[a.id]);
          const masteryB = getQuestionMasteryInfo(progressMap[b.id]);
          // Prioritize pure needs_review (0% accuracy) first
          if (masteryA.status === 'needs_review' && masteryB.status !== 'needs_review') return -1;
          if (masteryB.status === 'needs_review' && masteryA.status !== 'needs_review') return 1;
          return (progressMap[b.id]?.incorrectCount || 0) - (progressMap[a.id]?.incorrectCount || 0);
        });
    } else if (config.mode === 'bookmarked') {
      pool = allQuestions.filter((q) => progressMap[q.id]?.bookmarked);
    } else if (config.mode === 'category' && config.category) {
      pool = allQuestions.filter((q) => q.category === config.category);
    } else if (config.mode === 'spaced') {
      pool = [...allQuestions].sort((a, b) => {
        const pA = progressMap[a.id];
        const pB = progressMap[b.id];
        const mistakesA = pA?.incorrectCount || 0;
        const mistakesB = pB?.incorrectCount || 0;
        return mistakesB - mistakesA;
      });
    } else {
      // 'random' mode or full pool
      pool = [...allQuestions];
    }

    if (pool.length === 0) {
      return;
    }

    // For prioritized algorithmic modes ('spaced', 'failed'), slice highest-priority items FIRST,
    // then shuffle the resulting batch to randomize question order during the quiz
    let selected: Question[];
    if (config.mode === 'spaced' || config.mode === 'failed') {
      const targetCount = config.questionCount > 0 ? config.questionCount : 20;
      const topCandidates = pool.slice(0, targetCount);
      selected = config.shuffle ? fisherYatesShuffle(topCandidates) : topCandidates;
    } else if (config.mode === 'random') {
      // 200 random questions official exam: shuffle whole pool fairly, then take requested count (default 200)
      const targetCount = config.questionCount > 0 ? config.questionCount : 200;
      const shuffledPool = fisherYatesShuffle(pool);
      selected = shuffledPool.slice(0, Math.min(targetCount, pool.length));
    } else {
      selected = [...pool];
      if (config.shuffle) {
        selected = fisherYatesShuffle(selected);
      }
      if (config.questionCount > 0 && selected.length > config.questionCount) {
        selected = selected.slice(0, config.questionCount);
      }
    }

    setActiveQuizConfig(config);
    setActiveQuizQuestions(selected);
    setActiveTab('quiz');
    saveLastActiveTab('quiz');
  };

  const handleFinishQuiz = (result: {
    total: number;
    correct: number;
    incorrect: number;
    answers: { questionId: number; selectedOptionId: string; isCorrect: boolean }[];
    timeSpentSeconds: number;
  }) => {
    const newQuizResult: QuizResult = {
      id: `quiz_${Date.now()}`,
      date: new Date().toISOString(),
      mode: activeQuizConfig?.mode || 'range',
      total: result.total,
      correct: result.correct,
      incorrect: result.incorrect,
      answers: result.answers,
      timeSpentSeconds: result.timeSpentSeconds,
    };
    saveQuizResult(newQuizResult);
    setQuizHistory(getQuizHistory());
    setProgressMap(getProgressMap());
  };

  const handleExitQuiz = () => {
    setActiveQuizQuestions(null);
    setActiveQuizConfig(null);
    setIsQuizConfigOpen(false);
    setActiveTab('study');
    saveLastActiveTab('study');
  };

  const handleSelectFilter = useCallback((filter: string) => {
    setSelectedFilter(filter);
    setCurrentQuestionIndex(0);
    saveLastStudiedTicketIndex(0);
    if (activeTab !== 'study') {
      setActiveTab('study');
      saveLastActiveTab('study');
    }
  }, [activeTab]);

  const handleJumpToTicket = (ticketNum: number) => {
    const targetQ = allQuestions.find((q) => q.num === ticketNum);
    if (targetQ && selectedFilter !== 'all') {
      if (selectedFilter.startsWith('group:')) {
        const groupId = selectedFilter.replace('group:', '');
        const grp = customGroups.find((g) => g.id === groupId);
        if (!grp || !grp.questionIds.includes(targetQ.id)) {
          setSelectedFilter('all');
        }
      } else if (targetQ.category !== selectedFilter) {
        setSelectedFilter('all');
      }
    }
    const idx = allQuestions.findIndex((q) => q.num === ticketNum);
    if (idx !== -1) {
      setCurrentQuestionIndex(idx);
      setActiveTab('study');
      saveLastActiveTab('study');
    }
  };

  const currentModalQuestion =
    groupModalQuestionId !== null
      ? allQuestions.find((q) => q.id === groupModalQuestionId)
      : null;

  return (
    <div className="min-h-screen bg-[#EBF0F5] dark:bg-[#0B111E] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        showTranslation={showTranslation}
        onToggleTranslation={() => setShowTranslation((prev) => !prev)}
        showHints={showHints}
        onToggleHints={() => setShowHints((prev) => !prev)}
        stats={stats}
        totalQuestions={allQuestions.length}
        questions={allQuestions}
        onSelectQuestion={handleJumpToTicket}
        progressMap={progressMap}
        selectedFilter={selectedFilter}
        onSelectFilter={handleSelectFilter}
        categories={categories}
        customGroups={customGroups}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenReminder={() => setIsReminderOpen(true)}
        onClearCache={handleClearCache}
        onResetProgress={handleResetProgress}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4">
        {/* Tab 1: Linear Study (Default) */}
        {activeTab === 'study' && (
          <LinearStudyView
            questions={allQuestions}
            progressMap={progressMap}
            customGroups={customGroups}
            currentQuestionIndex={currentQuestionIndex}
            onQuestionIndexChange={(idx) => setCurrentQuestionIndex(idx)}
            onRecordAnswer={handleRecordAnswer}
            onToggleBookmark={handleToggleBookmark}
            onSaveNote={handleSaveNote}
            onOpenGroupModal={(qId) => setGroupModalQuestionId(qId)}
            categories={categories}
            showTranslation={showTranslation}
            onToggleTranslation={() => setShowTranslation((prev) => !prev)}
            showHints={showHints}
            onToggleHints={() => setShowHints((prev) => !prev)}
            selectedFilter={selectedFilter}
            onSelectFilter={handleSelectFilter}
          />
        )}

        {/* Tab 2: Quiz Practice */}
        {activeTab === 'quiz' && (
          <>
            {activeQuizQuestions && activeQuizConfig ? (
              <QuizView
                quizQuestions={activeQuizQuestions}
                config={activeQuizConfig}
                onFinishQuiz={handleFinishQuiz}
                onExitQuiz={handleExitQuiz}
                onRecordAnswer={handleRecordAnswer}
                progressMap={progressMap}
                showTranslation={showTranslation}
                onToggleTranslation={() => setShowTranslation((prev) => !prev)}
              />
            ) : (
              <div className="max-w-xl mx-auto py-8 px-4 space-y-4">
                {/* Highlighted Official Exam Hero Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 dark:from-amber-950/40 dark:via-[#131C2E] dark:to-orange-950/20 border-2 border-amber-500/70 dark:border-amber-400/50 shadow-xl space-y-4 text-left">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 shrink-0">
                      <GraduationCap className="w-6 h-6 stroke-[2.25]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                          {showTranslation ? 'Головний формат екзамену' : 'Official Exam Standard'}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md">
                          200 {showTranslation ? 'випадкових питань' : 'random tickets'}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {showTranslation
                          ? 'Офіційний екзамен NACC (200 питань)'
                          : 'Official NACC Exam Simulation (200 Qs)'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {showTranslation
                          ? 'Саме так буде проходити основний екзамен: 200 випадкових запитань з усієї бази 807 квитків. Пройдіть повну симуляцію в реальних умовах сертифікації.'
                          : 'Exact official exam format: 200 randomly selected questions across all 807 syllabus tickets. Full simulation of the certification exam.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() =>
                        handleStartQuiz({
                          mode: 'random',
                          startTicket: 1,
                          endTicket: allQuestions.length,
                          questionCount: 200,
                          shuffle: true,
                          instantFeedback: false,
                          showExplanations: true,
                        })
                      }
                      className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition border border-amber-300/40"
                    >
                      <Zap className="w-4 h-4 fill-current shrink-0" />
                      <span>
                        {showTranslation
                          ? 'Згенерувати 200 питань (Екзамен)'
                          : 'Start Official Exam (200 Qs)'}
                      </span>
                    </button>

                    <button
                      onClick={() => setIsQuizConfigOpen(true)}
                      className="py-3 px-5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Sliders className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>
                        {showTranslation
                          ? 'Налаштувати квіз'
                          : 'Quiz Settings'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Secondary General Info Box */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {showTranslation ? 'Власні налаштування квізу' : 'Custom Practice Modes'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {showTranslation
                      ? 'Також доступне тренування за діапазоном квитків (1-50, 51-100 тощо), за розділами програми курсу NACC або робота над помилками.'
                      : 'Practice specific ticket ranges (1-50, 51-100, etc.), syllabus modules, starred tickets, or error drill.'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 3: Spaced Repetition Drill */}
        {activeTab === 'smart' && (
          <SmartReviewView
            questions={allQuestions}
            progressMap={progressMap}
            showTranslation={showTranslation}
            onStartQuiz={handleStartQuiz}
            onJumpToTicket={handleJumpToTicket}
          />
        )}

        {/* Tab 4: Bookmarks & Custom Collections */}
        {activeTab === 'bookmarks' && (
          <BookmarksView
            questions={allQuestions}
            progressMap={progressMap}
            customGroups={customGroups}
            onToggleBookmark={handleToggleBookmark}
            onJumpToTicket={handleJumpToTicket}
            onStartQuiz={handleStartQuiz}
            onDeleteGroup={handleDeleteGroup}
            onCreateGroup={handleCreateGroup}
          />
        )}

        {/* Tab 5: Analytics & Predictive Readiness */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            stats={stats}
            totalQuestions={allQuestions.length}
            questions={allQuestions}
            progressMap={progressMap}
            quizHistory={quizHistory}
            categories={categories}
            onJumpToTicket={handleJumpToTicket}
          />
        )}
      </main>

      {/* Ergonomic Mobile Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        bookmarkCount={stats.bookmarkedCount}
        weakCount={mistakesCount}
      />

      {/* Modals */}
      <QuizConfigModal
        isOpen={isQuizConfigOpen}
        onClose={() => setIsQuizConfigOpen(false)}
        onStartQuiz={handleStartQuiz}
        categories={categories}
        customGroups={customGroups}
        totalQuestions={allQuestions.length}
        bookmarkedCount={stats.bookmarkedCount}
        mistakesCount={mistakesCount}
        unstableCount={stats.unstableCount}
        showTranslation={showTranslation}
      />

      <ExportSyncModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        questions={allQuestions}
        progressMap={progressMap}
        onDataImported={handleDataImported}
      />

      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
      />

      {/* Question Collections Assignment Modal */}
      {currentModalQuestion && (
        <QuestionGroupModal
          isOpen={groupModalQuestionId !== null}
          onClose={() => setGroupModalQuestionId(null)}
          questionId={currentModalQuestion.id}
          ticketNum={currentModalQuestion.num}
          customGroups={customGroups}
          onToggleQuestionInGroup={handleToggleQuestionInGroup}
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
