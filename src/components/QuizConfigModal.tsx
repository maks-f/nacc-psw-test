import React, { useState } from 'react';
import {
  X,
  Play,
  Flame,
  Bookmark,
  Layers,
  Sparkles,
  Shuffle,
  Eye,
  Sliders,
  FolderPlus,
  Zap,
} from 'lucide-react';
import { CustomGroup, QuizConfig, QuizMode } from '../types';

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

  if (!isOpen) return null;

  const presets = [
    { label: 'Tickets 1 – 50', start: 1, end: 50 },
    { label: 'Tickets 51 – 100', start: 51, end: 100 },
    { label: 'Tickets 101 – 200', start: 101, end: 200 },
    { label: 'Tickets 201 – 350', start: 201, end: 350 },
    { label: 'Tickets 351 – 500', start: 351, end: 500 },
    { label: 'Tickets 501 – 650', start: 501, end: 650 },
    { label: 'Tickets 651 – 780', start: 651, end: 780 },
    { label: 'True / False (781 – 807)', start: 781, end: 807 },
    { label: 'Full NACC Bank (1 – 807)', start: 1, end: 807 },
  ];

  const handleApplyPreset = (start: number, end: number) => {
    setMode('range');
    setStartTicket(start);
    setEndTicket(end);
    const rangeSize = end - start + 1;
    if (questionCount > rangeSize) {
      setQuestionCount(Math.min(20, rangeSize));
    }
  };

  const selectedGroup = customGroups.find((g) => g.id === selectedGroupId) || customGroups[0];

  const handleStart = () => {
    onStartQuiz({
      mode,
      startTicket,
      endTicket,
      category: mode === 'category' ? selectedCategory : undefined,
      groupId: mode === 'group' ? (selectedGroup?.id || undefined) : undefined,
      questionCount,
      shuffle,
      instantFeedback,
      showExplanations,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Quiz Generator & Practice
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure question range, collections, and test settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Practice Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Practice Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  mode === 'range'
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Layers className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Ticket Range
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Pick interval (e.g. 1-50, 100-200)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('group')}
                disabled={customGroups.length === 0}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  customGroups.length === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : mode === 'group'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <FolderPlus className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    Custom Collection
                    <span className="text-[10px] px-1 bg-indigo-500/10 text-indigo-600 rounded">
                      {customGroups.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Quiz a curated collection
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('unstable')}
                disabled={unstableCount === 0}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  unstableCount === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : mode === 'unstable'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    Unstable Drill
                    <span className="text-[10px] px-1 bg-amber-500/10 text-amber-600 rounded">
                      {unstableCount}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mixed answers (correct ≤ mistakes)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('failed')}
                disabled={mistakesCount === 0}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  mistakesCount === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : mode === 'failed'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Flame className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    Error Drill
                    <span className="text-[10px] px-1 bg-rose-500/10 text-rose-600 rounded">
                      {mistakesCount}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tickets with mistakes
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('bookmarked')}
                disabled={bookmarkedCount === 0}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  bookmarkedCount === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : mode === 'bookmarked'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Bookmark className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                    Bookmarked
                    <span className="text-[10px] px-1 bg-amber-500/10 text-amber-600 rounded">
                      {bookmarkedCount}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Your starred tickets
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Range Configuration (when mode === 'range') */}
          {mode === 'range' && (
            <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Custom Ticket Interval
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Start Ticket #
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={totalQuestions}
                    value={startTicket}
                    onChange={(e) => setStartTicket(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    End Ticket #
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
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* Fast Presets */}
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleApplyPreset(p.start, p.end)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                        startTicket === p.start && endTicket === p.end
                          ? 'bg-sky-500 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Collection Selector (when mode === 'group') */}
          {mode === 'group' && (
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Choose Collection to Practice:
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white font-semibold"
              >
                {customGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.questionIds.length} tickets)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Number of Questions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Number of Questions to Practice
              </label>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                {questionCount} questions
              </span>
            </div>
            <div className="flex gap-2">
              {[10, 20, 30, 50, 100].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition ${
                    questionCount === count
                      ? 'border-sky-500 bg-sky-500 text-white font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Shuffle Questions & Options
                </span>
              </div>
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
                className="w-4 h-4 text-sky-500 rounded border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Instant Feedback & Explanation
                </span>
              </div>
              <input
                type="checkbox"
                checked={instantFeedback}
                onChange={(e) => setInstantFeedback(e.target.checked)}
                className="w-4 h-4 text-sky-500 rounded border-slate-300"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-sm shadow-sky-500/20 flex items-center gap-1.5 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Practice Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
