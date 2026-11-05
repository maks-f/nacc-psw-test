import React from 'react';
import {
  Flame,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Question, QuestionProgress, QuizConfig } from '../types';
import { getQuestionMasteryInfo } from '../utils/mastery';

interface SmartReviewViewProps {
  questions: Question[];
  progressMap: Record<number, QuestionProgress>;
  onStartQuiz: (config: QuizConfig) => void;
  onJumpToTicket: (ticketNum: number) => void;
}

export const SmartReviewView: React.FC<SmartReviewViewProps> = ({
  questions,
  progressMap,
  onStartQuiz,
  onJumpToTicket,
}) => {
  // Compute accurate memory buckets using getQuestionMasteryInfo
  const unstableQuestions: { q: Question; p: QuestionProgress }[] = [];
  const needsReviewQuestions: { q: Question; p: QuestionProgress }[] = [];
  const improvingQuestions: { q: Question; p: QuestionProgress }[] = [];
  const masteredQuestions: { q: Question; p: QuestionProgress }[] = [];
  const bookmarkedQuestions: Question[] = [];

  questions.forEach((q) => {
    const p = progressMap[q.id];
    if (p?.bookmarked) {
      bookmarkedQuestions.push(q);
    }
    const mastery = getQuestionMasteryInfo(p);
    if (mastery.status === 'unstable') {
      unstableQuestions.push({ q, p: p! });
    } else if (mastery.status === 'needs_review') {
      needsReviewQuestions.push({ q, p: p! });
    } else if (mastery.status === 'improving') {
      improvingQuestions.push({ q, p: p! });
    } else if (mastery.status === 'mastered') {
      masteredQuestions.push({ q, p: p! });
    }
  });

  // Sort unstable and missed questions by mistake count and lowest accuracy
  unstableQuestions.sort((a, b) => (b.p.incorrectCount || 0) - (a.p.incorrectCount || 0));
  needsReviewQuestions.sort((a, b) => (b.p.incorrectCount || 0) - (a.p.incorrectCount || 0));

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

  const totalProblemTickets = unstableQuestions.length + needsReviewQuestions.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Intro Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Smart Adaptive Review & Retention
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Prioritizes unstable tickets (fluctuating correct/wrong answers) and missed questions until you reach ≥80% mastery.
        </p>
      </div>

      {/* Memory Status Cards (4 Quadrants) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-center">
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {unstableQuestions.length}
          </div>
          <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mt-0.5">
            ⚡ Unstable
          </div>
          <div className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Correct ≤ Mistakes
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {needsReviewQuestions.length}
          </div>
          <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider mt-0.5">
            ✗ Needs Review
          </div>
          <div className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            0% accuracy
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
          <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">
            {improvingQuestions.length}
          </div>
          <div className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mt-0.5">
            ↗ Improving
          </div>
          <div className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            &gt;50% but &lt;80%
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {masteredQuestions.length}
          </div>
          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mt-0.5">
            ✓ Mastered
          </div>
          <div className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            ≥80% accuracy
          </div>
        </div>
      </div>

      {/* Quick Launch Buttons */}
      <div className="space-y-2.5">
        {/* Unstable Questions Drill (User Highlight Feature) */}
        <button
          onClick={handleStartUnstableDrill}
          disabled={unstableQuestions.length === 0}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold flex items-center justify-between shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-white/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-sm font-bold">
                Drill Unstable Tickets ({unstableQuestions.length})
              </div>
              <div className="text-xs text-amber-100">
                {unstableQuestions.length > 0
                  ? `Practice tickets with mixed results until correct answers predominate`
                  : 'No unstable tickets! All mixed answers have reached predominance'}
              </div>
            </div>
          </div>
          <Play className="w-5 h-5 fill-current" />
        </button>

        {/* Missed Questions Drill */}
        <button
          onClick={handleStartNeedsReviewDrill}
          disabled={needsReviewQuestions.length === 0}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold flex items-center justify-between shadow-md shadow-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-white/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">
                Launch Error Drill ({needsReviewQuestions.length})
              </div>
              <div className="text-xs text-rose-100">
                {needsReviewQuestions.length > 0
                  ? `Practice ${Math.min(25, needsReviewQuestions.length)} tickets you missed with zero correct attempts`
                  : 'No 100% missed tickets recorded'}
              </div>
            </div>
          </div>
          <Play className="w-5 h-5 fill-current" />
        </button>

        {/* Spaced Repetition Mix */}
        <button
          onClick={handleStartSpacedRepetition}
          className="w-full p-4 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold flex items-center justify-between border border-slate-700/60 shadow-sm transition"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Daily Spaced Mix (20 Questions)</div>
              <div className="text-xs text-slate-400">
                Algorithmic mix of unstable, missed, and least-reviewed tickets
              </div>
            </div>
          </div>
          <Play className="w-5 h-5 fill-current text-indigo-400" />
        </button>

        {bookmarkedQuestions.length > 0 && (
          <button
            onClick={handleStartBookmarkedDrill}
            className="w-full p-4 rounded-2xl bg-white dark:bg-[#121927] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 font-semibold flex items-center justify-between shadow-xs transition"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Bookmark className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Practice Bookmarked Tickets
                </div>
                <div className="text-xs text-slate-500">
                  {bookmarkedQuestions.length} starred tickets ready for review
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Unstable & Missed Questions Ranking List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Target Review Tickets (Unstable & Mistakes):</span>
          </h3>
          <span className="text-xs text-slate-400">
            {totalProblemTickets} items to master
          </span>
        </div>

        {totalProblemTickets === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-medium text-slate-700 dark:text-slate-300">
              No unstable or missed questions right now!
            </p>
            <p className="mt-1">
              As you study tickets or take quizzes, any tickets with mixed results will appear here so you can drill them until they reach ≥80% mastery.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...unstableQuestions, ...needsReviewQuestions].slice(0, 20).map(({ q, p }) => {
              const mastery = getQuestionMasteryInfo(p);
              return (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Ticket #{q.num}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${mastery.badgeClass}`}
                      >
                        {mastery.labelEn}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({p.correctCount || 0} correct / {p.incorrectCount || 0} wrong)
                      </span>
                      <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                        • {q.category}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 truncate">
                      {q.questionEn}
                    </p>
                  </div>

                  <button
                    onClick={() => onJumpToTicket(q.num)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-300 text-slate-700 dark:text-slate-300 font-medium shrink-0 transition"
                  >
                    Study Ticket
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
