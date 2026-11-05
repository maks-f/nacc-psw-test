import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Flame,
  Bookmark,
  Layers,
  Shuffle,
  Eye,
  Sliders,
  FolderPlus,
  Zap,
  BookOpen,
  Check,
  ChevronDown,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { CustomGroup, QuizConfig, QuizMode } from '../types';
import { getCategoryTranslation } from '../utils/categories';

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (config: QuizConfig) => void;
  categories: string[];
  customGroups: CustomGroup[];
  totalQuestions: number;
  bookmarkedCount: number;
  mistakesCount: number;
  unstableCount?: number;
  showTranslation?: boolean;
}

export const QuizConfigModal: React.FC<QuizConfigModalProps> = ({
  isOpen,
  onClose,
  onStartQuiz,
  categories,
  customGroups,
  totalQuestions,
  bookmarkedCount,
  mistakesCount,
  unstableCount = 0,
  showTranslation = false,
}) => {
  const [mode, setMode] = useState<QuizMode>('range');
  const [startTicket, setStartTicket] = useState<number>(1);
  const [endTicket, setEndTicket] = useState<number>(50);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || '');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(customGroups[0]?.id || '');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [shuffle, setShuffle] = useState<boolean>(true);
  const [instantFeedback, setInstantFeedback] = useState<boolean>(true);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presets = [
    { label: showTranslation ? '🎓 Екзамен (200)' : '🎓 Exam (200 Qs)', start: 1, end: totalQuestions, count: 200 },
    { label: '1 – 50', start: 1, end: 50 },
    { label: '51 – 100', start: 51, end: 100 },
    { label: '101 – 200', start: 101, end: 200 },
    { label: '201 – 350', start: 201, end: 350 },
    { label: '351 – 500', start: 351, end: 500 },
    { label: '501 – 650', start: 501, end: 650 },
    { label: '651 – 780', start: 651, end: 780 },
    { label: 'True / False (781 – 807)', start: 781, end: 807 },
    { label: showTranslation ? 'Всі 807 квитків' : 'All 807 Tickets', start: 1, end: 807 },
  ];

  const handleApplyPreset = (start: number, end: number, count?: number) => {
    setMode('range');
    setStartTicket(start);
    setEndTicket(end);
    const rangeSize = end - start + 1;
    if (count) {
      setQuestionCount(Math.min(count, rangeSize));
    } else if (questionCount > rangeSize) {
      setQuestionCount(Math.min(20, rangeSize));
    }
  };

  const handleStartExam200 = (withInstantFeedback: boolean = instantFeedback) => {
    onStartQuiz({
      mode: 'random',
      startTicket: 1,
      endTicket: totalQuestions,
      questionCount: Math.min(200, totalQuestions),
      shuffle: true,
      instantFeedback: withInstantFeedback,
      showExplanations: true,
    });
    onClose();
  };

  const selectedGroup = customGroups.find((g) => g.id === selectedGroupId) || customGroups[0];

  // Calculate available pool size based on active mode
  let availablePoolSize = totalQuestions;
  if (mode === 'range') {
    availablePoolSize = Math.max(1, endTicket - startTicket + 1);
  } else if (mode === 'group') {
    availablePoolSize = selectedGroup?.questionIds.length || 0;
  } else if (mode === 'unstable') {
    availablePoolSize = unstableCount;
  } else if (mode === 'failed') {
    availablePoolSize = mistakesCount;
  } else if (mode === 'bookmarked') {
    availablePoolSize = bookmarkedCount;
  } else if (mode === 'category') {
    availablePoolSize = 90;
  } else if (mode === 'random') {
    availablePoolSize = totalQuestions;
  }

  const effectiveCount = Math.min(questionCount, Math.max(1, availablePoolSize));

  const handleStart = () => {
    onStartQuiz({
      mode,
      startTicket,
      endTicket,
      category: mode === 'category' ? selectedCategory : undefined,
      groupId: mode === 'group' ? (selectedGroup?.id || undefined) : undefined,
      questionCount: effectiveCount,
      shuffle,
      instantFeedback,
      showExplanations,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 1. Backdrop Overlay (Fullscreen, Click to Dismiss) */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Perfectly Centered Flex Viewport Container */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-5 text-center pointer-events-none">
        {/* 3. Centered Modal Box */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-config-title"
          className="relative w-full max-w-xl my-auto bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl text-left pointer-events-auto flex flex-col max-h-[88vh] overflow-hidden transition-all"
        >
          {/* Modal Header */}
          <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#101726]/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
                <Sliders className="w-5 h-5 stroke-[2.25]" />
              </div>
              <div className="min-w-0">
                <h3
                  id="quiz-config-title"
                  className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight truncate leading-snug"
                >
                  {showTranslation ? 'Генератор тестів та тренування' : 'Quiz Generator & Practice'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight">
                  {showTranslation
                    ? 'Налаштуйте діапазон квитків, теми курсу NACC та режим тестування'
                    : 'Configure question range, syllabus topics, and exam settings'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body (Scrollable) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
            {/* =========================================================================
                HIGHLIGHTED SEPARATE HERO: OFFICIAL NACC EXAM (200 RANDOM QUESTIONS)
                ========================================================================= */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/80 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 dark:from-amber-950/50 dark:via-slate-900/50 dark:to-orange-950/30 p-4 sm:p-5 shadow-lg shadow-amber-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 shrink-0">
                    <GraduationCap className="w-6 h-6 stroke-[2.25]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                        {showTranslation ? 'Головний формат екзамену' : 'Official Exam Standard'}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md">
                        200 {showTranslation ? 'випадкових питань' : 'random tickets'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                      {showTranslation
                        ? 'Офіційний екзамен NACC (Симуляція)'
                        : 'Official NACC Exam Simulation'}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {showTranslation
                        ? 'Саме так буде проходити основний екзамен: 200 випадкових запитань з усієї бази 807 квитків без повторень. Повна перевірка реальної готовності.'
                        : 'Exact format of the official certification exam: 200 randomly selected questions across all 807 syllabus tickets. Full simulation of test day.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 sm:min-w-[210px]">
                  <button
                    type="button"
                    onClick={() => handleStartExam200(instantFeedback)}
                    className="w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-md shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition border border-amber-300/40"
                  >
                    <Zap className="w-4 h-4 fill-current shrink-0" />
                    <span>
                      {showTranslation ? 'Згенерувати 200 питань' : 'Generate 200 Questions'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('random');
                      setQuestionCount(200);
                      setShuffle(true);
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-bold border transition text-center cursor-pointer ${
                      mode === 'random'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-900 dark:text-amber-100'
                        : 'border-amber-400/40 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {mode === 'random'
                      ? (showTranslation ? '✓ Режим екзамену обрано нижче' : '✓ Exam mode selected below')
                      : (showTranslation ? 'Налаштувати параметри нижче' : 'Configure details below')}
                  </button>
                </div>
              </div>
            </div>

            {/* 1. Mode Selection Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                {showTranslation ? '1. Оберіть режим тестування' : '1. Select Practice Mode'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Mode G: Full Exam Simulation (200 Qs) */}
                <button
                  type="button"
                  onClick={() => {
                    setMode('random');
                    setQuestionCount(200);
                    setShuffle(true);
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left flex items-start gap-3 transition active:scale-[0.99] cursor-pointer col-span-1 sm:col-span-2 ${
                    mode === 'random'
                      ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500 shadow-sm'
                      : 'border-amber-300/70 dark:border-amber-700/60 bg-amber-50/30 dark:bg-amber-950/15 text-slate-700 dark:text-slate-300 hover:border-amber-400 dark:hover:border-amber-500'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      mode === 'random'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 stroke-[2.25]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between gap-1 leading-tight">
                      <span className="flex items-center gap-1.5">
                        <span>{showTranslation ? '🎓 Головний екзамен (200 випадкових питань)' : '🎓 Official Exam (200 Random Questions)'}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-amber-500 text-white uppercase tracking-wider">
                        {showTranslation ? 'Іспит NACC' : 'Official'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {showTranslation
                        ? 'Випадкова вибірка 200 питань з усіх 807 квитків курсу'
                        : 'Random selection of 200 tickets across the whole curriculum'}
                    </div>
                  </div>
                </button>

                {/* Mode A: Ticket Range */}
                <button
                  type="button"
                  onClick={() => setMode('range')}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left flex items-start gap-3 transition active:scale-[0.99] cursor-pointer ${
                    mode === 'range'
                      ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 ring-1 ring-sky-500 shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      mode === 'range'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {showTranslation ? 'Діапазон квитків' : 'Ticket Range'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {showTranslation ? 'Власний або швидкий інтервал' : 'Custom range or quick preset'}
                    </div>
                  </div>
                </button>

                {/* Mode B: Syllabus Topic */}
                <button
                  type="button"
                  onClick={() => setMode('category')}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left flex items-start gap-3 transition active:scale-[0.99] cursor-pointer ${
                    mode === 'category'
                      ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 ring-1 ring-sky-500 shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      mode === 'category'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {showTranslation ? 'Розділ програми NACC' : 'Syllabus Topic'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {showTranslation ? 'Один із 9 розділів курсу' : 'One of 9 curriculum modules'}
                    </div>
                  </div>
                </button>

                {/* Mode C: Unstable Tickets */}
                <button
                  type="button"
                  onClick={() => setMode('unstable')}
                  disabled={unstableCount === 0}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left flex items-start gap-3 transition active:scale-[0.99] cursor-pointer ${
                    unstableCount === 0
                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800/80'
                      : mode === 'unstable'
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500 shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      mode === 'unstable'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-amber-500'
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                      <span>{showTranslation ? 'Нестабільні' : 'Unstable Drill'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        {unstableCount}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {showTranslation ? 'Змінні відповіді (≤ помилок)' : 'Fluctuating answers'}
                    </div>
                  </div>
                </button>

                {/* Mode D: Mistakes Drill */}
                <button
                  type="button"
                  onClick={() => setMode('failed')}
                  disabled={mistakesCount === 0}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left flex items-start gap-3 transition active:scale-[0.99] cursor-pointer ${
                    mistakesCount === 0
                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800/80'
                      : mode === 'failed'
                      ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500 shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      mode === 'failed'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-rose-500'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                      <span>{showTranslation ? 'Робота над помилками' : 'Error Drill'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                        {mistakesCount}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {showTranslation ? 'Квитки з 0% успішністю' : 'Tickets with mistakes'}
                    </div>
                  </div>
                </button>

                {/* Mode E: Bookmarked */}
                <button
                  type="button"
                  onClick={() => setMode('bookmarked')}
                  disabled={bookmarkedCount === 0}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left flex items-start gap-3 transition active:scale-[0.99] cursor-pointer ${
                    bookmarkedCount === 0
                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800/80'
                      : mode === 'bookmarked'
                      ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500 shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      mode === 'bookmarked'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-amber-500'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                      <span>{showTranslation ? 'Збережені' : 'Bookmarked'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        {bookmarkedCount}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {showTranslation ? 'Ваші обрані квитки' : 'Your starred tickets'}
                    </div>
                  </div>
                </button>

                {/* Mode F: Custom Collection */}
                <button
                  type="button"
                  onClick={() => setMode('group')}
                  disabled={customGroups.length === 0}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-left flex items-start gap-3 transition active:scale-[0.99] cursor-pointer ${
                    customGroups.length === 0
                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800/80'
                      : mode === 'group'
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-1 ring-indigo-500 shadow-xs'
                      : 'border-slate-200/90 dark:border-slate-800/90 bg-slate-50/60 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      mode === 'group'
                        ? 'bg-indigo-500 text-white shadow-xs'
                        : 'bg-slate-200/80 dark:bg-slate-800 text-indigo-500'
                    }`}
                  >
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                      <span>{showTranslation ? 'Власна збірка' : 'Collection'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                        {customGroups.length}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {showTranslation ? 'Кураторські підбірки' : 'Curated custom lists'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Mode-Specific Configurations */}

            {/* Option A: Range Selector */}
            {mode === 'range' && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/90 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {showTranslation ? 'Інтервал квитків' : 'Ticket Range Interval'}
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                    #{startTicket} — #{endTicket} ({endTicket - startTicket + 1} tickets)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                      {showTranslation ? 'Початковий квиток #' : 'Start Ticket #'}
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={totalQuestions}
                      value={startTicket}
                      onChange={(e) => setStartTicket(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                      {showTranslation ? 'Кінцевий квиток #' : 'End Ticket #'}
                    </span>
                    <input
                      type="number"
                      min={startTicket}
                      max={totalQuestions}
                      value={endTicket}
                      onChange={(e) =>
                        setEndTicket(
                          Math.min(totalQuestions, Math.max(startTicket, parseInt(e.target.value) || startTicket))
                        )
                      }
                      className="w-full bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                    />
                  </div>
                </div>

                {/* Fast Presets Pills */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                    {showTranslation ? 'Швидкі набори квитків:' : 'Quick Interval Presets:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p) => {
                      const isSelected = startTicket === p.start && endTicket === p.end;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => handleApplyPreset(p.start, p.end, (p as any).count)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-2xs font-bold'
                              : 'bg-white dark:bg-[#131C2E] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/70 hover:border-sky-400 dark:hover:border-sky-500'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Option D: Random Exam Mode Configuration */}
            {mode === 'random' && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {showTranslation ? 'Параметри симуляції екзамену NACC' : 'NACC Exam Simulation Settings'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                    200 / {totalQuestions} {showTranslation ? 'квитків' : 'tickets'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {showTranslation
                    ? 'Тест складатиметься з 200 випадкових запитань з усіх розділів програми NACC (база з 807 квитків). Порядок запитань та варіантів відповідей перемішується автоматично.'
                    : 'The exam will consist of 200 questions drawn at random across all NACC syllabus modules (807 tickets). Question order and multiple-choice options are fully randomized.'}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold">
                    ✓ 200 {showTranslation ? 'випадкових питань' : 'random questions'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold">
                    ✓ {showTranslation ? 'Вся база (807)' : 'Full syllabus (807)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold">
                    ✓ {showTranslation ? 'Випадковий порядок' : 'Fair shuffle'}
                  </span>
                </div>
              </div>
            )}

            {/* Option B: Category Selector */}
            {mode === 'category' && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/90 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  {showTranslation ? 'Оберіть навчальний розділ NACC:' : 'Select Syllabus Topic to Practice:'}
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 pr-8 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/25 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {showTranslation ? getCategoryTranslation(cat) : cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {showTranslation
                    ? 'Тест генерується виключно із питань обраного розділу програми.'
                    : 'Quiz will be drawn exclusively from tickets under this curriculum module.'}
                </p>
              </div>
            )}

            {/* Option C: Collection Selector */}
            {mode === 'group' && (
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/90 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  {showTranslation ? 'Оберіть власну збірку:' : 'Select Custom Collection:'}
                </label>
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 pr-8 text-xs font-semibold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500/25 cursor-pointer"
                  >
                    {customGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.questionIds.length} tickets)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            )}

            {/* 3. Number of Questions Segmented Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {showTranslation ? '2. Кількість питань у тесті' : '2. Number of Questions in Quiz'}
                </label>
                <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                  {effectiveCount} {showTranslation ? 'питань' : 'questions'}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {[10, 20, 30, 50, 100, 200].map((count) => {
                  const isSelected = questionCount === count;
                  const isExam200 = count === 200;
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? isExam200
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm ring-2 ring-amber-400'
                            : 'bg-sky-600 text-white shadow-xs'
                          : isExam200
                          ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80'
                          : 'bg-slate-100 dark:bg-slate-850/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <span>{count}</span>
                      {isExam200 && (
                        <span
                          className={`text-[9px] font-extrabold uppercase leading-none mt-0.5 ${
                            isSelected ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          Exam
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Exam Toggles (Custom iOS-style Switches) */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              {/* Toggle 1: Shuffle */}
              <div
                onClick={() => setShuffle((p) => !p)}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-850/50 border border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    <Shuffle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {showTranslation ? 'Перемішати питання та варіанти' : 'Shuffle Questions & Options'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {showTranslation ? 'Випадковий порядок для кращого запам’ятовування' : 'Randomize order to avoid muscle memory'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={shuffle}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShuffle((p) => !p);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    shuffle ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      shuffle ? 'translate-x-6' : 'translate-x-1'
                    } shadow-xs`}
                  />
                </button>
              </div>

              {/* Toggle 2: Instant Feedback vs Exam Simulation */}
              <div
                onClick={() => setInstantFeedback((p) => !p)}
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-850/50 border border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {showTranslation ? 'Миттєве пояснення та результат' : 'Instant Clinical Feedback'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {instantFeedback
                        ? (showTranslation ? 'Пояснення одразу після кожної відповіді' : 'Rationale shown immediately after each answer')
                        : (showTranslation ? 'Симуляція іспиту: результат лише в кінці' : 'Exam simulation: full score and review at the end')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={instantFeedback}
                  onClick={(e) => {
                    e.stopPropagation();
                    setInstantFeedback((p) => !p);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    instantFeedback ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      instantFeedback ? 'translate-x-6' : 'translate-x-1'
                    } shadow-xs`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#101726]/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {showTranslation ? 'Скасувати' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleStart}
              className={`flex-1 sm:flex-initial min-h-[46px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white active:scale-[0.99] shadow-md flex items-center justify-center gap-2 transition cursor-pointer ${
                mode === 'random' || effectiveCount === 200
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25 border border-amber-300/40'
                  : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
              }`}
            >
              {mode === 'random' || effectiveCount === 200 ? (
                <GraduationCap className="w-4 h-4 fill-current shrink-0" />
              ) : (
                <Play className="w-4 h-4 fill-current shrink-0" />
              )}
              <span>
                {showTranslation
                  ? mode === 'random' || effectiveCount === 200
                    ? `Почати екзамен (${effectiveCount} питань)`
                    : `Почати тест (${effectiveCount} питань)`
                  : mode === 'random' || effectiveCount === 200
                  ? `Start Official Exam (${effectiveCount} Qs)`
                  : `Start Practice Quiz (${effectiveCount} Qs)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
