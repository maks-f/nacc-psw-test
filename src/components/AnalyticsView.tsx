import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { OverallStats, Question, QuestionProgress, QuizResult } from '../types';
import { getQuestionMasteryInfo } from '../utils/mastery';

interface AnalyticsViewProps {
  stats: OverallStats;
  totalQuestions: number;
  questions: Question[];
  progressMap: Record<number, QuestionProgress>;
  quizHistory: QuizResult[];
  categories: string[];
  onJumpToTicket: (ticketNum: number) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  totalQuestions,
  questions,
  progressMap,
  quizHistory,
  categories,
  onJumpToTicket,
}) => {
  const [dailyMinutesPace, setDailyMinutesPace] = useState<number>(30);
  const [targetExamDate, setTargetExamDate] = useState<string>(() => {
    // Default 3 weeks from today
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().split('T')[0];
  });

  const percentViewed = Math.round((stats.totalViewed / totalQuestions) * 100) || 0;
  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round(
          (stats.totalCorrect / (stats.totalCorrect + stats.totalIncorrect)) * 100
        )
      : 0;

  // Question mastery buckets
  let masteredCount = 0;
  let improvingCount = 0;
  let unstableCount = 0;
  let needsReviewCount = 0;
  let unattemptedCount = 0;

  questions.forEach((q) => {
    const p = progressMap[q.id];
    const mastery = getQuestionMasteryInfo(p);
    if (mastery.status === 'unanswered') {
      unattemptedCount++;
    } else if (mastery.status === 'mastered') {
      masteredCount++;
    } else if (mastery.status === 'improving') {
      improvingCount++;
    } else if (mastery.status === 'unstable') {
      unstableCount++;
    } else if (mastery.status === 'needs_review') {
      needsReviewCount++;
    }
  });

  // Composite Readiness Index (0 - 100)
  const coverageScore = (stats.totalViewed / totalQuestions) * 40;
  const accuracyScore = (overallAccuracy / 100) * 40;
  const masteryScore = (masteredCount / totalQuestions) * 20;
  const readinessIndex = Math.min(100, Math.round(coverageScore + accuracyScore + masteryScore));

  let readinessLevel = 'Early Preparation';
  let readinessColor = 'text-slate-400';
  let readinessBg = 'bg-slate-500/10 border-slate-500/20';

  if (readinessIndex >= 85) {
    readinessLevel = 'High Distinction / Honors Ready';
    readinessColor = 'text-emerald-500';
    readinessBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (readinessIndex >= 70) {
    readinessLevel = 'Exam Ready — Passing Expected';
    readinessColor = 'text-sky-500';
    readinessBg = 'bg-sky-500/10 border-sky-500/20';
  } else if (readinessIndex >= 40) {
    readinessLevel = 'Intermediate Competency';
    readinessColor = 'text-amber-500';
    readinessBg = 'bg-amber-500/10 border-amber-500/20';
  }

  // Velocity & Time-to-Complete Forecast
  // Estimate ~45 seconds (0.75 min) to thoroughly study a question and its rationale
  const secondsPerQuestion = 45;
  const remainingToStudy = Math.max(0, totalQuestions - masteredCount);
  const totalMinutesRemaining = Math.round((remainingToStudy * secondsPerQuestion) / 60);
  const totalHoursRemaining = (totalMinutesRemaining / 60).toFixed(1);

  // Prediction based on chosen daily minutes pace
  const daysAtCurrentPace = Math.ceil(totalMinutesRemaining / Math.max(1, dailyMinutesPace));
  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + daysAtCurrentPace);

  // Target Exam Date countdown calculation
  const targetDateObj = new Date(targetExamDate);
  const now = new Date();
  const diffTime = targetDateObj.getTime() - now.getTime();
  const daysUntilExam = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const requiredQuestionsPerDay = Math.ceil(remainingToStudy / daysUntilExam);
  const requiredMinutesPerDay = Math.round((requiredQuestionsPerDay * secondsPerQuestion) / 60);

  // Category breakdown stats
  const categoryStats = categories.map((cat) => {
    const catQuestions = questions.filter((q) => q.category === cat);
    let viewed = 0;
    let correct = 0;
    let incorrect = 0;

    catQuestions.forEach((q) => {
      const p = progressMap[q.id];
      if (p?.viewed) viewed++;
      if (p) {
        correct += p.correctCount || 0;
        incorrect += p.incorrectCount || 0;
      }
    });

    const totalCat = catQuestions.length;
    const catAccuracy =
      correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    const catProgress = Math.round((viewed / totalCat) * 100) || 0;

    return {
      name: cat,
      total: totalCat,
      viewed,
      catProgress,
      correct,
      incorrect,
      accuracy: catAccuracy,
    };
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-500" />
          <span>Performance & Time-to-Complete Forecast</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Tracking question mastery, accuracy rates, and completion projections
        </p>
      </div>

      {/* SECTION 1: EXAM READINESS INDEX GAUGE */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Exam Readiness Score
              </h3>
              <p className="text-xs text-slate-400">
                Composite calculation based on coverage, accuracy, and retention
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-sky-600 dark:text-sky-400">
              {readinessIndex}%
            </div>
            <div className={`text-[11px] font-bold ${readinessColor}`}>
              {readinessLevel}
            </div>
          </div>
        </div>

        {/* Readiness Bar */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${readinessIndex}%` }}
          />
        </div>

        {/* Mastery distribution counts */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <div className="text-sm sm:text-base font-black">{masteredCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-tight">✓ Mastered (≥80%)</div>
          </div>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
            <div className="text-sm sm:text-base font-black">{improvingCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-tight">↗ Improving</div>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <div className="text-sm sm:text-base font-black">{unstableCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-tight">⚡ Unstable</div>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
            <div className="text-sm sm:text-base font-black">{needsReviewCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-tight">✗ Needs Review</div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <div className="text-sm sm:text-base font-black">{unattemptedCount}</div>
            <div className="text-[10px] uppercase font-bold tracking-tight">Unopened</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TIME-TO-COMPLETE PREDICTION ENGINE */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900/20 via-sky-900/10 to-transparent border border-indigo-500/20 dark:border-indigo-500/30 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Study Time & Completion Forecast
            </h3>
            <p className="text-xs text-slate-400">
              Calculates how long it will take to master all 807 tickets
            </p>
          </div>
        </div>

        {/* Forecast KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Remaining Study Time:</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              ~{totalHoursRemaining} hours
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              To master remaining {remainingToStudy} unmastered tickets
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              <span>Projected Completion:</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-sky-600 dark:text-sky-400">
              {estimatedCompletionDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              In ~{daysAtCurrentPace} days at {dailyMinutesPace} mins/day
            </p>
          </div>
        </div>

        {/* Daily Study Commitment Slider / Buttons */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Adjust Your Daily Study Goal:</span>
            <span className="text-sky-500 font-bold">{dailyMinutesPace} minutes / day</span>
          </div>
          <div className="flex gap-2">
            {[15, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDailyMinutesPace(mins)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  dailyMinutesPace === mins
                    ? 'border-sky-500 bg-sky-500 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Target Exam Date Countdown Calculator */}
        <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              <span>Have a specific exam date?</span>
            </div>
            <input
              type="date"
              value={targetExamDate}
              onChange={(e) => setTargetExamDate(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-semibold"
            />
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            You have <strong className="text-slate-900 dark:text-white">{daysUntilExam} days</strong> left.
            To complete all tickets by exam day, aim for{' '}
            <strong className="text-amber-600 dark:text-amber-400">
              {requiredQuestionsPerDay} tickets/day
            </strong>{' '}
            (~{requiredMinutesPerDay} minutes daily).
          </div>
        </div>
      </div>

      {/* SECTION 3: MAIN KPI GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <BookOpen className="w-3.5 h-3.5 text-sky-500" />
            <span>Tickets Viewed</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalViewed}
            <span className="text-xs font-normal text-slate-400">/{totalQuestions}</span>
          </div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
            {percentViewed}% complete
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>Overall Accuracy</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {overallAccuracy}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.totalCorrect} correct answers
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily Streak</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-500">
            {stats.streakDays} <span className="text-xs font-normal">days</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active habit</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Quizzes Taken</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {quizHistory.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Completed sessions</div>
        </div>
      </div>

      {/* SECTION 4: DOMAIN TOPICS BREAKDOWN */}
      <div className="bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-500" />
            <span>Domain / Topic Competency Breakdown</span>
          </h3>
          <span className="text-xs text-slate-400">9 NACC Competency Areas</span>
        </div>

        <div className="space-y-3">
          {categoryStats.map((cat) => (
            <div key={cat.name} className="space-y-1 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[260px] sm:max-w-md">
                  {cat.name}
                </span>
                <div className="flex items-center gap-3 text-[11px] shrink-0">
                  <span className="text-slate-400">
                    {cat.viewed}/{cat.total} viewed
                  </span>
                  <span
                    className={`font-semibold ${
                      cat.accuracy >= 80
                        ? 'text-emerald-500'
                        : cat.accuracy >= 60
                        ? 'text-amber-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {cat.accuracy}% acc
                  </span>
                </div>
              </div>

              {/* Stacked Progress Bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${cat.catProgress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: RECENT QUIZ HISTORY */}
      <div className="bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span>Recent Quiz History</span>
        </h3>

        {quizHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No quiz sessions taken yet. Complete a quiz to log exam history and pace records!
          </div>
        ) : (
          <div className="space-y-2">
            {quizHistory.slice(0, 8).map((q) => {
              const acc = Math.round((q.correct / q.total) * 100) || 0;
              const dateStr = new Date(q.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white capitalize flex items-center gap-1.5">
                      <span>
                        {q.mode === 'random' || q.total === 200
                          ? 'Official Exam Simulation'
                          : `${q.mode} Practice Quiz`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({q.total} questions)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </span>
                      <span>·</span>
                      <span>{Math.round(q.timeSpentSeconds / 60)} min</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        acc >= 80
                          ? 'text-emerald-500'
                          : acc >= 60
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {acc}%
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {q.correct}/{q.total} correct
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
