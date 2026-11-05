import React, { useState, useEffect } from 'react';
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
  Hash,
  Filter,
  Check,
  Edit3,
  FolderPlus,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { CustomGroup, Question, QuestionProgress } from '../types';
import { getQuestionMasteryInfo } from '../utils/mastery';

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
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

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
    if (selectedFilter === 'status:unstable') return showTranslation ? '⚡ Нестабільні питання' : '⚡ Unstable Tickets';
    if (selectedFilter === 'status:needs_review') return showTranslation ? '✗ Потребують повторення' : '✗ Needs Review';
    if (selectedFilter === 'status:improving') return showTranslation ? '↗ Покращуються' : '↗ Improving';
    if (selectedFilter === 'status:mastered') return showTranslation ? '✓ Засвоєні (≥80%)' : '✓ Mastered (≥80%)';
    if (selectedFilter === 'status:bookmarked') return showTranslation ? '🔖 Збережені' : '🔖 Bookmarked';
    return selectedFilter;
  }, [selectedFilter, customGroups, showTranslation]);

  const currentQuestion = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];
  const qProgress = currentQuestion ? progressMap[currentQuestion.id] : undefined;
  const isBookmarked = !!qProgress?.bookmarked;

  // Find groups assigned to this current question
  const assignedGroups = React.useMemo(() => {
    if (!currentQuestion) return [];
    return customGroups.filter((g) => g.questionIds.includes(currentQuestion.id));
  }, [customGroups, currentQuestion?.id]);

  // Sync state when current question changes - opens with a clean slate each time
  useEffect(() => {
    if (currentQuestion) {
      setSelectedOptionId(null);
      setHasSubmittedAnswer(false);
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, filteredQuestions.length, currentQuestion, onToggleTranslation, onToggleHints]);

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
        // Swiped Left -> Next ticket
        goToNext();
      } else {
        // Swiped Right -> Previous ticket
        goToPrev();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleOptionClick = (optionId: string) => {
    // If answer was already submitted and user selects an option, allow testing this option freshly
    if (hasSubmittedAnswer) {
      setHasSubmittedAnswer(false);
    }
    setSelectedOptionId(optionId);
  };

  const handleResetAttempt = () => {
    setSelectedOptionId(null);
    setHasSubmittedAnswer(false);
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
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3">
        <p className="text-slate-500 text-sm">No tickets match this filter selection.</p>
        <button
          onClick={() => {
            onSelectFilter('all');
            onQuestionIndexChange(0);
          }}
          className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold"
        >
          Reset Filter to All Tickets
        </button>
      </div>
    );
  }

  const currentMastery = getQuestionMasteryInfo(qProgress);

  return (
    <div className="max-w-2xl mx-auto pb-24 pt-4 px-4">
      {/* Active Filter Indicator if filtered from Header */}
      {selectedFilter !== 'all' && (
        <div className="flex items-center justify-between mb-3 px-3.5 py-2 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 text-xs text-sky-950 dark:text-sky-200 shadow-2xs">
          <span className="flex items-center gap-1.5 truncate">
            <Filter className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400">Filter:</span>
            <strong className="font-semibold truncate">
              {filterLabel}
            </strong>
            <span className="text-[11px] text-sky-600 dark:text-sky-400 shrink-0">
              ({filteredQuestions.length} tickets)
            </span>
          </span>
          <button
            onClick={() => onSelectFilter('all')}
            className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline shrink-0 ml-2"
          >
            Show All (807)
          </button>
        </div>
      )}

      {/* Progress Bar & Counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-slate-900 dark:text-white">
              Ticket #{currentQuestion.num}
            </span>
            <span className="text-[11px] text-slate-400">
              ({currentQuestionIndex + 1} of {filteredQuestions.length})
            </span>
          </span>
          <span className="text-[11px]">
            {Math.round(((currentQuestionIndex + 1) / filteredQuestions.length) * 100)}%
            complete
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300 rounded-full"
            style={{
              width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: slideDirection === 'right' ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: slideDirection === 'right' ? -24 : 24 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800/90 rounded-2xl shadow-sm dark:shadow-2xl dark:shadow-black/40 overflow-hidden touch-pan-y"
        >
          {/* Card Header with Category, Groups, and Bookmark */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/30">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 truncate max-w-[210px]">
              {currentQuestion.category}
            </span>

            <div className="flex items-center gap-1.5">
              {currentMastery.status !== 'unanswered' && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${currentMastery.badgeClass}`}
                  title={showTranslation ? currentMastery.explanationUa : currentMastery.explanationEn}
                >
                  {showTranslation ? currentMastery.labelUa : currentMastery.labelEn}
                </span>
              )}

              {/* Collections Button right on question */}
              <button
                onClick={() => onOpenGroupModal(currentQuestion.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition ${
                  assignedGroups.length > 0
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Add or remove ticket from custom study collections (G)"
                aria-label="Manage collections"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {assignedGroups.length > 0
                    ? `In ${assignedGroups.length} Collections`
                    : '+ Collection'}
                </span>
                <span className="sm:hidden">
                  {assignedGroups.length > 0 ? assignedGroups.length : '+'}
                </span>
              </button>

              {/* Bookmark button */}
              <button
                onClick={() => onToggleBookmark(currentQuestion.id)}
                className={`p-1.5 rounded-lg transition ${
                  isBookmarked
                    ? 'text-amber-500 bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this ticket (B)'}
                aria-label="Bookmark ticket"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                {currentQuestion.questionEn}
              </h2>

              {/* Ukrainian Translation Block (Optional reference) */}
              {showTranslation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-xs sm:text-sm text-sky-900 dark:text-sky-200"
                >
                  <p className="font-medium flex items-center gap-1.5 mb-1 text-[11px] text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                    <Languages className="w-3.5 h-3.5" />
                    Ukrainian Reference Translation:
                  </p>
                  <p className="leading-relaxed">{currentQuestion.questionUa}</p>
                </motion.div>
              )}
            </div>

            {/* Options list */}
            <div className="space-y-2 pt-2">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const isCorrect = opt.id === currentQuestion.correctOptionId;

                let optStyle =
                  'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700';

                if (hasSubmittedAnswer) {
                  if (isCorrect) {
                    optStyle =
                      'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500';
                  } else if (isSelected && !isCorrect) {
                    optStyle =
                      'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500';
                  } else {
                    optStyle =
                      'border-slate-200 dark:border-slate-800/50 opacity-60 text-slate-500 dark:text-slate-400';
                  }
                } else if (isSelected) {
                  optStyle =
                    'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500';
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionClick(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative group cursor-pointer ${optStyle}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition ${
                        hasSubmittedAnswer && isCorrect
                          ? 'bg-emerald-500 text-white'
                          : hasSubmittedAnswer && isSelected && !isCorrect
                          ? 'bg-rose-500 text-white'
                          : isSelected
                          ? 'bg-sky-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                      }`}
                    >
                      {opt.id}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium leading-relaxed">
                        {opt.textEn}
                      </div>
                      {showTranslation && (
                        <div className="text-[11px] sm:text-xs text-sky-700 dark:text-sky-300/80 mt-1">
                          {opt.textUa}
                        </div>
                      )}
                    </div>

                    {hasSubmittedAnswer && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    {hasSubmittedAnswer && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Confirmation / Result Action Banner */}
            {!hasSubmittedAnswer ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAnswer}
                  disabled={!selectedOptionId}
                  className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {selectedOptionId
                      ? `Confirm Option ${selectedOptionId}`
                      : 'Select an Option, then Confirm'}
                  </span>
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-1.5">
                  Click any option to test yourself. The result is only revealed and recorded once confirmed.
                </p>
              </div>
            ) : (
              <div
                className={`p-3 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold ${
                  selectedOptionId === currentQuestion.correctOptionId
                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20'
                }`}
              >
                <div className="flex items-start sm:items-center gap-2 min-w-0">
                  {selectedOptionId === currentQuestion.correctOptionId ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 sm:mt-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>
                        {selectedOptionId === currentQuestion.correctOptionId
                          ? (showTranslation ? 'Правильно!' : 'Correct!')
                          : (showTranslation
                              ? `Неправильно (Правильна: ${currentQuestion.correctOptionId})`
                              : `Incorrect (Correct answer: Option ${currentQuestion.correctOptionId})`)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${currentMastery.badgeClass}`}
                      >
                        {showTranslation ? currentMastery.labelUa : currentMastery.labelEn}
                      </span>
                    </div>
                    <p className="text-[10.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                      {showTranslation ? currentMastery.explanationUa : currentMastery.explanationEn}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetAttempt}
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 shrink-0 shadow-2xs active:scale-95"
                  title="Try this question again"
                >
                  <RotateCcw className="w-3 h-3 text-sky-500" />
                  <span>{showTranslation ? 'Спробувати знову' : 'Try Again'}</span>
                </button>
              </div>
            )}

            {/* Action Bar for Personal Notes & Rationale */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsEditingNote((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                  noteText
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{noteText ? 'Personal Note (Saved)' : 'Add Personal Note'}</span>
              </button>

              {hasSubmittedAnswer && !showHints && (
                <button
                  onClick={() => setIsExplanationExpanded((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isExplanationExpanded ? 'Hide Rationale' : 'Show Rationale'}</span>
                </button>
              )}
            </div>

            {/* Note Editor */}
            {isEditingNote && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write personal study notes for this ticket..."
                  rows={2}
                  className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      onSaveNote(currentQuestion.id, noteText);
                      setIsEditingNote(false);
                    }}
                    className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-md flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Save Note
                  </button>
                </div>
              </div>
            )}

            {/* Clinical Rationale and Memory Aid Block */}
            {(showHints || (hasSubmittedAnswer && isExplanationExpanded)) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2.5 pt-2"
              >
                {/* Clinical Rationale */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1 text-xs">
                    <HelpCircle className="w-4 h-4" />
                    <span>Clinical Rationale & Explanation:</span>
                  </div>
                  <p className="leading-relaxed">{currentQuestion.explanation}</p>
                </div>

                {/* How to Remember Mnemonic */}
                {currentQuestion.howToRemember && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-800 dark:text-slate-200">
                    <div className="font-semibold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1 text-xs">
                      <span>🧠 Memory Aid / Mnemonic:</span>
                    </div>
                    <p className="leading-relaxed">{currentQuestion.howToRemember}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons: Previous & Next */}
      <div className="flex items-center justify-between gap-3 mt-4">
        <button
          onClick={goToPrev}
          disabled={currentQuestionIndex === 0}
          className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121927] text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800/60 transition shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-center px-2 text-[11px] text-slate-400 hidden sm:block">
          Use ← / → keys or swipe
        </div>

        <button
          onClick={goToNext}
          disabled={currentQuestionIndex === filteredQuestions.length - 1}
          className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shadow-sky-500/20"
        >
          <span>Next Ticket</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
