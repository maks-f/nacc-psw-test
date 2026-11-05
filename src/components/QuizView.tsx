import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Question, QuestionProgress, QuizAnswerRecord, QuizConfig } from '../types';

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
}

export const QuizView: React.FC<QuizViewProps> = ({
  quizQuestions,
  config,
  onFinishQuiz,
  onExitQuiz,
  onRecordAnswer,
  progressMap: _progressMap,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);
  const [showUa, setShowUa] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const currentQ = quizQuestions[currentIndex];
  const total = quizQuestions.length;

  const handleSelectOption = (optionId: string) => {
    if (isAnswered) return;
    setSelectedOptionId(optionId);
  };

  const handleConfirmAnswer = () => {
    if (isAnswered || !selectedOptionId || !currentQ) return;
    setIsAnswered(true);

    const isCorrect = selectedOptionId === currentQ.correctOptionId;
    const record: QuizAnswerRecord = {
      questionId: currentQ.id,
      selectedOptionId,
      isCorrect,
    };

    setAnswers((prev) => [...prev, record]);
    onRecordAnswer(currentQ.id, isCorrect, selectedOptionId);

    // If instant feedback is disabled, automatically proceed after brief pause
    if (!config.instantFeedback) {
      setTimeout(() => {
        handleNextQuestion();
      }, 350);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
      setShowUa(false);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleCompleteQuiz = () => {
    setIsCompleted(true);
    const correctCount = answers.filter((a) => a.isCorrect).length + (
      // Include the current question if not yet added to answers
      !answers.some((a) => a.questionId === currentQ.id) && selectedOptionId === currentQ.correctOptionId
        ? 1
        : 0
    );
    const incorrectCount = total - correctCount;

    // Trigger celebration confetti
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
      answers,
      timeSpentSeconds: secondsElapsed,
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Completion Screen
  if (isCompleted) {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctCount / total) * 100) || 0;
    const failedAnswers = answers.filter((a) => !a.isCorrect);

    return (
      <div className="max-w-xl mx-auto px-4 py-8 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Quiz Completed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Excellent effort preparing for your NACC examination
          </p>

          {/* Score Pill */}
          <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-around">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
                {accuracy}%
              </div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Accuracy
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {correctCount}/{total}
              </div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Correct
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-slate-300">
                {formatTime(secondsElapsed)}
              </div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Time Spent
              </div>
            </div>
          </div>

          {/* Missed Questions List */}
          {failedAnswers.length > 0 && (
            <div className="text-left mb-6">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Mistakes Review ({failedAnswers.length} tickets):</span>
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {failedAnswers.map((item) => {
                  const q = quizQuestions.find((qu) => qu.id === item.questionId);
                  if (!q) return null;
                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white mb-1">
                        Ticket #{q.num}: {q.questionEn}
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        ✓ Correct Answer: {q.correctOptionId} -{' '}
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
                setCurrentIndex(0);
                setSelectedOptionId(null);
                setIsAnswered(false);
                setAnswers([]);
                setSecondsElapsed(0);
                setIsCompleted(false);
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry This Quiz</span>
            </button>
            <button
              onClick={onExitQuiz}
              className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-1.5"
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      {/* Top Quiz Header: Progress bar, Timer, Exit */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            Question {currentIndex + 1}
            <span className="text-slate-400 text-xs font-normal"> / {total}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
            Ticket #{currentQ.num}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(secondsElapsed)}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <Award className="w-3.5 h-3.5" />
            <span>{currentScore} pts</span>
          </div>
          <button
            onClick={onExitQuiz}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium ml-1"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-sky-500 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Active Question Card */}
      <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl p-5 sm:p-6 space-y-4">
        {/* Category tag */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {currentQ.category}
          </span>
          <button
            onClick={() => setShowUa((p) => !p)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition ${
              showUa
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{showUa ? 'Hide Translation' : 'Ukrainian Translation'}</span>
          </button>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {currentQ.questionEn}
          </h3>
          {showUa && (
            <p className="text-xs sm:text-sm text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40">
              {currentQ.questionUa}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2 pt-2">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = opt.id === currentQ.correctOptionId;

            let btnStyle =
              'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700';

            if (isAnswered && config.instantFeedback) {
              if (isCorrect) {
                btnStyle =
                  'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrect) {
                btnStyle =
                  'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500';
              } else {
                btnStyle =
                  'border-slate-200 dark:border-slate-800/40 opacity-50 text-slate-400';
              }
            } else if (isSelected) {
              btnStyle =
                'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500';
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                disabled={isAnswered}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative group ${btnStyle}`}
              >
                <span
                  className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition ${
                    isAnswered && config.instantFeedback && isCorrect
                      ? 'bg-emerald-500 text-white'
                      : isAnswered && config.instantFeedback && isSelected && !isCorrect
                      ? 'bg-rose-500 text-white'
                      : isSelected
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.id}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium leading-relaxed">
                    {opt.textEn}
                  </div>
                  {showUa && (
                    <div className="text-[11px] sm:text-xs text-sky-700 dark:text-sky-300/80 mt-1">
                      {opt.textUa}
                    </div>
                  )}
                </div>

                {isAnswered && config.instantFeedback && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {isAnswered && config.instantFeedback && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}
              </button>
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
              className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>
                {selectedOptionId
                  ? `Confirm Option ${selectedOptionId}`
                  : 'Select an Option, then Confirm'}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-1.5">
              Tap any option to test yourself. Your selection is only locked and counted after confirmation.
            </p>
          </div>
        ) : (
          <div
            className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
              selectedOptionId === currentQ.correctOptionId
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 space-y-1.5"
            >
              <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>Clinical Explanation:</span>
              </div>
              <p className="leading-relaxed">{currentQ.explanation}</p>
              {currentQ.howToRemember && (
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 pt-1 font-medium">
                  🧠 Mnemonic: {currentQ.howToRemember}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next Question Button (when instant feedback is active and user answered) */}
      {isAnswered && config.instantFeedback && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleNextQuestion}
            className="py-3 px-6 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition flex items-center gap-2"
          >
            <span>{currentIndex < total - 1 ? 'Next Question' : 'Complete Quiz'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
