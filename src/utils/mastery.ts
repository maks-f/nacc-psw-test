import { QuestionProgress } from '../types';

export type QuestionMasteryStatus =
  | 'unanswered'
  | 'needs_review'
  | 'unstable'
  | 'improving'
  | 'mastered';

export interface QuestionMasteryInfo {
  status: QuestionMasteryStatus;
  correct: number;
  incorrect: number;
  totalAttempts: number;
  accuracy: number;
  labelEn: string;
  labelUa: string;
  shortLabelEn: string;
  shortLabelUa: string;
  compactLabelEn: string;
  compactLabelUa: string;
  badgeClass: string;
  explanationEn: string;
  explanationUa: string;
}

/**
 * Calculates the exact mastery status of a question based on its attempt history:
 * 1. Unanswered: 0 attempts
 * 2. Needs Review: 100% incorrect (0 correct, >0 incorrect)
 * 3. Unstable: Mixed attempts where correct answers do NOT predominate over incorrect ones (correct <= incorrect)
 * 4. Improving: Mixed attempts where correct answers predominate (correct > incorrect), but accuracy < 80%
 * 5. Mastered: Answered correctly in at least 80% of attempts (accuracy >= 80%)
 */
export function getQuestionMasteryInfo(p?: QuestionProgress): QuestionMasteryInfo {
  const correct = p?.correctCount || 0;
  const incorrect = p?.incorrectCount || 0;
  const totalAttempts = correct + incorrect;

  if (totalAttempts === 0) {
    return {
      status: 'unanswered',
      correct: 0,
      incorrect: 0,
      totalAttempts: 0,
      accuracy: 0,
      labelEn: 'New',
      labelUa: 'Нове',
      shortLabelEn: 'New',
      shortLabelUa: 'Нове',
      compactLabelEn: 'New',
      compactLabelUa: 'Нове',
      badgeClass: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      explanationEn: 'New ticket: Not attempted yet',
      explanationUa: 'Нове питання: Ще не було спроб відповісти',
    };
  }

  // 1. Never answered correctly, only failed -> Needs Review
  if (correct === 0 && incorrect > 0) {
    return {
      status: 'needs_review',
      correct,
      incorrect,
      totalAttempts,
      accuracy: 0,
      labelEn: '✗ Needs Review',
      labelUa: '✗ Потребує повторення',
      shortLabelEn: 'Needs Review',
      shortLabelUa: 'Повторити',
      compactLabelEn: '✗ Review',
      compactLabelUa: '✗ Повторити',
      badgeClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
      explanationEn: `Needs Review: 0 correct out of ${incorrect} attempt(s) (0% accuracy)`,
      explanationUa: `Потребує повторення: 0 правильних із ${incorrect} спроб (0% успішності)`,
    };
  }

  const accuracy = Math.round((correct / totalAttempts) * 100);

  // 2. Correct answers do not strictly predominate -> Unstable
  if (correct <= incorrect) {
    return {
      status: 'unstable',
      correct,
      incorrect,
      totalAttempts,
      accuracy,
      labelEn: `⚡ Unstable (${accuracy}%)`,
      labelUa: `⚡ Нестабільне (${accuracy}%)`,
      shortLabelEn: `Unstable (${accuracy}%)`,
      shortLabelUa: `Нестабільне (${accuracy}%)`,
      compactLabelEn: `⚡ ${accuracy}%`,
      compactLabelUa: `⚡ ${accuracy}%`,
      badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
      explanationEn: `Unstable: ${correct} correct vs ${incorrect} incorrect (${accuracy}%). Correct answers must predominate.`,
      explanationUa: `Нестабільне: ${correct} правильних і ${incorrect} неправильних (${accuracy}%). Правильні відповіді мають переважати.`,
    };
  }

  // 3. Answered correctly in 80% or more of attempts -> Mastered
  if (accuracy >= 80) {
    return {
      status: 'mastered',
      correct,
      incorrect,
      totalAttempts,
      accuracy,
      labelEn: `✓ Mastered (${accuracy}%)`,
      labelUa: `✓ Засвоєно (${accuracy}%)`,
      shortLabelEn: `Mastered (${accuracy}%)`,
      shortLabelUa: `Засвоєно (${accuracy}%)`,
      compactLabelEn: `✓ ${accuracy}%`,
      compactLabelUa: `✓ ${accuracy}%`,
      badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      explanationEn: `Mastered: ${accuracy}% accuracy (${correct}/${totalAttempts}) — Meets the ≥80% requirement`,
      explanationUa: `Засвоєно: ${accuracy}% успішності (${correct}/${totalAttempts}) — Відповідає вимозі ≥80%`,
    };
  }

  // 4. Correct answers predominate (correct > incorrect), but accuracy is under 80% -> Improving
  return {
    status: 'improving',
    correct,
    incorrect,
    totalAttempts,
    accuracy,
    labelEn: `↗ Improving (${accuracy}%)`,
    labelUa: `↗ Покращується (${accuracy}%)`,
    shortLabelEn: `Improving (${accuracy}%)`,
    shortLabelUa: `Покращується (${accuracy}%)`,
    compactLabelEn: `↗ ${accuracy}%`,
    compactLabelUa: `↗ ${accuracy}%`,
    badgeClass: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
    explanationEn: `Improving: Correct answers predominate (${correct} > ${incorrect}), but needs ≥80% for Mastered (${accuracy}%)`,
    explanationUa: `Покращується: правильні відповіді переважають (${correct} > ${incorrect}), але потрібно ≥80% для Засвоєно (${accuracy}%)`,
  };
}
