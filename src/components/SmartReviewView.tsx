import React, { useState, useMemo } from 'react';
import {
  Flame,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Play,
  TrendingUp,
  Zap,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Languages,
  X,
  Target,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { Question, QuestionProgress, QuizConfig } from '../types';
import { getQuestionMasteryInfo } from '../utils/mastery';
import { getCategoryTranslation } from '../utils/categories';

export type DiagnosticFilter = 'unstable' | 'needs_review' | 'improving' | 'mastered' | 'all_problem';

const formatTicketNoun = (cnt: number, isUa: boolean) => {
  if (!isUa) return `${cnt} ${cnt === 1 ? 'ticket' : 'tickets'}`;
  const mod10 = cnt % 10;
  const mod100 = cnt % 100;
  if (mod10 === 1 && mod100 !== 11) return `${cnt} квиток`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${cnt} квитки`;
  return `${cnt} квитків`;
};

const formatQuestionNoun = (cnt: number, isUa: boolean) => {
  if (!isUa) return `${cnt} ${cnt === 1 ? 'Q' : 'Qs'}`;
  const mod10 = cnt % 10;
  const mod100 = cnt % 100;
  if (mod10 === 1 && mod100 !== 11) return `${cnt} квиток`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${cnt} квитки`;
  return `${cnt} квитків`;
};

interface SmartReviewViewProps {
  questions: Question[];
  progressMap: Record<number, QuestionProgress>;
  showTranslation: boolean;
  onStartQuiz: (config: QuizConfig) => void;
  onJumpToTicket: (ticketNum: number) => void;
}

export const SmartReviewView: React.FC<SmartReviewViewProps> = ({
  questions,
  progressMap,
  showTranslation,
  onStartQuiz,
  onJumpToTicket,
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<DiagnosticFilter>('unstable');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  // Categorize questions by mastery status
  const {
    unstableQuestions,
    needsReviewQuestions,
    improvingQuestions,
    masteredQuestions,
    bookmarkedQuestions,
    attemptedCount,
  } = useMemo(() => {
    const unstable: { q: Question; p: QuestionProgress }[] = [];
    const needsReview: { q: Question; p: QuestionProgress }[] = [];
    const improving: { q: Question; p: QuestionProgress }[] = [];
    const mastered: { q: Question; p: QuestionProgress }[] = [];
    const bookmarked: Question[] = [];
    let attempted = 0;

    questions.forEach((q) => {
      const p = progressMap[q.id];
      if (p?.bookmarked) {
        bookmarked.push(q);
      }
      const mastery = getQuestionMasteryInfo(p);
      if (mastery.status !== 'unanswered') {
        attempted++;
      }

      if (mastery.status === 'unstable') {
        unstable.push({ q, p: p! });
      } else if (mastery.status === 'needs_review') {
        needsReview.push({ q, p: p! });
      } else if (mastery.status === 'improving') {
        improving.push({ q, p: p! });
      } else if (mastery.status === 'mastered') {
        mastered.push({ q, p: p! });
      }
    });

    // Sort by highest incorrect counts first for actionable remediation
    unstable.sort((a, b) => (b.p.incorrectCount || 0) - (a.p.incorrectCount || 0));
    needsReview.sort((a, b) => (b.p.incorrectCount || 0) - (a.p.incorrectCount || 0));
    improving.sort((a, b) => (b.p.incorrectCount || 0) - (a.p.incorrectCount || 0));

    return {
      unstableQuestions: unstable,
      needsReviewQuestions: needsReview,
      improvingQuestions: improving,
      masteredQuestions: mastered,
      bookmarkedQuestions: bookmarked,
      attemptedCount: attempted,
    };
  }, [questions, progressMap]);

  const totalProblemTickets = unstableQuestions.length + needsReviewQuestions.length;
  const unattemptedCount = Math.max(0, questions.length - attemptedCount);

  // Calculate clinical retention health index
  const retentionScore = attemptedCount > 0
    ? Math.round(((masteredQuestions.length * 1.0 + improvingQuestions.length * 0.5) / attemptedCount) * 100)
    : 0;

  // Active list items based on filter tab
  const baseList = useMemo(() => {
    switch (activeFilterTab) {
      case 'unstable':
        return unstableQuestions;
      case 'needs_review':
        return needsReviewQuestions;
      case 'improving':
        return improvingQuestions;
      case 'mastered':
        return masteredQuestions;
      case 'all_problem':
      default:
        return [...unstableQuestions, ...needsReviewQuestions];
    }
  }, [activeFilterTab, unstableQuestions, needsReviewQuestions, improvingQuestions, masteredQuestions]);

  // Filter by search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return baseList;
    const qLower = searchQuery.toLowerCase().trim();
    return baseList.filter(({ q }) => {
      const matchNum = q.num.toString().includes(qLower);
      const matchEn = q.questionEn.toLowerCase().includes(qLower);
      const matchUa = (q.questionUa || '').toLowerCase().includes(qLower);
      const matchCat = q.category.toLowerCase().includes(qLower);
      return matchNum || matchEn || matchUa || matchCat;
    });
  }, [baseList, searchQuery]);

  const displayedList = filteredList.slice(0, visibleCount);

  // Drill launch handlers
  const handleStartUnstableDrill = () => {
    if (unstableQuestions.length === 0) return;
    onStartQuiz({
      mode: 'unstable',
      startTicket: 1,
      endTicket: 807,
      questionCount: Math.min(25, unstableQuestions.length),
      shuffle: true,
      instantFeedback: true,
      showExplanations: true,
    });
  };

  const handleStartNeedsReviewDrill = () => {
    if (needsReviewQuestions.length === 0) return;
    onStartQuiz({
      mode: 'failed',
      startTicket: 1,
      endTicket: 807,
      questionCount: Math.min(25, needsReviewQuestions.length),
      shuffle: true,
      instantFeedback: true,
      showExplanations: true,
    });
  };

  const handleStartSpacedRepetition = () => {
    onStartQuiz({
      mode: 'spaced',
      startTicket: 1,
      endTicket: 807,
      questionCount: 20,
      shuffle: true,
      instantFeedback: true,
      showExplanations: true,
    });
  };

  const handleStartBookmarkedDrill = () => {
    if (bookmarkedQuestions.length === 0) return;
    onStartQuiz({
      mode: 'bookmarked',
      startTicket: 1,
      endTicket: 807,
      questionCount: Math.min(25, bookmarkedQuestions.length),
      shuffle: true,
      instantFeedback: true,
      showExplanations: true,
    });
  };

  const handleStartBaselineDiagnostic = () => {
    onStartQuiz({
      mode: 'range',
      startTicket: 1,
      endTicket: 20,
      questionCount: 20,
      shuffle: true,
      instantFeedback: true,
      showExplanations: true,
    });
  };

  // Determine dynamic hero card state based on student retention priority
  type HeroKind = 'unstable' | 'failed' | 'baseline' | 'shield' | 'spaced';

  const heroState: {
    kind: HeroKind;
    titleEn: string;
    titleUa: string;
    descEn: string;
    descUa: string;
    ctaEn: string;
    ctaUa: string;
    count: number;
    badgeText: string;
    onAction: () => void;
    accentGlow: string;
    icon: React.ElementType;
  } = useMemo(() => {
    if (attemptedCount === 0) {
      return {
        kind: 'baseline',
        titleEn: 'Baseline Readiness Diagnostic',
        titleUa: 'Стартовий діагностичний тест',
        descEn: 'Answer 20 foundational questions with instant clinical explanations to calibrate your adaptive spaced engine.',
        descUa: 'Дайте відповідь на 20 базових питань з клінічними поясненнями для налаштування адаптивного алгоритму.',
        ctaEn: `Start Diagnostic (${formatQuestionNoun(20, false)})`,
        ctaUa: `Почати діагностику (${formatQuestionNoun(20, true)})`,
        count: 20,
        badgeText: 'Calibration',
        onAction: handleStartBaselineDiagnostic,
        accentGlow: 'from-indigo-600 via-indigo-700 to-sky-700 shadow-indigo-500/20',
        icon: Sparkles,
      };
    }

    if (unstableQuestions.length > 0) {
      const count = Math.min(25, unstableQuestions.length);
      return {
        kind: 'unstable',
        titleEn: 'Targeted Stabilization Drill',
        titleUa: 'Стабілізація нестабільних квитків',
        descEn: `Practice ${formatTicketNoun(count, false)} with mixed attempt history until correct answers consistently predominate.`,
        descUa: `Опрацюйте ${formatTicketNoun(count, true)} із нестабільними результатами, доки правильні відповіді не почнуть переважати.`,
        ctaEn: `Launch Adaptive Drill (${formatQuestionNoun(count, false)})`,
        ctaUa: `Запустити тест (${formatQuestionNoun(count, true)})`,
        count,
        badgeText: 'High Priority',
        onAction: handleStartUnstableDrill,
        accentGlow: 'from-amber-600 via-amber-700 to-orange-700 shadow-amber-500/20',
        icon: Zap,
      };
    }

    if (needsReviewQuestions.length > 0) {
      const count = Math.min(25, needsReviewQuestions.length);
      return {
        kind: 'failed',
        titleEn: 'Remediate Missed Mistakes',
        titleUa: 'Опрацювання помилок',
        descEn: `You have ${formatTicketNoun(needsReviewQuestions.length, false)} with 0% accuracy. Target and correct these misconceptions with rationales.`,
        descUa: `У вас ${formatTicketNoun(needsReviewQuestions.length, true)} із 0% успішністю. Виправте помилки за допомогою клінічних пояснень.`,
        ctaEn: `Launch Error Drill (${formatQuestionNoun(count, false)})`,
        ctaUa: `Запустити роботу над помилками (${formatQuestionNoun(count, true)})`,
        count,
        badgeText: 'Mistakes',
        onAction: handleStartNeedsReviewDrill,
        accentGlow: 'from-rose-600 via-rose-700 to-pink-700 shadow-rose-500/20',
        icon: Flame,
      };
    }

    if (totalProblemTickets === 0 && masteredQuestions.length > 0) {
      return {
        kind: 'shield',
        titleEn: 'Retention Shield 100% Active',
        titleUa: 'Щит пам’яті активний на 100%',
        descEn: 'All attempted tickets meet the clinical benchmark (≥80% accuracy). Reinforce neural retention with a spaced mix.',
        descUa: 'Всі пройдені квитки відповідають нормативу (≥80% успішності). Закріпіть знання інтервальним міксом.',
        ctaEn: `Spaced Maintenance Mix (${formatQuestionNoun(20, false)})`,
        ctaUa: `Інтервальне повторення (${formatQuestionNoun(20, true)})`,
        count: 20,
        badgeText: 'Mastery Maintained',
        onAction: handleStartSpacedRepetition,
        accentGlow: 'from-emerald-600 via-teal-700 to-emerald-800 shadow-emerald-500/20',
        icon: ShieldCheck,
      };
    }

    return {
      kind: 'spaced',
      titleEn: 'Daily Spaced Retention Mix',
      titleUa: 'Щоденний мікс інтервального повторення',
      descEn: 'Algorithmic mix prioritizing least-reviewed concepts and mixed results for maximum exam readiness.',
      descUa: 'Алгоритмічний мікс найменш повторюваних тем для максимальної готовності до іспиту.',
      ctaEn: `Start Daily Mix (${formatQuestionNoun(20, false)})`,
      ctaUa: `Почати щоденний мікс (${formatQuestionNoun(20, true)})`,
      count: 20,
      badgeText: 'Algorithmic Mix',
      onAction: handleStartSpacedRepetition,
      accentGlow: 'from-sky-600 via-indigo-700 to-blue-800 shadow-sky-500/20',
      icon: TrendingUp,
    };
  }, [
    attemptedCount,
    unstableQuestions.length,
    needsReviewQuestions.length,
    totalProblemTickets,
    masteredQuestions.length,
  ]);

  const HeroIcon = heroState.icon;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-28 sm:pb-32 space-y-5">
      {/* =========================================================================
          PAGE HEADER: Adaptive Retention Diagnostics
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {showTranslation ? 'Адаптивне повторення та закріплення' : 'Smart Adaptive Review & Retention'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {showTranslation
              ? 'Алгоритмічно усуває нестабільні відповіді та помилки до досягнення клінічного нормативу ≥80%.'
              : 'Target fluctuating tickets and missed concepts until you reach the ≥80% clinical mastery benchmark.'}
          </p>
        </div>

        {/* Global summary chip */}
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-2.5 py-1 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Target className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>
            {attemptedCount} / {questions.length}{' '}
            <span className="text-slate-400 font-normal">
              ({Math.round((attemptedCount / questions.length) * 100)}% {showTranslation ? 'пройдено' : 'attempted'})
            </span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          RETENTION HEALTH CONTINUUM (Macro Multi-Segment Bar)
         ========================================================================= */}
      <section
        aria-label={showTranslation ? 'Індекс клінічної пам’яті' : 'Clinical Retention Index'}
        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{showTranslation ? 'Індекс клінічної пам’яті:' : 'Clinical Retention Index:'}</span>
            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 ml-0.5">
              {retentionScore}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {masteredQuestions.length} {showTranslation ? 'засвоєно (≥80%)' : 'mastered (≥80%)'}
          </span>
        </div>

        {/* Multi-Segment Health Continuum Bar */}
        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          {masteredQuestions.length > 0 && (
            <div
              style={{ width: `${(masteredQuestions.length / questions.length) * 100}%` }}
              className="h-full bg-emerald-500 transition-all duration-300"
              title={`Mastered: ${masteredQuestions.length}`}
            />
          )}
          {improvingQuestions.length > 0 && (
            <div
              style={{ width: `${(improvingQuestions.length / questions.length) * 100}%` }}
              className="h-full bg-sky-500 transition-all duration-300"
              title={`Improving: ${improvingQuestions.length}`}
            />
          )}
          {unstableQuestions.length > 0 && (
            <div
              style={{ width: `${(unstableQuestions.length / questions.length) * 100}%` }}
              className="h-full bg-amber-500 transition-all duration-300"
              title={`Unstable: ${unstableQuestions.length}`}
            />
          )}
          {needsReviewQuestions.length > 0 && (
            <div
              style={{ width: `${(needsReviewQuestions.length / questions.length) * 100}%` }}
              className="h-full bg-rose-500 transition-all duration-300"
              title={`Needs Review: ${needsReviewQuestions.length}`}
            />
          )}
        </div>

        {/* Legend / Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold">{masteredQuestions.length}</span>
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {showTranslation ? 'Засвоєно' : 'Mastered'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <span className="font-bold">{improvingQuestions.length}</span>
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {showTranslation ? 'Покращується' : 'Improving'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold">{unstableQuestions.length}</span>
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {showTranslation ? 'Нестабільні' : 'Unstable'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="font-bold">{needsReviewQuestions.length}</span>
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {showTranslation ? 'Помилки' : 'Needs Review'}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DYNAMIC ADAPTIVE HERO CARD (Primary Leveraged Action)
         ========================================================================= */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white bg-gradient-to-br ${heroState.accentGlow} shadow-lg transition-all`}
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10.5px] font-bold uppercase tracking-wider text-white">
                {heroState.badgeText}
              </span>
              <div className="flex items-center gap-1 text-white/80 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>~{Math.round(heroState.count * 0.5)} min</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <HeroIcon className="w-5 h-5 shrink-0 text-white fill-current" />
                <h3 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-snug">
                  {showTranslation ? heroState.titleUa : heroState.titleEn}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed mt-1 max-w-xl">
                {showTranslation ? heroState.descUa : heroState.descEn}
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
            <button
              onClick={heroState.onAction}
              className="w-full sm:w-auto whitespace-nowrap min-h-[46px] sm:min-h-[48px] px-6 py-3 rounded-2xl bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-md hover:bg-slate-100 active:scale-[0.98] transition flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-slate-900 shrink-0" />
              <span>{showTranslation ? heroState.ctaUa : heroState.ctaEn}</span>
            </button>
          </div>
        </div>

        {/* Decorative background watermark icon */}
        <HeroIcon className="absolute -bottom-6 -right-6 w-32 h-32 sm:w-40 sm:h-40 text-white/10 pointer-events-none stroke-[1]" />
      </div>

      {/* =========================================================================
          SECONDARY UTILITY DECK (Clean, Ergonomic Practice Tiles)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Daily Spaced Mix Tile */}
        <button
          onClick={handleStartSpacedRepetition}
          className="min-h-[56px] p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between text-left transition cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {showTranslation ? 'Щоденний інтервальний мікс' : 'Daily Spaced Repetition'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {showTranslation ? '20 квитків за інтервальним алгоритмом' : '20 algorithmic reinforcement tickets'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
        </button>

        {/* Secondary Utility Slot 2: Starred Practice OR Companion Error Drill */}
        {bookmarkedQuestions.length > 0 ? (
          <button
            onClick={handleStartBookmarkedDrill}
            className="min-h-[56px] p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Bookmark className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {showTranslation ? 'Повторити збережені квитки' : 'Practice Starred Tickets'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {formatTicketNoun(bookmarkedQuestions.length, showTranslation)} {showTranslation ? 'у закладках' : 'ready'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
          </button>
        ) : heroState.kind === 'unstable' && needsReviewQuestions.length > 0 ? (
          /* When Hero is addressing Unstable tickets, offer Missed Mistakes Drill as the companion tile */
          <button
            onClick={handleStartNeedsReviewDrill}
            className="min-h-[56px] p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {showTranslation ? 'Експрес-тест помилок' : 'Focused Error Drill'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {formatTicketNoun(needsReviewQuestions.length, showTranslation)} {showTranslation ? 'потребують повторення' : 'need review'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
          </button>
        ) : (
          /* Starred Tickets placeholder (disabled when 0 saved) */
          <button
            disabled
            className="min-h-[56px] p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between text-left opacity-60 cursor-not-allowed group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {showTranslation ? 'Повторити збережені квитки' : 'Practice Starred Tickets'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {showTranslation ? '0 збережених квитків у закладках' : '0 starred tickets saved'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 ml-2" />
          </button>
        )}
      </div>

      {/* =========================================================================
          INTERACTIVE DIAGNOSTIC EXPLORER (Zero-Scroll Responsive Matrix + Header Search)
         ========================================================================= */}
      <div className="space-y-3 pt-2">
        {/* Section Header: Title + Dynamic Counter (Left) & Search Bar (Right on Desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="sm:hidden">
                {showTranslation ? 'Діагностика квитків' : 'Retention Diagnostics'}
              </span>
              <span className="hidden sm:inline">
                {showTranslation ? 'Діагностика квитків за статусом' : 'Ticket Retention Diagnostics'}
              </span>
            </h3>

            {/* Dynamic Context Counter Badge */}
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 text-[10.5px] font-mono font-medium text-slate-600 dark:text-slate-300">
              {searchQuery.trim() ? (
                <>
                  {filteredList.length} <span className="text-slate-400">/ {baseList.length}</span>
                </>
              ) : (
                `${filteredList.length} ${showTranslation ? 'кв.' : 'items'}`
              )}
            </span>
          </div>

          {/* Search Input: Full-width on Mobile, Compact 260px on Desktop */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              aria-label={
                showTranslation
                  ? 'Пошук за номером квитка, темою чи словом'
                  : 'Search ticket #, concept, or keyword'
              }
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(20);
              }}
              placeholder={
                showTranslation
                  ? 'Пошук за № (#142), темою чи словом...'
                  : 'Search ticket # (e.g. 142), topic...'
              }
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/25 transition shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label={showTranslation ? 'Очистити пошук' : 'Clear search'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Responsive Filter Control (Single Container: CSS Grid on Mobile, Unified Flex Bar on Desktop) */}
        <div
          role="tablist"
          aria-label={showTranslation ? 'Фільтр квитків за статусом' : 'Filter tickets by status'}
          className="grid grid-cols-6 sm:flex sm:items-center gap-1.5 sm:gap-2"
        >
          {/* 1. Unstable: col-span-2 on mobile, flex-1 on desktop */}
          <button
            role="tab"
            aria-selected={activeFilterTab === 'unstable'}
            onClick={() => {
              setActiveFilterTab('unstable');
              setVisibleCount(20);
            }}
            className={`col-span-2 sm:col-auto sm:flex-1 min-h-[38px] sm:min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-xl text-[10.5px] xs:text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
              activeFilterTab === 'unstable'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                : 'bg-white dark:bg-[#131C2E] border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <span className="truncate">⚡ {showTranslation ? 'Нестабільні' : 'Unstable'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] sm:text-[10px] font-bold font-mono shrink-0 ${
                activeFilterTab === 'unstable'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {unstableQuestions.length}
            </span>
          </button>

          {/* 2. Needs Review: col-span-2 on mobile, flex-1 on desktop */}
          <button
            role="tab"
            aria-selected={activeFilterTab === 'needs_review'}
            onClick={() => {
              setActiveFilterTab('needs_review');
              setVisibleCount(20);
            }}
            className={`col-span-2 sm:col-auto sm:flex-1 min-h-[38px] sm:min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-xl text-[10.5px] xs:text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
              activeFilterTab === 'needs_review'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                : 'bg-white dark:bg-[#131C2E] border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <span className="truncate">✗ {showTranslation ? 'Помилки' : 'Needs Review'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] sm:text-[10px] font-bold font-mono shrink-0 ${
                activeFilterTab === 'needs_review'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {needsReviewQuestions.length}
            </span>
          </button>

          {/* 3. All Issues: col-span-2 on mobile, flex-1 on desktop */}
          <button
            role="tab"
            aria-selected={activeFilterTab === 'all_problem'}
            onClick={() => {
              setActiveFilterTab('all_problem');
              setVisibleCount(20);
            }}
            className={`col-span-2 sm:col-auto sm:flex-1 min-h-[38px] sm:min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-xl text-[10.5px] xs:text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
              activeFilterTab === 'all_problem'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white font-bold shadow-xs'
                : 'bg-white dark:bg-[#131C2E] border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <span className="truncate">⚠️ {showTranslation ? 'Всі проблеми' : 'All Issues'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] sm:text-[10px] font-bold font-mono shrink-0 ${
                activeFilterTab === 'all_problem'
                  ? 'bg-white/20 dark:bg-slate-900/20 text-current'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {totalProblemTickets}
            </span>
          </button>

          {/* 4. Improving: col-span-3 on mobile, flex-1 on desktop */}
          <button
            role="tab"
            aria-selected={activeFilterTab === 'improving'}
            onClick={() => {
              setActiveFilterTab('improving');
              setVisibleCount(20);
            }}
            className={`col-span-3 sm:col-auto sm:flex-1 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-2.5 py-1.5 rounded-xl text-[10.5px] xs:text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
              activeFilterTab === 'improving'
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                : 'bg-white dark:bg-[#131C2E] border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <span className="truncate">↗ {showTranslation ? 'Покращується' : 'Improving'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] sm:text-[10px] font-bold font-mono shrink-0 ${
                activeFilterTab === 'improving'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {improvingQuestions.length}
            </span>
          </button>

          {/* 5. Mastered: col-span-3 on mobile, flex-1 on desktop */}
          <button
            role="tab"
            aria-selected={activeFilterTab === 'mastered'}
            onClick={() => {
              setActiveFilterTab('mastered');
              setVisibleCount(20);
            }}
            className={`col-span-3 sm:col-auto sm:flex-1 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-2.5 py-1.5 rounded-xl text-[10.5px] xs:text-[11px] sm:text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 border min-w-0 ${
              activeFilterTab === 'mastered'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                : 'bg-white dark:bg-[#131C2E] border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <span className="truncate">✓ {showTranslation ? 'Засвоєно' : 'Mastered'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] sm:text-[10px] font-bold font-mono shrink-0 ${
                activeFilterTab === 'mastered'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {masteredQuestions.length}
            </span>
          </button>
        </div>

        {/* =========================================================================
            TICKET DIAGNOSTIC CARDS (High-Density Ergonomic Bilingual Flashcards)
           ========================================================================= */}
        {filteredList.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-400 space-y-2">
            {attemptedCount === 0 ? (
              <>
                <Sparkles className="w-9 h-9 text-indigo-500 mx-auto" />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {showTranslation ? 'Адаптивний модуль готовий до калібрування' : 'Adaptive Engine Ready to Calibrate'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {showTranslation
                    ? 'Почніть вивчення квитків або пройдіть базовий тест, і тут автоматично з’являться аналітичні дані.'
                    : 'Study tickets or launch a quiz to begin tracking retention accuracy and spaced repetition metrics.'}
                </p>
                <button
                  onClick={handleStartBaselineDiagnostic}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{showTranslation ? 'Пройти базовий тест' : 'Start Baseline Diagnostic'}</span>
                </button>
              </>
            ) : totalProblemTickets === 0 && (activeFilterTab === 'unstable' || activeFilterTab === 'needs_review' || activeFilterTab === 'all_problem') ? (
              <>
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {showTranslation ? 'У цьому списку немає проблемних квитків!' : 'No Problem Tickets in this Category!'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {showTranslation
                    ? 'Всі ваші опрацьовані квитки досягли високого рівня точності. Перегляньте категорію «Покращується» або «Засвоєно».'
                    : 'All attempted tickets have graduated to higher retention tiers. Inspect Improving or Mastered tabs.'}
                </p>
                <button
                  onClick={() => setActiveFilterTab('improving')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <span>{showTranslation ? 'Переглянути квитки, що покращуються' : 'View Improving Tickets'}</span>
                </button>
              </>
            ) : (
              <>
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-medium text-xs text-slate-600 dark:text-slate-300">
                  {showTranslation ? 'За вашим запитом нічого не знайдено' : 'No tickets match your search criteria'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-sky-500 font-semibold hover:underline mt-1"
                  >
                    {showTranslation ? 'Очистити пошук' : 'Clear search query'}
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedList.map(({ q, p }) => {
              const mastery = getQuestionMasteryInfo(p);
              const categoryLabel = showTranslation ? getCategoryTranslation(q.category) : q.category;

              return (
                <div
                  key={q.id}
                  onClick={() => onJumpToTicket(q.num)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ticket #${q.num}: ${q.questionEn}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onJumpToTicket(q.num);
                    }
                  }}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800/90 hover:border-sky-500/50 dark:hover:border-sky-500/40 active:scale-[0.99] active:bg-slate-50/80 dark:active:bg-slate-800/40 cursor-pointer transition shadow-xs flex items-center justify-between gap-2.5 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                  title="Click to open ticket in Study Mode"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Meta Row: Unified single line on Desktop, 2 lines on Mobile */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white shrink-0">
                          #{q.num}
                        </span>

                        {/* Mastery Status Badge */}
                        <span
                          className={`text-[10px] sm:text-[10.5px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 shrink-0 ${mastery.badgeClass}`}
                        >
                          {showTranslation ? mastery.shortLabelUa : mastery.shortLabelEn}
                        </span>

                        {/* Desktop Category Micro-Breadcrumb (Inline on sm+) */}
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-700 shrink-0">•</span>
                        <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 min-w-0 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                          <span className="truncate">{categoryLabel}</span>
                        </div>
                      </div>

                      {/* Accuracy & Attempt Counts */}
                      <span className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
                        {p.correctCount || 0}✓ <span className="text-rose-500">{p.incorrectCount || 0}✗</span>{' '}
                        <span className="text-slate-400">({mastery.accuracy}%)</span>
                      </span>
                    </div>

                    {/* Mobile-Only Category Micro-Breadcrumb (Preserves 2-line clarity on mobile) */}
                    <div className="sm:hidden text-[10.5px] font-medium text-sky-600 dark:text-sky-400 truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span className="truncate">{categoryLabel}</span>
                    </div>

                    {/* Question Stem (English) */}
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-relaxed">
                      {q.questionEn}
                    </p>

                    {/* Question Stem (Ukrainian Translation when enabled) */}
                    {showTranslation && q.questionUa && (
                      <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed flex items-start gap-1.5 pl-2 border-l-2 border-sky-400/40 dark:border-sky-500/30 pt-0.5">
                        <Languages className="w-3 h-3 text-sky-500 shrink-0 mt-0.5" />
                        <span>{q.questionUa}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Zone: Study Action / Navigation Indicator */}
                  <div className="shrink-0 flex items-center gap-1 sm:gap-2 pl-0.5">
                    <span className="hidden md:inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 group-hover:bg-sky-500 group-hover:text-white transition">
                      {showTranslation ? 'Вчити' : 'Study'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {filteredList.length > visibleCount && (
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs active:scale-95"
                >
                  {showTranslation
                    ? `Показати ще 20 (залишилось ${filteredList.length - visibleCount})`
                    : `Show 20 More (${filteredList.length - visibleCount} remaining)`}
                </button>
                <button
                  onClick={() => setVisibleCount(filteredList.length)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  {showTranslation ? 'Показати всі' : 'Show All'} ({filteredList.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
