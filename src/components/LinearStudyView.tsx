import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Languages,
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  Check,
  Edit3,
  FolderPlus,
  RotateCcw,
  Zap,
  ChevronDown,
  X,
  BookOpen,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { CustomGroup, Question, QuestionProgress } from '../types';
import { getQuestionMasteryInfo } from '../utils/mastery';
import { CATEGORY_TRANSLATIONS, getCategoryTranslation } from '../utils/categories';

interface LinearStudyViewProps {
  questions: Question[];
  progressMap: Record<number, QuestionProgress>;
  customGroups: CustomGroup[];
  currentQuestionIndex: number;
  onQuestionIndexChange: (index: number) => void;
  onRecordAnswer: (questionId: number, isCorrect: boolean, optionId: string) => void;
  onToggleBookmark: (questionId: number) => void;
  onSaveNote: (questionId: number, note: string) => void;
  onOpenGroupModal: (questionId: number) => void;
  categories: string[];
  showTranslation: boolean;
  onToggleTranslation: () => void;
  showHints: boolean;
  onToggleHints: () => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const LinearStudyView: React.FC<LinearStudyViewProps> = ({
  questions,
  progressMap,
  customGroups,
  currentQuestionIndex,
  onQuestionIndexChange,
  onRecordAnswer,
  onToggleBookmark,
  onSaveNote,
  onOpenGroupModal,
  categories,
  showTranslation,
  onToggleTranslation,
  showHints,
  onToggleHints,
  selectedFilter,
  onSelectFilter,
}) => {
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(true);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [eliminatedOptionIds, setEliminatedOptionIds] = useState<Set<string>>(new Set());
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAllCategoriesExpanded, setIsAllCategoriesExpanded] = useState(false);

  // Filtered list based on category, custom collection, or mastery status
  const filteredQuestions = React.useMemo(() => {
    if (selectedFilter === 'all') return questions;
    if (selectedFilter.startsWith('group:')) {
      const groupId = selectedFilter.replace('group:', '');
      const group = customGroups.find((g) => g.id === groupId);
      if (!group) return questions;
      return questions.filter((q) => group.questionIds.includes(q.id));
    }
    if (selectedFilter.startsWith('status:')) {
      const statusType = selectedFilter.replace('status:', '');
      return questions.filter((q) => {
        if (statusType === 'bookmarked') return !!progressMap[q.id]?.bookmarked;
        const mastery = getQuestionMasteryInfo(progressMap[q.id]);
        return mastery.status === statusType;
      });
    }
    return questions.filter((q) => q.category === selectedFilter);
  }, [questions, selectedFilter, customGroups, progressMap]);

  const filterLabel = React.useMemo(() => {
    if (selectedFilter === 'all') return 'All Tickets';
    if (selectedFilter.startsWith('group:')) {
      const g = customGroups.find((grp) => grp.id === selectedFilter.replace('group:', ''));
      return `📁 ${g?.name || 'Collection'}`;
    }
    if (selectedFilter === 'status:unstable') return showTranslation ? '⚡ Нестабільні' : '⚡ Unstable';
    if (selectedFilter === 'status:needs_review') return showTranslation ? '✗ Повторення' : '✗ Needs Review';
    if (selectedFilter === 'status:improving') return showTranslation ? '↗ Покращуються' : '↗ Improving';
    if (selectedFilter === 'status:mastered') return showTranslation ? '✓ Засвоєні' : '✓ Mastered';
    if (selectedFilter === 'status:bookmarked') return showTranslation ? '🔖 Збережені' : '🔖 Bookmarked';
    return showTranslation ? getCategoryTranslation(selectedFilter) : selectedFilter;
  }, [selectedFilter, customGroups, showTranslation]);

