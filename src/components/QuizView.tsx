import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  Languages,
  ArrowRight,
  Trophy,
  Flame,
  Award,
  Check,
  Sparkles,
  BookOpen,
  X,
  GraduationCap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Question, QuestionProgress, QuizAnswerRecord, QuizConfig, TextSize } from '../types';
import { getCategoryTranslation } from '../utils/categories';
import { triggerHaptic } from '../utils/haptics';
import { getTextSizeClasses } from '../utils/textSize';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface QuizViewProps {
  quizQuestions: Question[];
  config: QuizConfig;
  onFinishQuiz: (result: {
    total: number;
    correct: number;
    incorrect: number;
    answers: QuizAnswerRecord[];
    timeSpentSeconds: number;
  }) => void;
  onExitQuiz: () => void;
  onRecordAnswer: (questionId: number, isCorrect: boolean, optionId: string) => void;
  progressMap: Record<number, QuestionProgress>;
  showTranslation: boolean;
  onToggleTranslation?: () => void;
  textSize?: TextSize;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quizQuestions,
  config,
  onFinishQuiz,
  onExitQuiz,
  onRecordAnswer,
  progressMap: _progressMap,
  showTranslation,
  onToggleTranslation,
  textSize = 'normal',
}) => {
  const sizeClasses = getTextSizeClasses(textSize);
  const { isSpeaking, speakingId, isSupported: isTtsSupported, speak, stop: stopTts } = useSpeechSynthesis();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);
  const answersRef = useRef<QuizAnswerRecord[]>([]);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const timeLimitSeconds = (config.timeLimitMinutes || 0) * 60;
  const isTimedQuiz = timeLimitSeconds > 0;
  const remainingSeconds = isTimedQuiz ? Math.max(0, timeLimitSeconds - secondsElapsed) : 0;
  const hasWarned60s = useRef(false);
  const advanceTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  // Clean up auto-advance timeout on unmount
  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  // Timer: Count-up (Stopwatch) or Countdown (Timed Exam)
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1;
        if (isTimedQuiz && next >= timeLimitSeconds) {
          clearInterval(interval);
          return timeLimitSeconds;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, isTimedQuiz, timeLimitSeconds]);

  // Handle timeout triggering cleanly outside state updater
  useEffect(() => {
    if (isTimedQuiz && !isCompleted && secondsElapsed >= timeLimitSeconds) {
      setIsTimedOut(true);
      triggerHaptic('incorrect');
      handleTimeoutComplete();
    }
  }, [isTimedQuiz, isCompleted, secondsElapsed, timeLimitSeconds]);

  // Warning vibration when 60s remaining
  useEffect(() => {
    if (isTimedQuiz && !isCompleted && remainingSeconds === 60 && !hasWarned60s.current) {
      hasWarned60s.current = true;
      triggerHaptic('incorrect');
    }
  }, [isTimedQuiz, isCompleted, remainingSeconds]);

  const currentQ = quizQuestions[currentIndex];
  const total = quizQuestions.length;

  const handleSelectOption = (optionId: string) => {
    if (isAnswered) return;
    triggerHaptic('tap');
    setSelectedOptionId(optionId);
  };

  const handleConfirmAnswer = () => {
    if (isAnswered || !selectedOptionId || !currentQ) return;
    setIsAnswered(true);

    const isCorrect = selectedOptionId === currentQ.correctOptionId;
    if (config.instantFeedback) {
      triggerHaptic(isCorrect ? 'correct' : 'incorrect');
    } else {
      triggerHaptic('tap');
    }

    const record: QuizAnswerRecord = {
      questionId: currentQ.id,
      selectedOptionId,
      isCorrect,
    };

    answersRef.current = [...answersRef.current, record];
    setAnswers((prev) => [...prev, record]);
    onRecordAnswer(currentQ.id, isCorrect, selectedOptionId);

    // If instant feedback is disabled (exam mode), automatically proceed after brief pause
    if (!config.instantFeedback) {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
      advanceTimeoutRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 350);
    }
  };

  const handleNextQuestion = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    stopTts();
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    stopTts();
    setIsCompleted(true);
    triggerHaptic('celebrate');

    // Build complete final answers ensuring active question is recorded
    const finalAnswers = [...answersRef.current];
    if (currentQ && selectedOptionId && !finalAnswers.some((a) => a.questionId === currentQ.id)) {
      const isCorrect = selectedOptionId === currentQ.correctOptionId;
      finalAnswers.push({
        questionId: currentQ.id,
        selectedOptionId,
        isCorrect,
      });
    }

    answersRef.current = finalAnswers;
    setAnswers(finalAnswers);

    const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
    const incorrectCount = total - correctCount;

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    onFinishQuiz({
      total,
      correct: correctCount,
      incorrect: incorrectCount,
      answers: finalAnswers,
      timeSpentSeconds: secondsElapsed,
    });
  };

  const handleTimeoutComplete = () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    stopTts();
    setIsCompleted(true);

    const answeredQIds = new Set(answersRef.current.map((a) => a.questionId));
    const finalAnswers = [...answersRef.current];

    // If currently selected an option, commit it
    if (currentQ && selectedOptionId && !answeredQIds.has(currentQ.id)) {
      const isCorrect = selectedOptionId === currentQ.correctOptionId;
      finalAnswers.push({
        questionId: currentQ.id,
        selectedOptionId,
        isCorrect,
      });
      onRecordAnswer(currentQ.id, isCorrect, selectedOptionId);
      answeredQIds.add(currentQ.id);
    }

    // Remaining questions become unattempted/incorrect
    quizQuestions.forEach((q) => {
      if (!answeredQIds.has(q.id)) {
        finalAnswers.push({
          questionId: q.id,
          selectedOptionId: '',
          isCorrect: false,
        });
        onRecordAnswer(q.id, false, '');
      }
    });

    answersRef.current = finalAnswers;
    setAnswers(finalAnswers);

    const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
    const incorrectCount = total - correctCount;

    onFinishQuiz({
      total,
      correct: correctCount,
      incorrect: incorrectCount,
      answers: finalAnswers,
      timeSpentSeconds: timeLimitSeconds,
    });
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      const key = e.key.toLowerCase();

      // Options: A, B, C, D (or 1, 2, 3, 4, and Ukrainian layout: ф, и, с, в)
      if (['a', 'b', 'c', 'd', '1', '2', '3', '4', 'ф', 'и', 'с', 'в'].includes(key) && currentQ && !isAnswered) {
        let optionIndex = -1;
        if (key === 'a' || key === '1' || key === 'ф') optionIndex = 0;
        else if (key === 'b' || key === '2' || key === 'и') optionIndex = 1;
        else if (key === 'c' || key === '3' || key === 'с') optionIndex = 2;
        else if (key === 'd' || key === '4' || key === 'в') optionIndex = 3;

        const opt = currentQ.options[optionIndex];
        if (opt) {
          e.preventDefault();
          handleSelectOption(opt.id);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!isAnswered && selectedOptionId) {
          e.preventDefault();
          handleConfirmAnswer();
        } else if (isAnswered && config.instantFeedback) {
          e.preventDefault();
          handleNextQuestion();
        }
      } else if ((key === 't' || key === 'е') && onToggleTranslation) {
        e.preventDefault();
        onToggleTranslation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, isAnswered, selectedOptionId, config.instantFeedback, currentIndex, total, onToggleTranslation]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // =========================================================================
  // COMPLETION SCREEN
  // =========================================================================
  if (isCompleted) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctCount / total) * 100) || 0;
    const failedAnswers = answers.filter((a) => !a.isCorrect);
    const isExam = config.isExamMode || config.mode === 'random' || total >= 50;
    const isPassed = accuracy >= 70; // 70% passing standard for Canadian NACC PSW exam

    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          {/* Timeout Alert Banner */}
          {isTimedOut && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in duration-200">
              <Clock className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                {showTranslation
                  ? `⏰ Час іспиту (${config.timeLimitMinutes} хв) вичерпано! Всі незавершені запитання зараховано.`
                  : `⏰ Exam time limit (${config.timeLimitMinutes}m) expired! All unattempted questions submitted.`}
              </span>
            </div>
          )}

          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
              isExam
                ? isPassed
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-amber-500/25'
                : 'bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-amber-500/25'
            }`}
          >
            {isExam ? <GraduationCap className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
          </div>

          {isExam && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>
                {showTranslation
                  ? `Симуляція іспиту NACC (${total} питань${config.timeLimitMinutes ? ` · ${config.timeLimitMinutes} хв` : ''})`
                  : `NACC Exam Simulation (${total} Qs${config.timeLimitMinutes ? ` · ${config.timeLimitMinutes}m` : ''})`}
              </span>
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isExam
              ? isPassed
                ? showTranslation
                  ? '🎉 Екзамен успішно складено!'
                  : '🎉 NACC Exam Passed!'
                : showTranslation
                ? '⚠️ Потрібно більше практики (поріг 70%)'
                : '⚠️ Exam: Keep Practicing (70% Target)'
              : showTranslation
              ? 'Тестування завершено!'
              : 'Quiz Completed!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {isExam
              ? isPassed
                ? showTranslation
                  ? 'Вітаємо! Ваш результат відповідає або перевищує офіційний прохідний норматив 70% канадської сертифікації NACC PSW.'
                  : 'Congratulations! Your score meets or exceeds the official Canadian NACC PSW 70% passing standard.'
                : showTranslation
                ? 'Офіційний прохідний поріг NACC складає 70%. Опрацюйте помилкові квитки нижче та спробуйте скласти іспит ще раз.'
                : 'The official NACC passing target is 70%. Review your missed tickets below and re-attempt the simulation.'
              : showTranslation
              ? 'Чудовий крок у підготовці до канадського екзамену NACC PSW.'
              : 'Excellent effort preparing for your Canadian PSW final exam.'}
          </p>

          {/* Score Summary Metrics */}
          <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 flex items-center justify-around">
            <div>
              <div className={`text-2xl sm:text-3xl font-black font-mono ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {accuracy}%
              </div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                {showTranslation ? 'Точність' : 'Accuracy'}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-750" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {correctCount}/{total}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                {showTranslation ? 'Вірно' : 'Correct'}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-750" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-300 font-mono">
                {formatTime(secondsElapsed)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                {isTimedQuiz
                  ? (showTranslation ? `Час (${config.timeLimitMinutes}хв)` : `Time (${config.timeLimitMinutes}m max)`)
                  : (showTranslation ? 'Витрачений час' : 'Time Spent')}
              </div>
            </div>
          </div>

          {/* Missed Questions Review List */}
          {failedAnswers.length > 0 && (
            <div className="text-left mb-6">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Review Missed Tickets ({failedAnswers.length}):</span>
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {failedAnswers.map((item) => {
                  const q = quizQuestions.find((qu) => qu.id === item.questionId);
                  if (!q) return null;
                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                        Ticket #{q.num}: {q.questionEn}
                      </div>
                      {showTranslation && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {q.questionUa}
                        </div>
                      )}
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-0.5">
                        ✓ Correct Answer: Option {q.correctOptionId} -{' '}
                        {q.options.find((o) => o.id === q.correctOptionId)?.textEn}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                if (advanceTimeoutRef.current) {
                  clearTimeout(advanceTimeoutRef.current);
                  advanceTimeoutRef.current = null;
                }
                setCurrentIndex(0);
                setSelectedOptionId(null);
                setIsAnswered(false);
                setAnswers([]);
                answersRef.current = [];
                setSecondsElapsed(0);
                setIsTimedOut(false);
                setIsCompleted(false);
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Quiz</span>
            </button>
            <button
              onClick={onExitQuiz}
              className="flex-1 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Done / Back to Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentScore = answers.filter((a) => a.isCorrect).length;

  // =========================================================================
  // ACTIVE QUESTION SCREEN
  // =========================================================================
  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-28">
      {/* Top Quiz Header: Progress, Timer, Live Score & Exit */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm shrink-0">
            Question {currentIndex + 1}
            <span className="text-slate-400 font-normal"> of {total}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-mono font-bold text-[11px] shrink-0 border border-slate-200/60 dark:border-slate-700/60">
            #{currentQ.num}
          </span>
          {(config.isExamMode || config.mode === 'random' || total >= 50) && (
            <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10.5px] font-bold shrink-0">
              <GraduationCap className="w-3 h-3" />
              <span>{showTranslation ? 'Екзамен' : 'Exam'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className={`flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-lg border transition ${
              isTimedQuiz
                ? remainingSeconds <= 60
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse font-bold'
                  : remainingSeconds <= 300
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 border-transparent'
            }`}
            title={
              isTimedQuiz
                ? (showTranslation ? `Залишилось часу: ${formatTime(remainingSeconds)}` : `Remaining time: ${formatTime(remainingSeconds)}`)
                : (showTranslation ? `Витрачено часу: ${formatTime(secondsElapsed)}` : `Elapsed time: ${formatTime(secondsElapsed)}`)
            }
          >
            <Clock className={`w-3.5 h-3.5 shrink-0 ${isTimedQuiz && remainingSeconds <= 60 ? 'text-rose-500 animate-spin' : ''}`} />
            <span>{isTimedQuiz ? formatTime(remainingSeconds) : formatTime(secondsElapsed)}</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>{currentScore} pts</span>
          </div>

          <button
            onClick={onExitQuiz}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            title="Exit quiz and return to study mode"
            aria-label="Exit quiz"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Dual Micro-Progress Bar (Questions Progress + Time Gauge) */}
      <div className="space-y-1 mb-4">
        <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-teal-500 to-indigo-500 transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
        {isTimedQuiz && (
          <div className="w-full h-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                remainingSeconds <= 60
                  ? 'bg-rose-500'
                  : remainingSeconds <= 300
                  ? 'bg-amber-500'
                  : 'bg-sky-500/70'
              }`}
              style={{ width: `${(remainingSeconds / timeLimitSeconds) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Active Question Card */}
      <div className="bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl p-4 sm:p-6 space-y-4">
        {/* Category Badge & Mode indicator */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 truncate max-w-[280px]">
            <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="truncate">
              {showTranslation ? getCategoryTranslation(currentQ.category) : currentQ.category}
            </span>
          </div>

          {!config.instantFeedback && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10.5px] font-bold uppercase tracking-wider shrink-0">
              Exam Simulation
            </span>
          )}
        </div>

        {/* Question Stem */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2.5">
            <h3 className={`${sizeClasses.stem} font-semibold text-slate-900 dark:text-slate-100 leading-relaxed tracking-tight flex-1`}>
              {currentQ.questionEn}
            </h3>

            {isTtsSupported && (
              <button
                type="button"
                onClick={() => speak(currentQ.questionEn, 'question')}
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

          {/* Refined Inline Ukrainian Translation (Controlled globally via Header toggle) */}
          {showTranslation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`pt-2 mt-2 border-t border-slate-200/80 dark:border-slate-800/80 ${sizeClasses.translation} text-slate-600 dark:text-slate-300 font-normal leading-relaxed flex items-start gap-1.5`}
            >
              <Languages className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{currentQ.questionUa}</p>
            </motion.div>
          )}
        </div>

        {/* Options List */}
        <div className="space-y-2.5 pt-1">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.id === currentQ.correctOptionId;

            let btnStyle =
              'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700';

            if (isAnswered && config.instantFeedback) {
              if (isCorrect) {
                btnStyle =
                  'border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                btnStyle =
                  'border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500';
              } else {
                btnStyle =
                  'border-slate-200/60 dark:border-slate-800/40 opacity-40 text-slate-400';
              }
            } else if (isSelected) {
              btnStyle =
                'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-100 ring-1 ring-sky-500';
            }

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full min-h-[52px] text-left p-3 sm:p-3.5 rounded-xl border transition-all flex items-center gap-3 relative group cursor-pointer ${btnStyle}`}
              >
                <span
                  className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-transform ${
                    isAnswered && config.instantFeedback && isCorrect
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isAnswered && config.instantFeedback && isSelected && !isCorrect
                      ? 'bg-rose-500 text-white shadow-xs'
                      : isSelected
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                  }`}
                >
                  {opt.id}
                </span>

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
                  {isAnswered && config.instantFeedback && (
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

        {/* Answer Confirmation / Locked Status Action */}
        {!isAnswered ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirmAnswer}
              disabled={!selectedOptionId}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>
                {selectedOptionId
                  ? `Confirm Option ${selectedOptionId}`
                  : 'Select an Option, then Confirm'}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-1.5">
              Select an option (or press keys 1–4). Your answer is locked only upon confirmation.
            </p>
          </div>
        ) : (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold ${
              selectedOptionId === currentQ.correctOptionId
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/25'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {selectedOptionId === currentQ.correctOptionId ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Correct! Answer recorded.</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>
                    Incorrect. Correct answer is Option {currentQ.correctOptionId}.
                  </span>
                </>
              )}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 shrink-0">
              Locked
            </span>
          </div>
        )}

        {/* Instant Feedback Rationale Box */}
        <AnimatePresence>
          {isAnswered && config.instantFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-1.5"
            >
              <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>{showTranslation ? 'Клінічне пояснення:' : 'Clinical Explanation:'}</span>
              </div>
              <p className={`leading-relaxed ${sizeClasses.explanation}`}>{currentQ.explanation}</p>
              {currentQ.howToRemember && (
                <p className={`text-indigo-700 dark:text-indigo-300 pt-1 font-medium flex items-center gap-1 ${sizeClasses.explanation}`}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{showTranslation ? 'Мнемоніка:' : 'Mnemonic:'} {currentQ.howToRemember}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Question Button (Pinned right below rationale inside question flow for instant thumb access) */}
        {isAnswered && config.instantFeedback && (
          <div className="pt-2">
            <button
              onClick={handleNextQuestion}
              className="w-full min-h-[48px] py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{currentIndex < total - 1 ? 'Next Question' : 'Complete Quiz'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
