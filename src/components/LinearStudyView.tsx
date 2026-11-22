import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Type,
  Volume2,
  VolumeX,
  Hash,
  ArrowRight,
  Shuffle,
  Flame,
  GraduationCap,
  BadgePlus,
  Database,
} from 'lucide-react';
import { CustomGroup, Question, QuestionProgress, QuizConfig, TextSize } from '../types';
import { getQuestionMasteryInfo } from '../utils/mastery';
import { CATEGORY_TRANSLATIONS, getCategoryTranslation } from '../utils/categories';
import { triggerHaptic } from '../utils/haptics';
import { getTextSizeClasses, getNextTextSize } from '../utils/textSize';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { KeyCorrectionBadge } from './KeyCorrectionBadge';
import { NewExamBadge } from './NewExamBadge';

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
  onStartQuiz?: (config: QuizConfig) => void;
  onTriggerEdgeGlow?: (type: 'correct' | 'incorrect') => void;
  isScrollingDown?: boolean;
  textSize?: TextSize;
  onTextSizeChange?: (size: TextSize) => void;
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
  onStartQuiz,
  onTriggerEdgeGlow,
  isScrollingDown = false,
  textSize = 'normal',
  onTextSizeChange,
}) => {
  const sizeClasses = getTextSizeClasses(textSize);
  const { isSpeaking, speakingId, isSupported: isTtsSupported, speak, stop: stopTts } = useSpeechSynthesis();
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(true);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAllCategoriesExpanded, setIsAllCategoriesExpanded] = useState(false);
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [jumpInputRef] = [useRef<HTMLInputElement>(null)];
  const [examSubFilter, setExamSubFilter] = useState<'all' | 'new' | 'existing'>('all');

  // Filtered list based on category, custom collection, or mastery status
  const filteredQuestions = React.useMemo(() => {
    if (selectedFilter === 'all') return questions;
    if (selectedFilter.startsWith('group:')) {
      const groupId = selectedFilter.replace('group:', '');
      const group = customGroups.find((g) => g.id === groupId);
      if (!group) return questions;
      let list = questions.filter((q) => group.questionIds.includes(q.id));
      if (groupId === 'group_potential_exam_200') {
        if (examSubFilter === 'new') {
          list = list.filter((q) => q.isExamNew);
        } else if (examSubFilter === 'existing') {
          list = list.filter((q) => !q.isExamNew);
        }
      }
      return list;
    }
    if (selectedFilter.startsWith('status:')) {
      const statusType = selectedFilter.replace('status:', '');
      if (statusType === 'error_blitz') {
        return questions.filter((q) => (progressMap[q.id]?.incorrectCount || 0) >= 2);
      }
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
    if (selectedFilter === 'group:group_potential_exam_200') {
      return '⭐ 200 Exam Questions v1 (193)';
    }
    if (selectedFilter.startsWith('group:')) {
      const g = customGroups.find((grp) => grp.id === selectedFilter.replace('group:', ''));
      return `📁 ${g?.name || 'Collection'}`;
    }
    if (selectedFilter === 'status:error_blitz') return showTranslation ? '🔥 Складні (≥2)' : '🔥 Error Blitz (≥2)';
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

  const errorBlitzCount = React.useMemo(() => {
    return questions.filter((q) => (progressMap[q.id]?.incorrectCount || 0) >= 2).length;
  }, [questions, progressMap]);

  // Safe boundary check
  useEffect(() => {
    if (filteredQuestions.length > 0 && currentQuestionIndex >= filteredQuestions.length) {
      onQuestionIndexChange(0);
    }
  }, [filteredQuestions.length, currentQuestionIndex, onQuestionIndexChange]);

  // Escape listener for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isJumpModalOpen) {
          setIsJumpModalOpen(false);
        } else if (isCategoryModalOpen) {
          setIsCategoryModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isCategoryModalOpen, isJumpModalOpen]);

  // Sync jump modal input on open
  useEffect(() => {
    if (isJumpModalOpen) {
      setJumpInput(String(currentQuestion?.num || ''));
      setJumpError(null);
      const timer = setTimeout(() => {
        if (jumpInputRef.current) {
          jumpInputRef.current.focus();
          jumpInputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isJumpModalOpen, currentQuestion?.num]);

  // Sync state when current question changes - opens with a clean slate each time
  useEffect(() => {
    if (currentQuestion) {
      stopTts();
      setSelectedOptionId(null);
      setHasSubmittedAnswer(false);
      setNoteText(qProgress?.notes || '');
      setIsEditingNote(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [currentQuestion?.id, stopTts]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isJumpModalOpen || isCategoryModalOpen || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      const key = e.key.toLowerCase();

      // Navigation: Next (ArrowRight, j) / Prev (ArrowLeft, k)
      if (e.key === 'ArrowRight' || key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || key === 'k') {
        e.preventDefault();
        goToPrev();
      }

      // Options: A, B, C, D (or 1, 2, 3, 4, and Ukrainian layout: ф, и, с, в)
      else if (['a', 'b', 'c', 'd', '1', '2', '3', '4', 'ф', 'и', 'с', 'в'].includes(key) && currentQuestion) {
        let optionIndex = -1;
        if (key === 'a' || key === '1' || key === 'ф') optionIndex = 0;
        else if (key === 'b' || key === '2' || key === 'и') optionIndex = 1;
        else if (key === 'c' || key === '3' || key === 'с') optionIndex = 2;
        else if (key === 'd' || key === '4' || key === 'в') optionIndex = 3;

        const opt = currentQuestion.options[optionIndex];
        if (opt) {
          e.preventDefault();
          handleOptionClick(opt.id);
        }
      }

      // Confirm or Advance: Enter or Space
      else if (e.key === 'Enter' || e.key === ' ') {
        if (!hasSubmittedAnswer && selectedOptionId) {
          e.preventDefault();
          handleConfirmAnswer();
        } else if (hasSubmittedAnswer && currentQuestionIndex < filteredQuestions.length - 1) {
          e.preventDefault();
          goToNext();
        }
      }

      // Bookmark / Save: 's' (or Ukrainian 'і')
      else if (key === 's' || key === 'і') {
        if (currentQuestion) {
          e.preventDefault();
          onToggleBookmark(currentQuestion.id);
        }
      }

      // Translation toggle: 't' (or Ukrainian 'е')
      else if (key === 't' || key === 'е') {
        e.preventDefault();
        onToggleTranslation();
      }

      // Hints & Rationale toggle: 'h' or 'e' (or Ukrainian 'р', 'у')
      else if (key === 'h' || key === 'e' || key === 'р' || key === 'у') {
        e.preventDefault();
        onToggleHints();
      }

      // Open Group / Collections modal: 'g' (or Ukrainian 'п')
      else if (key === 'g' || key === 'п') {
        if (currentQuestion) {
          e.preventDefault();
          onOpenGroupModal(currentQuestion.id);
        }
      }

      // Quick Ticket Jump: '#'
      else if (e.key === '#') {
        e.preventDefault();
        setIsJumpModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, filteredQuestions.length, currentQuestion, selectedOptionId, hasSubmittedAnswer, onToggleTranslation, onToggleHints, onToggleBookmark, onOpenGroupModal, isJumpModalOpen, isCategoryModalOpen]);

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

  const handleJumpSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(jumpInput.trim(), 10);
    if (isNaN(val) || val < 1 || val > questions.length) {
      setJumpError(
        showTranslation
          ? `Введіть номер квитка від 1 до ${questions.length}`
          : `Enter ticket number between 1 and ${questions.length}`
      );
      return;
    }

    const inFilteredIdx = filteredQuestions.findIndex((q) => q.num === val);
    if (inFilteredIdx !== -1) {
      setSlideDirection(inFilteredIdx > currentQuestionIndex ? 'right' : 'left');
      onQuestionIndexChange(inFilteredIdx);
      setIsJumpModalOpen(false);
      setJumpError(null);
      return;
    }

    const inAllIdx = questions.findIndex((q) => q.num === val);
    if (inAllIdx !== -1) {
      onSelectFilter('all');
      setSlideDirection(inAllIdx > currentQuestionIndex ? 'right' : 'left');
      onQuestionIndexChange(inAllIdx);
      setIsJumpModalOpen(false);
      setJumpError(null);
      return;
    }

    setJumpError(
      showTranslation
        ? `Квиток #${val} не знайдено`
        : `Ticket #${val} not found`
    );
  };

  const handleJumpToSpecific = (num: number) => {
    const inFilteredIdx = filteredQuestions.findIndex((q) => q.num === num);
    if (inFilteredIdx !== -1) {
      setSlideDirection(inFilteredIdx > currentQuestionIndex ? 'right' : 'left');
      onQuestionIndexChange(inFilteredIdx);
      setIsJumpModalOpen(false);
      setJumpError(null);
      return;
    }
    const inAllIdx = questions.findIndex((q) => q.num === num);
    if (inAllIdx !== -1) {
      onSelectFilter('all');
      setSlideDirection(inAllIdx > currentQuestionIndex ? 'right' : 'left');
      onQuestionIndexChange(inAllIdx);
      setIsJumpModalOpen(false);
      setJumpError(null);
    }
  };

  const handleRandomJump = () => {
    if (questions.length === 0) return;
    const randomTicket = questions[Math.floor(Math.random() * questions.length)];
    if (randomTicket) {
      handleJumpToSpecific(randomTicket.num);
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
    if (hasSubmittedAnswer) {
      setHasSubmittedAnswer(false);
    }
    triggerHaptic('tap');
    setSelectedOptionId(optionId);
  };

  const handleResetAttempt = () => {
    triggerHaptic('tap');
    setSelectedOptionId(null);
    setHasSubmittedAnswer(false);
  };

  const handleConfirmAnswer = () => {
    if (!currentQuestion || !selectedOptionId || hasSubmittedAnswer) return;
    setHasSubmittedAnswer(true);
    const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
    triggerHaptic(isCorrect ? 'correct' : 'incorrect');
    onTriggerEdgeGlow?.(isCorrect ? 'correct' : 'incorrect');
    onRecordAnswer(currentQuestion.id, isCorrect, selectedOptionId);
    setIsExplanationExpanded(true);
  };

  if (!currentQuestion) {
    return (
      <div className="w-full max-w-3xl mx-auto py-16 px-4 text-center space-y-3">
        <p className="text-slate-500 text-sm">
          {showTranslation ? 'Немає квитків, що відповідають цьому фільтру.' : 'No tickets match this filter selection.'}
        </p>
        <button
          onClick={() => {
            onSelectFilter('all');
            onQuestionIndexChange(0);
          }}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          {showTranslation ? `Скинути фільтр (Всі ${questions.length} квитків)` : `Reset Filter to All ${questions.length} Tickets`}
        </button>
      </div>
    );
  }

  const currentMastery = getQuestionMasteryInfo(qProgress);
  const progressPercent = Math.round(((currentQuestionIndex + 1) / filteredQuestions.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto pb-36 sm:pb-40">
      {/* =========================================================================
          CONSOLIDATED SINGLE-TIER STICKY CONTEXT RIBBON (42-46px Height)
          Reclaims vertical viewport on mobile devices!
         ========================================================================= */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] z-20 -mx-2 sm:mx-0 sm:mt-1.5 mb-2 sm:mb-3 bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-md border-b sm:border border-slate-200/80 dark:border-slate-800/80 sm:rounded-2xl shadow-xs transition-colors overflow-hidden">
        <div className="px-2.5 sm:px-4 h-[42px] sm:h-[46px] flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
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
              <>
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
                {onStartQuiz && (
                  <button
                    type="button"
                    onClick={() => {
                      const isCategory = categories.includes(selectedFilter);
                      const isGroup = selectedFilter.startsWith('group:');
                      onStartQuiz({
                        mode: isCategory ? 'category' : isGroup ? 'group' : 'random',
                        category: isCategory ? selectedFilter : undefined,
                        groupId: isGroup ? selectedFilter.replace('group:', '') : undefined,
                        startTicket: 1,
                        endTicket: questions.length,
                        questionCount: filteredQuestions.length,
                        shuffle: true,
                        instantFeedback: true,
                        showExplanations: true,
                        timeLimitMinutes: 0,
                      });
                    }}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold transition cursor-pointer shrink-0"
                    title={showTranslation ? 'Пройти сесію тестування за цим фільтром' : 'Start quiz session for this filter'}
                  >
                    <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0 fill-current" />
                    <span>{showTranslation ? 'Тест' : 'Quiz'}</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Center Zone: Ticket Number & Quick Jump Trigger */}
          <button
            type="button"
            onClick={() => setIsJumpModalOpen(true)}
            className="flex items-center gap-1 shrink-0 text-center px-2 py-1 -my-1 rounded-lg bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 transition cursor-pointer group active:scale-95"
            title={showTranslation ? `Натисніть для переходу до квитка (1–${questions.length})` : `Click to jump to ticket (1–${questions.length})`}
            aria-label={showTranslation ? 'Швидкий перехід до квитка' : 'Quick jump to ticket'}
          >
            <span className="font-mono font-bold text-xs sm:text-sm text-sky-600 dark:text-sky-400 tracking-tight flex items-center gap-1">
              #{currentQuestion.num}
              {currentQuestion.isExamNew && (
                <span
                  title={showTranslation ? 'Нове питання з вибірки NACC Exam 2026' : 'New 2026 exam question'}
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-400"
                >
                  <BadgePlus className="w-3.5 h-3.5" />
                </span>
              )}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium font-mono">
              {filteredQuestions.length === questions.length ? (
                <span>/ {questions.length}</span>
              ) : (
                <span className="text-[10px] sm:text-[11px]">
                  ({currentQuestionIndex + 1}/{filteredQuestions.length})
                </span>
              )}
            </span>
          </button>

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
                {showTranslation ? 'Не пройдено' : 'Unattempted'}
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
              title={
                isBookmarked
                  ? (showTranslation ? 'Видалити із збережених [S]' : 'Remove bookmark [S]')
                  : (showTranslation ? 'Зберегти квиток [S]' : 'Bookmark ticket [S]')
              }
              aria-label="Bookmark ticket"
            >
              <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Quick Text Size Cycle Button */}
            {onTextSizeChange && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap');
                  onTextSizeChange(getNextTextSize(textSize));
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center font-bold text-[11px]"
                title={
                  showTranslation
                    ? `Розмір шрифту: ${
                        textSize === 'compact' ? 'Дрібний' : textSize === 'large' ? 'Великий' : 'Стандарт'
                      } (натисніть для зміни)`
                    : `Text size: ${textSize} (click to cycle)`
                }
                aria-label="Cycle text size"
              >
                <span className="font-mono text-xs">
                  {textSize === 'compact' ? 'A-' : textSize === 'large' ? 'A+' : 'A'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Integrated 2px Micro-Progress Line */}
        <div className="h-[2px] w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Ultra-slim 26px Segment Pill Bar (Embedded in Sticky Ribbon) */}
        {selectedFilter === 'group:group_potential_exam_200' && (
          <div className="px-2.5 sm:px-4 py-1 bg-amber-500/10 dark:bg-amber-500/5 border-t border-amber-500/20 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1 font-bold overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => {
                  setExamSubFilter('all');
                  onQuestionIndexChange(0);
                }}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer shrink-0 ${
                  examSubFilter === 'all'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-900 dark:text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                {showTranslation ? 'Всі 193' : 'All 193'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExamSubFilter('new');
                  onQuestionIndexChange(0);
                }}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  examSubFilter === 'new'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15'
                }`}
              >
                <BadgePlus className="w-3 h-3" />
                <span>{showTranslation ? 'Нові 118' : 'New 118'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExamSubFilter('existing');
                  onQuestionIndexChange(0);
                }}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  examSubFilter === 'existing'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Database className="w-3 h-3 text-slate-400" />
                <span>{showTranslation ? 'З бази 75' : 'Bank 75'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => onSelectFilter('all')}
              className="text-[10px] text-amber-800/80 dark:text-amber-300/80 hover:underline shrink-0 ml-auto whitespace-nowrap"
              title="Reset to all questions"
            >
              {showTranslation ? 'Всі теми ✕' : 'All Topics ✕'}
            </button>
          </div>
        )}
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
            <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3.5">
              {/* Badges Row: New Exam 2026 Question & Key Correction Alert */}
              {(currentQuestion.isExamNew || currentQuestion.keyCorrection) && (
                <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                  {currentQuestion.isExamNew && (
                    <NewExamBadge showTranslation={showTranslation} compact />
                  )}
                  {currentQuestion.keyCorrection && (
                    <KeyCorrectionBadge question={currentQuestion} showTranslation={showTranslation} compact />
                  )}
                </div>
              )}

              {/* Question Stem */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2.5">
                  <h2 className={`${sizeClasses.stem} font-semibold text-slate-900 dark:text-slate-100 leading-relaxed tracking-tight flex-1`}>
                    {currentQuestion.questionEn}
                  </h2>

                  {isTtsSupported && (
                    <button
                      type="button"
                      onClick={() => speak(currentQuestion.questionEn, 'question')}
                      className={`p-1.5 sm:p-2 rounded-xl border transition flex items-center gap-1.5 shrink-0 cursor-pointer select-none ${
                        speakingId === 'question'
                          ? 'bg-sky-500 text-white border-sky-400 shadow-sm animate-pulse'
                          : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                      }`}
                      title={
                        speakingId === 'question'
                          ? (showTranslation ? 'Зупинити озвучування' : 'Stop pronunciation')
                          : (showTranslation ? 'Озвучити питання англійською (TTS)' : 'Listen to pronunciation (TTS)')
                      }
                      aria-label="Listen to question pronunciation"
                    >
                      {speakingId === 'question' ? (
                        <>
                          <VolumeX className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-bold uppercase hidden xs:inline">
                            {showTranslation ? 'Стоп' : 'Stop'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 shrink-0 text-sky-500 dark:text-sky-400" />
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hidden xs:inline">
                            Audio
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Elegant Inline Ukrainian Translation (No heavy blue box) */}
                {showTranslation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`pt-2.5 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 ${sizeClasses.translation} text-slate-600 dark:text-slate-300 font-normal leading-relaxed flex items-start gap-1.5`}
                  >
                    <Languages className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{currentQuestion.questionUa}</p>
                  </motion.div>
                )}
              </div>

              {/* Options List */}
              <div className="space-y-1.5 sm:space-y-2 pt-0.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrect = opt.id === currentQuestion.correctOptionId;

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
                  } else if (isSelected) {
                    optCardStyle =
                      'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 ring-1 ring-sky-500';
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionClick(opt.id)}
                      className={`w-full min-h-[44px] p-2.5 sm:p-3 rounded-xl border transition-all flex items-center gap-2.5 sm:gap-3 relative group cursor-pointer ${optCardStyle}`}
                    >
                      {/* Option letter chip (A, B, C, D) */}
                      <span
                        className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-transform ${
                          hasSubmittedAnswer && isCorrect
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : hasSubmittedAnswer && isSelected && !isCorrect
                            ? 'bg-rose-500 text-white shadow-xs'
                            : isSelected
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                        }`}
                      >
                        {opt.id}
                      </span>

                      {/* Option text & clean inline Ukrainian translation */}
                      <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
                        <div className={`${sizeClasses.option} font-medium leading-relaxed`}>
                          {opt.textEn}
                        </div>
                        {showTranslation && (
                          <div className={`${sizeClasses.optionTranslation} text-slate-500 dark:text-slate-400 font-normal mt-0.5 leading-snug`}>
                            {opt.textUa}
                          </div>
                        )}
                      </div>

                      {/* Right icons: Status indicator, Shortcut Badge & Option Audio */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasSubmittedAnswer && (
                          <>
                            {isCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            )}
                            {isSelected && !isCorrect && (
                              <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                            )}
                          </>
                        )}

                        {/* Desktop Keyboard Shortcut Badge */}
                        <kbd
                          className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 select-none group-hover:border-sky-500/50 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition"
                          title={`Натисніть ${opt.id} або ${opt.id.charCodeAt(0) - 64} на клавіатурі`}
                        >
                          {opt.id}
                        </kbd>

                        {isTtsSupported && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              speak(opt.textEn, `opt-${opt.id}`);
                            }}
                            className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                              speakingId === `opt-${opt.id}`
                                ? 'bg-sky-500 text-white shadow-xs animate-pulse opacity-100'
                                : 'text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 opacity-60 hover:opacity-100'
                            }`}
                            title={
                              speakingId === `opt-${opt.id}`
                                ? (showTranslation ? 'Зупинити озвучування' : 'Stop audio')
                                : (showTranslation ? `Озвучити варіант ${opt.id}` : `Pronounce option ${opt.id}`)
                            }
                            aria-label={`Pronounce option ${opt.id}`}
                          >
                            {speakingId === `opt-${opt.id}` ? (
                              <VolumeX className="w-4 h-4 shrink-0" />
                            ) : (
                              <Volume2 className="w-4 h-4 shrink-0" />
                            )}
                          </button>
                        )}
                      </div>
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
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1 text-xs">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span>{showTranslation ? 'Клінічне пояснення:' : 'Clinical Rationale:'}</span>
                    </div>
                    <p className={`leading-relaxed ${sizeClasses.explanation}`}>{currentQuestion.explanation}</p>
                  </div>

                  {/* How to Remember Mnemonic */}
                  {currentQuestion.howToRemember && (
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-800 dark:text-slate-200">
                      <div className="font-semibold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1 text-xs">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>{showTranslation ? 'Мнемоніка для запам’ятовування:' : 'Memory Aid / Mnemonic:'}</span>
                      </div>
                      <p className={`leading-relaxed ${sizeClasses.explanation}`}>{currentQuestion.howToRemember}</p>
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
                        {showTranslation ? `Скинути (всі ${questions.length})` : `Reset (All ${questions.length})`}
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

                  {errorBlitzCount > 0 && selectedFilter !== 'status:error_blitz' && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectFilter('status:error_blitz');
                        setIsCategoryModalOpen(false);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between transition hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{showTranslation ? '🔥 Складні квитки (≥2 помилок)' : '🔥 Error Blitz (≥2 mistakes)'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        {errorBlitzCount}
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
          QUICK TICKET JUMP MODAL (Direct Jump)
         ========================================================================= */}
      {isJumpModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setIsJumpModalOpen(false)}
              aria-hidden="true"
            />

            {/* Centering Viewport */}
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center pointer-events-none">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="jump-modal-title"
                className="relative w-full max-w-sm my-auto bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl text-left pointer-events-auto flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Modal Header */}
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <h3
                        id="jump-modal-title"
                        className="text-sm font-bold text-slate-900 dark:text-white leading-tight"
                      >
                        {showTranslation ? 'Швидкий перехід до квитка' : 'Quick Jump to Ticket'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {showTranslation
                          ? `Введіть номер від 1 до ${questions.length}`
                          : `Enter ticket # from 1 to ${questions.length}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsJumpModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
                    aria-label="Close jump modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  <form onSubmit={handleJumpSubmit} className="space-y-3.5">
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <span className="font-mono font-bold text-lg text-sky-500">#</span>
                        </div>
                        <input
                          ref={jumpInputRef}
                          type="number"
                          min="1"
                          max={questions.length}
                          step="1"
                          value={jumpInput}
                          onChange={(e) => {
                            setJumpInput(e.target.value);
                            if (jumpError) setJumpError(null);
                          }}
                          placeholder={`1 – ${questions.length}`}
                          className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xl font-mono font-bold text-slate-900 dark:text-white text-center tracking-wider focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                          autoComplete="off"
                        />
                      </div>

                      {jumpError && (
                        <p className="mt-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium text-center animate-in fade-in duration-150">
                          {jumpError}
                        </p>
                      )}
                    </div>

                    {/* Quick Preset Badges */}
                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleJumpToSpecific(1)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 transition text-center cursor-pointer active:scale-95"
                      >
                        #1 ({showTranslation ? 'Початок' : 'Start'})
                      </button>
                      <button
                        type="button"
                        onClick={handleRandomJump}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/50 text-[11px] font-semibold text-sky-700 dark:text-sky-300 transition text-center flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Shuffle className="w-3 h-3 text-sky-500" />
                        <span>{showTranslation ? 'Випадковий' : 'Random'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJumpToSpecific(questions.length)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 transition text-center cursor-pointer active:scale-95"
                      >
                        #{questions.length} ({showTranslation ? 'Кінець' : 'End'})
                      </button>
                    </div>

                    {selectedFilter !== 'all' && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/70 flex items-center gap-2 leading-tight">
                        <Filter className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>
                          {showTranslation
                            ? 'Якщо квиток поза поточною темою, фільтр скинеться на "Всі квитки".'
                            : 'If the ticket is outside current topic, filter will reset to "All Tickets".'}
                        </span>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20 active:scale-[0.98] transition cursor-pointer"
                      >
                        <span>{showTranslation ? 'Перейти до квитка' : 'Go to Ticket'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* =========================================================================
          UNIFIED THUMB-ZONE COMMAND DOCK (Fixed right above BottomNav or at screen bottom)
          Houses Confirm Option / Next / Prev / Try Again within thumb reach!
         ========================================================================= */}
      <div
        className={`fixed left-0 right-0 z-20 pointer-events-none pb-0.5 sm:pb-1 px-2.5 sm:px-4 transition-all duration-300 ease-in-out ${
          isScrollingDown
            ? 'bottom-[calc(0.35rem+env(safe-area-inset-bottom,0px))]'
            : 'bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="backdrop-blur-lg bg-white/95 dark:bg-[#131C2E]/95 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-1 sm:p-1.5 shadow-lg dark:shadow-2xl flex items-center justify-between gap-1.5 sm:gap-2 transition-colors">
            {/* Previous Button */}
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentQuestionIndex === 0}
              className="py-2 px-3 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-35 disabled:cursor-not-allowed transition active:scale-[0.98] cursor-pointer select-none"
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
                  className="flex-1 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 transition cursor-pointer select-none"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirm Option {selectedOptionId}</span>
                </button>
              ) : (
                /* Resting State: Ticket counter */
                <button
                  type="button"
                  onClick={() => setIsJumpModalOpen(true)}
                  className="flex-1 text-center px-2 flex flex-col items-center justify-center cursor-pointer group hover:opacity-90 transition active:scale-98"
                  title={showTranslation ? 'Натисніть для переходу до квитка' : 'Click to jump to ticket'}
                >
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 leading-none group-hover:text-sky-500 dark:group-hover:text-sky-400 transition">
                    {showTranslation
                      ? `Квиток #${currentQuestion.num}`
                      : `Ticket #${currentQuestion.num}`}
                    {filteredQuestions.length !== questions.length && (
                      <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 ml-1">
                        ({currentQuestionIndex + 1}/{filteredQuestions.length})
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-sans mt-0.5 leading-none">
                    {showTranslation ? 'Оберіть відповідь або натисніть для переходу' : 'Select an option or tap to jump'}
                  </span>
                </button>
              )
            ) : (
              /* Answered State: Try Again Button */
              <button
                type="button"
                onClick={handleResetAttempt}
                className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer select-none"
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
              className={`py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-35 disabled:cursor-not-allowed transition active:scale-[0.98] cursor-pointer select-none ${
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
