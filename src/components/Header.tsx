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
  Vibrate,
  Type,
  GraduationCap,
} from 'lucide-react';
import { CustomGroup, OverallStats, Question, QuestionProgress, TextSize } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { GlobalSearch } from './GlobalSearch';
import { isHapticsEnabled, setHapticsEnabled, triggerHaptic } from '../utils/haptics';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  showHints: boolean;
  onToggleHints: () => void;
  hapticFeedback?: boolean;
  onToggleHapticFeedback?: () => void;
  textSize?: TextSize;
  onTextSizeChange?: (size: TextSize) => void;
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
  hapticFeedback,
  onToggleHapticFeedback,
  textSize = 'normal',
  onTextSizeChange,
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
  const [hapticsOn, setHapticsOn] = useState(() => isHapticsEnabled());
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
      <div className="max-w-5xl mx-auto px-2.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left Zone: Brand & Context (hidden on small/mobile screens to free up space and prevent overlapping) */}
        <div className="hidden sm:flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs shadow-sky-500/20 shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                NACC Prep
              </h1>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {totalQuestions} Tickets
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

        {/* Quick Curated Exam 193 Filter Button (Desktop) */}
        <button
          type="button"
          onClick={() => {
            if (selectedFilter === 'group:group_potential_exam_200') {
              onSelectFilter('all');
            } else {
              onSelectFilter('group:group_potential_exam_200');
            }
          }}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer shrink-0 ${
            selectedFilter === 'group:group_potential_exam_200'
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
          }`}
          title={
            showTranslation
              ? 'Фільтр: 200 Exam Questions v1 (193 квитки: 118 нових, 75 з бази)'
              : 'Filter: 200 Exam Questions v1 (193 tickets: 118 new, 75 from bank)'
          }
        >
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span>⭐ 200 Questions v1</span>
        </button>

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

          {/* Offline Readiness Badge (Desktop & Mobile) */}
          <OfflineIndicator showTranslation={showTranslation} totalQuestions={totalQuestions} />

          {/* PWA Install Button (Responsive: compact icon on mobile, full text on desktop; hidden when installed) */}
          <PWAInstallButton />

          {/* Translation Toggle Button */}
          <button
            onClick={onToggleTranslation}
            className={`p-2 rounded-lg border transition flex items-center gap-1 ${
              showTranslation
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
            }`}
            title={showTranslation ? 'Вимкнути український переклад (T)' : 'Show Ukrainian translation (T)'}
            aria-label={showTranslation ? 'Вимкнути український переклад' : 'Toggle Ukrainian translation'}
            aria-pressed={showTranslation}
          >
            <Languages className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">
              UA
            </span>
          </button>

          {/* Hints / Rationale Toggle Button (Visible on mobile & desktop) */}
          <button
            onClick={onToggleHints}
            className={`p-2 rounded-lg border transition flex items-center justify-center ${
              showHints
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
            }`}
            title={
              showTranslation
                ? showHints
                  ? 'Сховати підказки (E)'
                  : 'Показати підказки (E)'
                : showHints
                ? 'Hide Hints & Rationale (E)'
                : 'Show Hints & Rationale (E)'
            }
            aria-label={showTranslation ? 'Підказки та пояснення' : 'Toggle Hints & Rationale'}
            aria-pressed={showHints}
          >
            <Lightbulb className={`w-4 h-4 ${showHints ? 'fill-amber-500/20' : ''}`} />
          </button>

          {/* Theme Toggle Button (Desktop & Tablet in header, on mobile moved to 3-dots menu) */}
          <button
            onClick={onToggleDarkMode}
            className="hidden sm:flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title={
              showTranslation
                ? darkMode
                  ? 'Перемкнути на світлу тему'
                  : 'Перемкнути на темну тему'
                : darkMode
                ? 'Switch to Light theme'
                : 'Switch to Dark theme'
            }
            aria-label={showTranslation ? 'Змінити тему' : 'Toggle theme'}
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
              title={showTranslation ? 'Додаткові дії та налаштування' : 'More actions and settings'}
              aria-label={showTranslation ? 'Більше дій' : 'More options'}
              aria-expanded={isMenuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Mobile Brand Info in Menu */}
                <div className="sm:hidden px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {showTranslation ? 'Підготовка NACC' : 'NACC Exam Prep'}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      {showTranslation ? `Сертифікація PSW · ${totalQuestions} квитків` : `PSW Certification · ${totalQuestions} Tickets`}
                    </p>
                  </div>
                </div>

                {/* Theme toggle for mobile users (moved from header) */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleDarkMode();
                  }}
                  className="sm:hidden w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {showTranslation ? 'Тема оформлення' : 'Appearance Theme'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {darkMode
                          ? (showTranslation ? 'Темна тема (нічна)' : 'Dark Theme')
                          : (showTranslation ? 'Світла тема (денна)' : 'Light Theme')}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      darkMode
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {darkMode
                      ? (showTranslation ? 'ТЕМНА' : 'DARK')
                      : (showTranslation ? 'СВІТЛА' : 'LIGHT')}
                  </span>
                </button>

                {/* Haptic feedback vibration toggle switch */}
                {(() => {
                  const isHapticsActive = hapticFeedback !== undefined ? hapticFeedback : hapticsOn;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleHapticFeedback) {
                          onToggleHapticFeedback();
                        } else {
                          const next = !hapticsOn;
                          setHapticsEnabled(next);
                          setHapticsOn(next);
                          if (next) triggerHaptic('correct', true);
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between transition cursor-pointer select-none"
                      title={showTranslation ? 'Увімкнути або вимкнути тактильний відгук' : 'Toggle haptic feedback'}
                      aria-pressed={isHapticsActive}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            isHapticsActive
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Vibrate className="w-4 h-4 shrink-0" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {showTranslation ? 'Тактильний відгук' : 'Haptic Feedback'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isHapticsActive
                              ? (showTranslation ? 'Вібрація на відповідях: Увімк' : 'Vibration on answers: On')
                              : (showTranslation ? 'Вібрація: Вимкнено' : 'Vibration: Off')}
                          </span>
                        </div>
                      </div>

                      {/* iOS-style animated toggle switch & quick test button */}
                      <div className="flex items-center gap-2">
                        {isHapticsActive && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('correct', true);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 active:scale-95 transition"
                            title={showTranslation ? 'Перевірити тактильний відгук' : 'Test vibration'}
                          >
                            {showTranslation ? 'Тест' : 'Test'}
                          </span>
                        )}
                        <div
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
                            isHapticsActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                              isHapticsActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })()}

                {/* Text Scaling Control (Compact / Normal / Large) */}
                <div className="px-3 py-2 border-t border-b border-slate-100 dark:border-slate-800/80 my-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {showTranslation ? 'Розмір шрифту' : 'Text Size'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {textSize === 'compact'
                        ? (showTranslation ? 'Дрібний' : 'Compact')
                        : textSize === 'large'
                        ? (showTranslation ? 'Великий' : 'Large')
                        : (showTranslation ? 'Стандарт' : 'Normal')}
                    </span>
                  </div>

                  {/* 3-segment switcher */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                    {(['compact', 'normal', 'large'] as TextSize[]).map((size) => {
                      const isActive = (textSize || 'normal') === size;
                      const label =
                        size === 'compact'
                          ? (showTranslation ? 'Дрібний' : 'Compact')
                          : size === 'normal'
                          ? (showTranslation ? 'Стандарт' : 'Normal')
                          : (showTranslation ? 'Великий' : 'Large');
                      const sizeSymbol = size === 'compact' ? 'A-' : size === 'normal' ? 'A' : 'A+';

                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => onTextSizeChange?.(size)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer select-none ${
                            isActive
                              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                          title={label}
                          aria-pressed={isActive}
                        >
                          <span className="font-mono text-[11px] font-bold">{sizeSymbol}</span>
                          <span className="text-[10px] hidden xs:inline">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenExport();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {showTranslation ? 'Експорт та збереження' : 'Export & Backup'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {showTranslation ? 'Notion, друк у PDF, JSON' : 'Notion, PDF print, JSON'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenReminder();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {showTranslation ? 'Нагадування про навчання' : 'Study Reminders'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {showTranslation ? 'Щоденні сповіщення' : 'Daily push notifications'}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onClearCache();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {showTranslation ? 'Очистити офлайн-кеш' : 'Clear Offline Cache'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {showTranslation ? 'Оновити базу та перезапустити SW' : 'Update data & refresh service worker'}
                    </span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onResetProgress();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {showTranslation ? 'Скинути прогрес' : 'Reset Progress'}
                    </span>
                    <span className="text-[10px] text-rose-400/80">
                      {showTranslation ? 'Очистити історію та статистику' : 'Clear history & accuracy'}
                    </span>
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
