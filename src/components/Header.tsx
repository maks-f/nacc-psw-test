import React, { useState, useRef, useEffect } from 'react';
import {
  Moon,
  Sun,
  Download,
  Bell,
  RotateCcw,
  BookOpen,
  Award,
  Sparkles,
  Languages,
  Lightbulb,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { CustomGroup, OverallStats, Question, QuestionProgress } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { GlobalSearch } from './GlobalSearch';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  showHints: boolean;
  onToggleHints: () => void;
  stats: OverallStats;
  totalQuestions: number;
  questions: Question[];
  onSelectQuestion: (ticketNum: number) => void;
  progressMap?: Record<number, QuestionProgress>;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  categories: string[];
  customGroups?: CustomGroup[];
  onOpenExport: () => void;
  onOpenReminder: () => void;
  onClearCache: () => void;
  onResetProgress: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  showTranslation,
  onToggleTranslation,
  showHints,
  onToggleHints,
  stats,
  totalQuestions,
  questions,
  onSelectQuestion,
  progressMap,
  selectedFilter,
  onSelectFilter,
  categories,
  customGroups = [],
  onOpenExport,
  onOpenReminder,
  onClearCache,
  onResetProgress,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on click outside or Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const percentViewed = Math.round((stats.totalViewed / totalQuestions) * 100) || 0;
  const overallAccuracy =
    stats.totalAnswered > 0
      ? Math.round(
          (stats.totalCorrect / (stats.totalCorrect + stats.totalIncorrect)) * 100
        )
      : 0;

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/95 dark:bg-[#0B111E]/95 border-b border-slate-200/90 dark:border-slate-800/90 safe-area-pt transition-colors">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Zone: Brand & Context */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs shadow-sky-500/20 shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                NACC Prep
              </h1>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                807 Tickets
              </span>
            </div>
            <p className="hidden xl:block text-[11px] text-slate-500 dark:text-slate-400 truncate">
              PSW Certification Exam
            </p>
          </div>
        </div>

        {/* Center Zone: Unified Category Filter & Global Search */}
        <GlobalSearch
          questions={questions}
          onSelectQuestion={onSelectQuestion}
          progressMap={progressMap}
          selectedFilter={selectedFilter}
          onSelectFilter={onSelectFilter}
          categories={categories}
          customGroups={customGroups}
          showTranslation={showTranslation}
        />

        {/* Right Zone: Study Controls, Theme, and Settings Menu */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Accuracy Badge (Large Desktop) */}
          <div
            className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs shrink-0 font-medium text-slate-600 dark:text-slate-300 cursor-default"
            title={`${stats.masteredCount || 0} of ${stats.totalAnswered || 0} attempted tickets mastered (≥80% accuracy)`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <strong className="text-slate-900 dark:text-white font-semibold">
              {overallAccuracy}%
            </strong>
          </div>

          {/* PWA Install Button (Desktop & Tablet only in header to save space on mobile) */}
          <div className="hidden sm:flex">
            <PWAInstallButton />
          </div>

          {/* Translation Toggle Button */}
          <button
            onClick={onToggleTranslation}
            className={`p-2 rounded-lg border transition flex items-center gap-1 ${
              showTranslation
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
            }`}
            title={showTranslation ? 'Hide Ukrainian translation (T)' : 'Show Ukrainian translation (T)'}
            aria-label="Toggle Ukrainian translation"
            aria-pressed={showTranslation}
          >
            <Languages className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">
              UA
            </span>
          </button>

          {/* Hints / Rationale Toggle Button (hidden on extra small screens, accessible via 3-dots menu) */}
          <button
            onClick={onToggleHints}
            className={`hidden sm:flex p-2 rounded-lg border transition items-center gap-1 ${
              showHints
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
            }`}
            title={showHints ? 'Hide Hints & Rationale (E)' : 'Show Hints & Rationale (E)'}
            aria-label="Toggle Hints & Rationale"
            aria-pressed={showHints}
          >
            <Lightbulb className={`w-4 h-4 ${showHints ? 'fill-amber-500/20' : ''}`} />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title={darkMode ? 'Switch to Light theme' : 'Switch to Dark theme'}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Settings & Actions Three-Dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`p-2 rounded-lg border transition ${
                isMenuOpen
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
              title="More actions and settings"
              aria-label="More options"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Hints toggle for mobile users */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleHints();
                  }}
                  className="sm:hidden w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Lightbulb className={`w-4 h-4 text-amber-500 shrink-0 ${showHints ? 'fill-amber-500/20' : ''}`} />
                    <div className="flex flex-col">
                      <span className="font-semibold">Hints & Rationales</span>
                      <span className="text-[10px] text-slate-400">Explanations & mnemonics</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${showHints ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {showHints ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* PWA Install for mobile users */}
                <div className="sm:hidden px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2 mb-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">App Install</span>
                    <span className="text-[10px] text-slate-400">Install as offline app</span>
                  </div>
                  <PWAInstallButton />
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenExport();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition"
                >
                  <Download className="w-4 h-4 text-sky-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Export & Backup</span>
                    <span className="text-[10px] text-slate-400">Notion, PDF print, JSON</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenReminder();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition"
                >
                  <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Study Reminders</span>
                    <span className="text-[10px] text-slate-400">Daily push notifications</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onClearCache();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Clear Offline Cache</span>
                    <span className="text-[10px] text-slate-400">Update data & refresh service worker</span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onResetProgress();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition"
                >
                  <RotateCcw className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">Reset Progress</span>
                    <span className="text-[10px] text-rose-400/80">Clear history & accuracy</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