  const currentQuestion = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];
  const qProgress = currentQuestion ? progressMap[currentQuestion.id] : undefined;
  const isBookmarked = !!qProgress?.bookmarked;

  // Find groups assigned to this current question
  const assignedGroups = React.useMemo(() => {
    if (!currentQuestion) return [];
    return customGroups.filter((g) => g.questionIds.includes(currentQuestion.id));
  }, [customGroups, currentQuestion?.id]);

  // Category stats for topic inspector
  const categoryQuestions = React.useMemo(() => {
    if (!currentQuestion) return [];
    return questions.filter((q) => q.category === currentQuestion.category);
  }, [questions, currentQuestion?.category]);

  const categoryMasteredCount = React.useMemo(() => {
    return categoryQuestions.filter(
      (q) => getQuestionMasteryInfo(progressMap[q.id]).status === 'mastered'
    ).length;
  }, [categoryQuestions, progressMap]);

  const categoryCurrentIndex = React.useMemo(() => {
    if (!currentQuestion) return 0;
    return categoryQuestions.findIndex((q) => q.id === currentQuestion.id);
  }, [categoryQuestions, currentQuestion?.id]);

  // Safe boundary check
  useEffect(() => {
    if (filteredQuestions.length > 0 && currentQuestionIndex >= filteredQuestions.length) {
      onQuestionIndexChange(0);
    }
  }, [filteredQuestions.length, currentQuestionIndex, onQuestionIndexChange]);

  // Escape listener for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCategoryModalOpen) {
        setIsCategoryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isCategoryModalOpen]);

  // Sync state when current question changes - opens with a clean slate each time
  useEffect(() => {
    if (currentQuestion) {
      setSelectedOptionId(null);
      setHasSubmittedAnswer(false);
      setEliminatedOptionIds(new Set());
      setNoteText(qProgress?.notes || '');
      setIsEditingNote(false);
    }
  }, [currentQuestion?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'j') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        goToPrev();
      } else if (e.key.toLowerCase() === 't') {
        onToggleTranslation();
      } else if (e.key.toLowerCase() === 'e') {
        onToggleHints();
      } else if (e.key.toLowerCase() === 'b') {
        if (currentQuestion) onToggleBookmark(currentQuestion.id);
      } else if (e.key.toLowerCase() === 'g') {
        if (currentQuestion) onOpenGroupModal(currentQuestion.id);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!hasSubmittedAnswer && selectedOptionId) {
          e.preventDefault();
          handleConfirmAnswer();
        }
      } else if (['1', '2', '3', '4'].includes(e.key) && currentQuestion) {
        const optionIndex = parseInt(e.key, 10) - 1;
        const opt = currentQuestion.options[optionIndex];
        if (opt) {
          handleOptionClick(opt.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, filteredQuestions.length, currentQuestion, selectedOptionId, hasSubmittedAnswer, eliminatedOptionIds, onToggleTranslation, onToggleHints]);

  const goToNext = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setSlideDirection('right');
      onQuestionIndexChange(currentQuestionIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestionIndex > 0) {
      setSlideDirection('left');
      onQuestionIndexChange(currentQuestionIndex - 1);
    }
  };

  // Touch swipe support (Swipe Left = Next, Swipe Right = Prev)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      return;
    }
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Detect horizontal swipe with minimum threshold of 45px and dominant horizontal angle
    if (Math.abs(diffX) > Math.abs(diffY) * 1.3 && Math.abs(diffX) > 45) {
      if (diffX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleOptionClick = (optionId: string) => {
    // If option was eliminated, un-eliminate it first
    if (eliminatedOptionIds.has(optionId)) {
      const next = new Set(eliminatedOptionIds);
      next.delete(optionId);
      setEliminatedOptionIds(next);
      return;
    }

    if (hasSubmittedAnswer) {
      setHasSubmittedAnswer(false);
    }
    setSelectedOptionId(optionId);
  };

  const handleToggleEliminate = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSubmittedAnswer) return;

    setEliminatedOptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
        // If it was currently selected, deselect it
        if (selectedOptionId === optionId) {
          setSelectedOptionId(null);
        }
      }
      return next;
    });
  };

  const handleResetAttempt = () => {
    setSelectedOptionId(null);
    setHasSubmittedAnswer(false);
    setEliminatedOptionIds(new Set());
  };

  const handleConfirmAnswer = () => {
    if (!currentQuestion || !selectedOptionId || hasSubmittedAnswer) return;
    setHasSubmittedAnswer(true);
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    onRecordAnswer(currentQuestion.id, isCorrect, selectedOptionId);
    setIsExplanationExpanded(true);
  };

  if (!currentQuestion) {
    return (
      <div className="w-full max-w-3xl mx-auto py-16 px-4 text-center space-y-3">
        <p className="text-slate-500 text-sm">No tickets match this filter selection.</p>
        <button
          onClick={() => {
            onSelectFilter('all');
            onQuestionIndexChange(0);
          }}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          Reset Filter to All Tickets
        </button>
      </div>
    );
  }

  const currentMastery = getQuestionMasteryInfo(qProgress);
  const progressPercent = Math.round(((currentQuestionIndex + 1) / filteredQuestions.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto pb-32 sm:pb-36">
      {/* =========================================================================
          CONSOLIDATED SINGLE-TIER STICKY CONTEXT RIBBON (46px Height)
          Reclaims ~60px vertical viewport on mobile devices!
         ========================================================================= */}
      <div className="sticky top-[calc(4rem+env(safe-area-inset-top,0px))] z-20 -mx-2 sm:mx-0 sm:mt-2 mb-3 sm:mb-4 bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-md border-b sm:border border-slate-200/80 dark:border-slate-800/80 sm:rounded-2xl shadow-xs transition-colors overflow-hidden">
        <div className="px-3 sm:px-4 h-[46px] flex items-center justify-between gap-2 min-w-0">
          {/* Left Zone: Topic Capsule & Filter */}
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 transition truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[280px] cursor-pointer"
              title="Click to view full syllabus category, stats & topic switcher"
              aria-label={`Category: ${currentQuestion.category}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0 group-hover:scale-105 transition-transform" />
              <span className="truncate">
                {showTranslation ? (CATEGORY_TRANSLATIONS[currentQuestion.category] || currentQuestion.category) : currentQuestion.category}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
            </button>

            {selectedFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-bold shrink-0">
                <Filter className="w-2.5 h-2.5 shrink-0" />
                <button
                  type="button"
                  onClick={() => onSelectFilter('all')}
                  className="hover:opacity-75 transition ml-0.5"
                  title="Clear active filter"
                  aria-label="Clear active filter"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>

          {/* Center Zone: Ticket Number & Set Progress */}
          <div className="flex items-center gap-1 shrink-0 text-center">
            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
              #{currentQuestion.num}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
              ({currentQuestionIndex + 1}/{filteredQuestions.length})
            </span>
          </div>

          {/* Right Zone: Mastery Badge, Collections, Bookmark */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Mastery status badge */}
            {currentMastery.status !== 'unanswered' ? (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition ${currentMastery.badgeClass}`}
                title={showTranslation ? currentMastery.explanationUa : currentMastery.explanationEn}
              >
                <span>
                  {showTranslation ? currentMastery.compactLabelUa : currentMastery.compactLabelEn}
                </span>
              </span>
            ) : (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
                New
              </span>
            )}

            {/* Custom Collections Button */}
            <button
              type="button"
              onClick={() => onOpenGroupModal(currentQuestion.id)}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                assignedGroups.length > 0
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Add to custom collections (G)"
              aria-label="Manage collections"
            >
              <FolderPlus className="w-3.5 h-3.5 shrink-0" />
              {assignedGroups.length > 0 && (
                <span className="text-[10px] font-bold leading-none">{assignedGroups.length}</span>
              )}
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={() => onToggleBookmark(currentQuestion.id)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isBookmarked
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={isBookmarked ? 'Remove bookmark (B)' : 'Bookmark ticket (B)'}
              aria-label="Bookmark ticket"
            >
              <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Integrated 2px Micro-Progress Line */}
        <div className="h-[2px] w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* =========================================================================
          QUESTION CARD & REFINED BILINGUAL TYPOGRAPHY (Anti-Slop)
         ========================================================================= */}
      <div className="px-2 sm:px-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: slideDirection === 'right' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection === 'right' ? -20 : 20 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl dark:shadow-black/25 overflow-hidden touch-pan-y"
          >
            <div className="p-4 sm:p-6 space-y-4">
              {/* Question Stem */}
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed tracking-tight">
                  {currentQuestion.questionEn}
                </h2>

                {/* Elegant Inline Ukrainian Translation (No heavy blue box) */}
                {showTranslation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed flex items-start gap-1.5"
                  >
                    <Languages className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{currentQuestion.questionUa}</p>
                  </motion.div>
                )}
              </div>

              {/* Options List with Elimination (Strikethrough) Mode */}
              <div className="space-y-2.5 pt-1">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrect = opt.id === currentQuestion.correctOptionId;
                  const isEliminated = eliminatedOptionIds.has(opt.id);

                  let optCardStyle =
                    'border-slate-200 dark:border-slate-800/90 bg-slate-50/70 dark:bg-slate-850/60 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700';

                  if (hasSubmittedAnswer) {
                    if (isCorrect) {
                      optCardStyle =
                        'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500';
                    } else if (isSelected && !isCorrect) {
                      optCardStyle =
                        'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500';
                    } else {
                      optCardStyle =
                        'border-slate-200/60 dark:border-slate-800/40 opacity-45 text-slate-500 dark:text-slate-400';
                    }
                  } else if (isEliminated) {
                    optCardStyle =
                      'border-slate-200/60 dark:border-slate-800/40 bg-slate-100/40 dark:bg-slate-900/40 opacity-40 line-through';
                  } else if (isSelected) {
                    optCardStyle =
                      'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 ring-1 ring-sky-500';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionClick(opt.id)}
                      className={`w-full min-h-[52px] p-3 sm:p-3.5 rounded-xl border transition-all flex items-start gap-3 relative group cursor-pointer ${optCardStyle}`}
                    >
                      {/* Option letter chip (A, B, C, D) */}
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-transform ${
                          hasSubmittedAnswer && isCorrect
                            ? 'bg-emerald-500 text-white'
                            : hasSubmittedAnswer && isSelected && !isCorrect
                            ? 'bg-rose-500 text-white'
                            : isSelected
                            ? 'bg-sky-500 text-white shadow-xs'
                            : isEliminated
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 line-through'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                        }`}
                      >
                        {opt.id}
                      </span>

                      {/* Option text & clean inline Ukrainian translation */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="text-xs sm:text-[14.5px] font-medium leading-relaxed">
                          {opt.textEn}
                        </div>
                        {showTranslation && (
                          <div className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-snug">
                            {opt.textUa}
                          </div>
                        )}
                      </div>

                      {/* Right icons: Status indicator or Elimination (Strikethrough) Toggle */}
                      {hasSubmittedAnswer ? (
                        <>
                          {isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          {isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleToggleEliminate(opt.id, e)}
                          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition shrink-0 opacity-50 hover:opacity-100 focus:opacity-100 ${
                            isEliminated ? '!opacity-100 text-rose-500 dark:text-rose-400 bg-rose-500/10' : ''
                          }`}
                          title={isEliminated ? 'Restore option' : 'Cross out / eliminate option'}
                          aria-label={isEliminated ? `Restore option ${opt.id}` : `Eliminate option ${opt.id}`}
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* In-Card Answer Feedback Bar (shown once submitted) */}
              {hasSubmittedAnswer && (
                <div
                  className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold ${
                    selectedOptionId === currentQuestion.correctOptionId
                      ? 'bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border border-emerald-500/25'
                      : 'bg-rose-500/10 text-rose-900 dark:text-rose-200 border border-rose-500/25'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    {selectedOptionId === currentQuestion.correctOptionId ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold">
                          {selectedOptionId === currentQuestion.correctOptionId
                            ? (showTranslation ? 'Правильно! Відмінна робота' : 'Correct! Well done')
                            : (showTranslation
                                ? `Неправильно (Правильна: Опція ${currentQuestion.correctOptionId})`
                                : `Incorrect (Correct answer: Option ${currentQuestion.correctOptionId})`)}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 shrink-0 ${currentMastery.badgeClass}`}
                        >
                          {showTranslation ? currentMastery.labelUa : currentMastery.labelEn}
                        </span>
                      </div>
                      <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        {showTranslation ? currentMastery.explanationUa : currentMastery.explanationEn}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetAttempt}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shrink-0 shadow-2xs active:scale-95 cursor-pointer"
                    title="Try this question again"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-sky-500" />
                    <span className="hidden xs:inline">{showTranslation ? 'Ще раз' : 'Try Again'}</span>
                  </button>
                </div>
              )}

              {/* Action Strip: Personal Notes & Clinical Rationale Toggle */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsEditingNote((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    noteText
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{noteText ? 'Personal Note (Saved)' : 'Add Note'}</span>
                </button>

                {hasSubmittedAnswer && !showHints && (
                  <button
                    type="button"
                    onClick={() => setIsExplanationExpanded((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isExplanationExpanded ? 'Hide Rationale' : 'Show Rationale'}</span>
                  </button>
                )}
              </div>

              {/* Note Editor */}
              {isEditingNote && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write personal study notes for this ticket..."
                    rows={2}
                    className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSaveNote(currentQuestion.id, noteText);
                        setIsEditingNote(false);
                      }}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition"
                    >
                      <Check className="w-3 h-3" /> Save Note
                    </button>
                  </div>
                </div>
              )}

              {/* Clinical Rationale and Memory Aid Block */}
              {(showHints || (hasSubmittedAnswer && isExplanationExpanded)) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5 pt-1"
                >
                  {/* Clinical Rationale */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1 text-xs">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span>Clinical Rationale:</span>
                    </div>
                    <p className="leading-relaxed">{currentQuestion.explanation}</p>
                  </div>

                  {/* How to Remember Mnemonic */}
                  {currentQuestion.howToRemember && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      <div className="font-semibold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1 text-xs">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>Memory Aid / Mnemonic:</span>
                      </div>
                      <p className="leading-relaxed">{currentQuestion.howToRemember}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* =========================================================================
          TOPIC & CATEGORY INSPECTOR MODAL (Portaled)
         ========================================================================= */}
      {isCategoryModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setIsCategoryModalOpen(false)}
              aria-hidden="true"
            />

            {/* Centering Viewport */}
            <div className="flex min-h-full items-center justify-center p-3 sm:p-5 text-center pointer-events-none">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="category-detail-title"
                className="relative w-full max-w-lg my-auto bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl text-left pointer-events-auto flex flex-col max-h-[88vh] overflow-hidden transition-all"
              >
              {/* Drag handle for mobile */}
              <div className="sm:hidden flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>

              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span
                      id="category-detail-title"
                      className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block truncate"
                    >
                      {showTranslation ? 'Розділ програми NACC' : 'NACC Curriculum Topic'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
                  aria-label="Close topic details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Official Section (English)
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                    {currentQuestion.category}
                  </h3>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5 mb-0.5">
                    <Languages className="w-3.5 h-3.5 shrink-0" />
                    Переклад українською:
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {getCategoryTranslation(currentQuestion.category)}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Tickets</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {categoryQuestions.length}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Mastered</div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {categoryMasteredCount}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Mastery</div>
                    <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                      {categoryQuestions.length > 0 ? Math.round((categoryMasteredCount / categoryQuestions.length) * 100) : 0}%
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Current ticket <span className="font-semibold text-slate-800 dark:text-slate-200">#{currentQuestion.num}</span> is {categoryCurrentIndex + 1} of {categoryQuestions.length} in this topic.
                </div>

                {/* Filter Action */}
                <div className="pt-1 space-y-2">
                  {selectedFilter === currentQuestion.category ? (
                    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-sky-500 shrink-0" />
                        {showTranslation ? 'Цей розділ зараз активний у фільтрі' : 'Currently studying this topic'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectFilter('all');
                          setIsCategoryModalOpen(false);
                        }}
                        className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0 ml-2 cursor-pointer"
                      >
                        {showTranslation ? 'Скинути (всі 807)' : 'Reset (All 807)'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectFilter(currentQuestion.category);
                        setIsCategoryModalOpen(false);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-sky-600/20 transition cursor-pointer"
                    >
                      <Filter className="w-4 h-4 shrink-0" />
                      <span>
                        {showTranslation
                          ? `Вивчати тільки цей розділ (${categoryQuestions.length} квитків)`
                          : `Study only this topic (${categoryQuestions.length} tickets)`}
                      </span>
                    </button>
                  )}

                  {/* Switch to any other category */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAllCategoriesExpanded((prev) => !prev)}
                      className="w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-between transition cursor-pointer"
                    >
                      <span>{showTranslation ? 'Перейти до іншого розділу курсу' : 'Switch to another syllabus topic'}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isAllCategoriesExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isAllCategoriesExpanded && (
                      <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {categories.map((cat) => {
                          const isFiltered = cat === selectedFilter;
                          const count = questions.filter((q) => q.category === cat).length;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                onSelectFilter(cat);
                                setIsCategoryModalOpen(false);
                              }}
                              className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition cursor-pointer ${
                                isFiltered
                                  ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="truncate font-semibold">{cat}</div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {getCategoryTranslation(cat)}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* =========================================================================
          UNIFIED THUMB-ZONE COMMAND DOCK (Fixed right above BottomNav)
          Houses Confirm Option / Next / Prev / Try Again within thumb reach!
         ========================================================================= */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-20 pointer-events-none pb-1.5 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="backdrop-blur-lg bg-white/95 dark:bg-[#131C2E]/95 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-1.5 sm:p-2 shadow-lg dark:shadow-2xl flex items-center justify-between gap-2 transition-colors">
            {/* Previous Button */}
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentQuestionIndex === 0}
              className="py-2.5 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-35 disabled:cursor-not-allowed transition active:scale-[0.98] cursor-pointer"
              title="Previous ticket (← or swipe right)"
              aria-label="Previous ticket"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">{showTranslation ? 'Назад' : 'Prev'}</span>
            </button>

            {/* Dynamic Center/Primary Action: Confirm vs Try Again vs Ticket Context */}
            {!hasSubmittedAnswer ? (
              selectedOptionId ? (
                /* Primary Thumb Action: Confirm Option */
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 transition cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirm Option {selectedOptionId}</span>
                </button>
              ) : (
                /* Resting State: Ticket counter */
                <div className="flex-1 text-center px-2 flex flex-col items-center justify-center">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 leading-none">
                    Ticket #{currentQuestion.num}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans mt-0.5 leading-none">
                    Select an option to test
                  </span>
                </div>
              )
            ) : (
              /* Answered State: Try Again Button */
              <button
                type="button"
                onClick={handleResetAttempt}
                className="py-2.5 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                title="Try again"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-500" />
                <span>{showTranslation ? 'Ще раз' : 'Try Again'}</span>
              </button>
            )}

            {/* Next Button */}
            <button
              type="button"
              onClick={goToNext}
              disabled={currentQuestionIndex === filteredQuestions.length - 1}
              className={`py-2.5 px-3 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-35 disabled:cursor-not-allowed transition active:scale-[0.98] cursor-pointer ${
                hasSubmittedAnswer
                  ? 'flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs'
              }`}
              title="Next ticket (→ or swipe left)"
              aria-label="Next ticket"
            >
              <span>{showTranslation ? 'Вперед' : 'Next'}</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
