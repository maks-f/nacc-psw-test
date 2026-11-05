import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  X,
  Layers,
  ArrowRight,
  Sparkles,
  Filter,
  ChevronDown,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CustomGroup, Question, QuestionProgress } from '../types';
import { getQuestionMasteryInfo } from '../utils/mastery';
import { getCategoryTranslation } from '../utils/categories';

interface GlobalSearchProps {
  questions: Question[];
  onSelectQuestion: (ticketNum: number) => void;
  progressMap?: Record<number, QuestionProgress>;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  categories: string[];
  customGroups?: CustomGroup[];
  showTranslation?: boolean;
}

interface SearchResultItem {
  question: Question;
  matchType: 'ticket' | 'question' | 'category' | 'option' | 'explanation' | 'ukrainian';
  matchSnippet?: string;
  score: number;
}

interface FilterItemProps {
  active: boolean;
  label: string;
  sub?: string;
  count: number;
  badgeClass?: string;
  onSelect: () => void;
}

const FilterItem: React.FC<FilterItemProps> = ({
  active,
  label,
  sub,
  count,
  badgeClass = 'text-slate-600 dark:text-slate-300',
  onSelect,
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition active:scale-[0.99] ${
      active
        ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-950 dark:text-sky-200 shadow-xs font-bold'
        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-[#1f2b3e] text-slate-800 dark:text-slate-100 bg-slate-50/80 dark:bg-[#162032]'
    }`}
  >
    <div className="flex-1 min-w-0 pr-3">
      <div className="text-xs sm:text-sm font-semibold whitespace-normal break-words leading-snug">
        {label}
      </div>
      {sub && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
          {sub}
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <span
        className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 ${badgeClass}`}
      >
        {count}
      </span>
      {active ? (
        <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
      )}
    </div>
  </button>
);

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  questions,
  onSelectQuestion,
  progressMap = {},
  selectedFilter,
  onSelectFilter,
  categories,
  customGroups = [],
  showTranslation = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterModalRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute status counts for the category/filter dropdown and drawers
  const statusCounts = useMemo(() => {
    let unstable = 0;
    let needsReview = 0;
    let improving = 0;
    let mastered = 0;
    let bookmarked = 0;
    questions.forEach((q) => {
      const p = progressMap[q.id];
      if (p?.bookmarked) bookmarked++;
      const m = getQuestionMasteryInfo(p);
      if (m.status === 'unstable') unstable++;
      else if (m.status === 'needs_review') needsReview++;
      else if (m.status === 'improving') improving++;
      else if (m.status === 'mastered') mastered++;
    });
    return { unstable, needsReview, improving, mastered, bookmarked };
  }, [questions, progressMap]);

  // Compute active filter details for UI labels & badges
  const activeFilterInfo = useMemo(() => {
    if (selectedFilter === 'all') {
      return {
        label: showTranslation ? 'Всі теми' : 'All Topics',
        count: questions.length,
        isFiltered: false,
      };
    }
    if (selectedFilter === 'status:unstable') {
      return {
        label: showTranslation ? '⚡ Нестабільні' : '⚡ Unstable',
        count: statusCounts.unstable,
        isFiltered: true,
      };
    }
    if (selectedFilter === 'status:needs_review') {
      return {
        label: showTranslation ? '✗ Повторення' : '✗ Needs Review',
        count: statusCounts.needsReview,
        isFiltered: true,
      };
    }
    if (selectedFilter === 'status:improving') {
      return {
        label: showTranslation ? '↗ Покращення' : '↗ Improving',
        count: statusCounts.improving,
        isFiltered: true,
      };
    }
    if (selectedFilter === 'status:mastered') {
      return {
        label: showTranslation ? '✓ Засвоєні' : '✓ Mastered',
        count: statusCounts.mastered,
        isFiltered: true,
      };
    }
    if (selectedFilter === 'status:bookmarked') {
      return {
        label: showTranslation ? '🔖 Збережені' : '🔖 Bookmarked',
        count: statusCounts.bookmarked,
        isFiltered: true,
      };
    }
    if (selectedFilter.startsWith('group:')) {
      const gid = selectedFilter.replace('group:', '');
      const g = customGroups.find((grp) => grp.id === gid);
      return {
        label: g ? `📁 ${g.name}` : (showTranslation ? 'Колекція' : 'Collection'),
        count: g ? g.questionIds.length : 0,
        isFiltered: true,
      };
    }
    const catCount = questions.filter((q) => q.category === selectedFilter).length;
    return {
      label: showTranslation ? getCategoryTranslation(selectedFilter) : selectedFilter,
      count: catCount,
      isFiltered: true,
    };
  }, [selectedFilter, questions, statusCounts, customGroups, showTranslation]);

  // Lock body scroll when mobile modals are active
  useEffect(() => {
    if (isFilterOpen || isSearchOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFilterOpen, isSearchOpen]);

  // Auto-close mobile modals on resize to desktop (>= 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsFilterOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Autofocus mobile search input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Global Keyboard shortcut listener (Cmd/Ctrl + K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isInputActive = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsFilterOpen(false);
          setIsSearchOpen(true);
        } else {
          desktopInputRef.current?.focus();
          setIsOpen(true);
        }
      } else if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsFilterOpen(false);
          setIsSearchOpen(true);
        } else {
          desktopInputRef.current?.focus();
          setIsOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsFilterOpen(false);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and score questions based on query
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    // Check if query is a ticket number (e.g. "42", "#42", "ticket 42")
    const numericMatch = trimmed.replace(/^[#\s]*(ticket\s*)?/, '').trim();
    const parsedNum = parseInt(numericMatch, 10);
    const isPureNumber = !isNaN(parsedNum) && String(parsedNum) === numericMatch;

    const results: SearchResultItem[] = [];

    // If pure number, prioritize exact ticket match
    if (isPureNumber) {
      const exactQ = questions.find((q) => q.num === parsedNum);
      if (exactQ) {
        results.push({
          question: exactQ,
          matchType: 'ticket',
          matchSnippet: `Ticket #${exactQ.num} (Exact Match)`,
          score: 1000,
        });
      }
    }

    const queryWords = trimmed.split(/\s+/).filter(Boolean);

    questions.forEach((q) => {
      if (isPureNumber && q.num === parsedNum) return;

      const qEn = q.questionEn.toLowerCase();
      const qCat = q.category.toLowerCase();
      const qUa = (q.questionUa || '').toLowerCase();
      const qExpl = (q.explanation || '').toLowerCase();
      const qMem = (q.howToRemember || '').toLowerCase();

      // Bonus score if question matches current category filter
      const categoryBonus =
        selectedFilter !== 'all' &&
        (selectedFilter.startsWith('group:') || q.category === selectedFilter)
          ? 50
          : 0;

      // Partial ticket number match (e.g. "78" finds 78, 780, 781)
      if (numericMatch && String(q.num).startsWith(numericMatch)) {
        results.push({
          question: q,
          matchType: 'ticket',
          matchSnippet: `Ticket #${q.num}`,
          score: 800 - (q.num - parsedNum * 10) + categoryBonus,
        });
        return;
      }

      // Check if all query words match in the question text or category
      const wordsInTitle = queryWords.every((w) => qEn.includes(w));
      if (wordsInTitle) {
        const exactPhrase = qEn.includes(trimmed);
        results.push({
          question: q,
          matchType: 'question',
          matchSnippet: q.questionEn,
          score: (exactPhrase ? 600 : 500) + categoryBonus,
        });
        return;
      }

      // Check Category match
      const wordsInCat = queryWords.every((w) => qCat.includes(w));
      if (wordsInCat) {
        results.push({
          question: q,
          matchType: 'category',
          matchSnippet: `${q.category} · Ticket #${q.num}`,
          score: 400 + categoryBonus,
        });
        return;
      }

      // Check Option texts
      const matchingOpt = q.options.find((opt) => {
        const optEn = opt.textEn.toLowerCase();
        return queryWords.every((w) => optEn.includes(w));
      });
      if (matchingOpt) {
        results.push({
          question: q,
          matchType: 'option',
          matchSnippet: `Option ${matchingOpt.id}: ${matchingOpt.textEn}`,
          score: 300 + categoryBonus,
        });
        return;
      }

      // Check Clinical explanation / Mnemonic
      if (queryWords.every((w) => qExpl.includes(w) || qMem.includes(w))) {
        results.push({
          question: q,
          matchType: 'explanation',
          matchSnippet: `Rationale: ${q.explanation.substring(0, 100)}...`,
          score: 200 + categoryBonus,
        });
        return;
      }

      // Check Ukrainian translation
      if (queryWords.every((w) => qUa.includes(w))) {
        results.push({
          question: q,
          matchType: 'ukrainian',
          matchSnippet: q.questionUa,
          score: 150 + categoryBonus,
        });
      }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 25);
  }, [query, questions, selectedFilter]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const handleSelect = (ticketNum: number) => {
    onSelectQuestion(ticketNum);
    setIsOpen(false);
    setIsSearchOpen(false);
    setQuery('');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleDesktopKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex].question.num);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* 1. Mobile & Narrow Tablet Triggers (< 768px / md:hidden) */}
      <div className="flex md:hidden items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-center max-w-[260px] sm:max-w-xs">
        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsFilterOpen(true);
            setIsSearchOpen(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 min-w-0 flex-1 max-w-[155px] sm:max-w-[170px] truncate ${
            activeFilterInfo.isFiltered
              ? 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/40 text-sky-700 dark:text-sky-300 shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200'
          }`}
          title="Filter tickets by topic or mastery status"
          aria-label={`Filter: ${activeFilterInfo.label}. Click to change.`}
        >
          <Filter
            className={`w-3.5 h-3.5 shrink-0 ${
              activeFilterInfo.isFiltered ? 'text-sky-500 dark:text-sky-400' : 'text-slate-400'
            }`}
          />
          <span className="truncate text-[11px]">
            {activeFilterInfo.label}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-auto opacity-70" />
        </button>

        {/* Search Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsSearchOpen(true);
            setIsFilterOpen(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 transition active:scale-95 shadow-2xs shrink-0"
          title="Search tickets by #number, clinical keywords, or terms (⌘K)"
          aria-label="Open ticket search"
        >
          <Search className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400">
            Search
          </span>
        </button>
      </div>

      {/* 2. Mobile / Tablet Dedicated Filter Modal (< 768px) - PORTALED TO DOCUMENT.BODY */}
      {isMounted &&
        isFilterOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex flex-col justify-start sm:justify-center p-2 sm:p-4 animate-in fade-in duration-150 md:hidden overflow-y-auto"
            onClick={() => setIsFilterOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Filter study scope"
          >
            <div
              ref={filterModalRef}
              className="w-full max-w-lg bg-white dark:bg-[#0B111E] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden mt-1 sm:my-auto animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-[#131C2E] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {showTranslation ? 'Фільтр квитків' : 'Filter Study Tickets'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {showTranslation
                        ? 'Оберіть категорію або статус для повторення'
                        : 'Select a topic or review status to focus your study'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Close filter drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Filter Reset Banner */}
              {selectedFilter !== 'all' && (
                <div className="px-4 py-2 bg-sky-50/90 dark:bg-sky-950/50 border-b border-sky-100 dark:border-sky-900/40 flex items-center justify-between shrink-0">
                  <div className="text-[11px] text-sky-800 dark:text-sky-300 truncate pr-2">
                    {showTranslation ? 'Активний:' : 'Active:'} <strong>{activeFilterInfo.label}</strong> ({activeFilterInfo.count})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFilter('all');
                      setIsFilterOpen(false);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{showTranslation ? 'Скинути' : 'Reset to All'}</span>
                  </button>
                </div>
              )}

              {/* Scrollable Filter Options List */}
              <div className="overflow-y-auto flex-1 min-h-0 p-4 space-y-4 overscroll-contain bg-white dark:bg-[#0B111E]">
                {/* 1. All Topics Option */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFilter('all');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition active:scale-[0.99] ${
                      selectedFilter === 'all'
                        ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-950 dark:text-sky-200 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-[#1f2b3e] text-slate-800 dark:text-slate-100 bg-slate-50/80 dark:bg-[#162032]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {showTranslation ? 'Всі теми (Повний іспит)' : 'All Topics (Complete Exam)'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {showTranslation ? 'Всі 807 квитків без обмежень' : 'All 807 tickets without filter'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                        {questions.length}
                      </span>
                      {selectedFilter === 'all' ? (
                        <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                      )}
                    </div>
                  </button>
                </div>

                {/* 2. Official Exam Categories */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1 mb-2 flex items-center justify-between">
                    <span>{showTranslation ? 'Офіційні категорії NACC' : 'NACC Exam Categories'}</span>
                    <span className="text-[10px] font-mono font-normal">({categories.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {categories.map((cat) => {
                      const count = questions.filter((q) => q.category === cat).length;
                      return (
                        <FilterItem
                          key={cat}
                          active={selectedFilter === cat}
                          label={cat}
                          sub={getCategoryTranslation(cat)}
                          count={count}
                          badgeClass="text-sky-600 dark:text-sky-400"
                          onSelect={() => {
                            onSelectFilter(cat);
                            setIsFilterOpen(false);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 3. Study Mastery & Progress Statuses */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1 mb-2">
                    {showTranslation ? 'Статус засвоєння' : 'Study Mastery & Status'}
                  </div>
                  <div className="space-y-1.5">
                    <FilterItem
                      active={selectedFilter === 'status:unstable'}
                      label={showTranslation ? '⚡ Нестабільні квитки' : '⚡ Unstable Tickets'}
                      sub={showTranslation ? 'Змішані відповіді, потребують закріплення' : 'Mixed answers, needs reinforcement'}
                      count={statusCounts.unstable}
                      badgeClass="text-amber-600 dark:text-amber-400"
                      onSelect={() => {
                        onSelectFilter('status:unstable');
                        setIsFilterOpen(false);
                      }}
                    />
                    <FilterItem
                      active={selectedFilter === 'status:needs_review'}
                      label={showTranslation ? '✗ Потребують повторення' : '✗ Needs Review'}
                      sub={showTranslation ? 'Помилки під час останніх спроб' : 'Recently answered incorrectly'}
                      count={statusCounts.needsReview}
                      badgeClass="text-rose-600 dark:text-rose-400"
                      onSelect={() => {
                        onSelectFilter('status:needs_review');
                        setIsFilterOpen(false);
                      }}
                    />
                    <FilterItem
                      active={selectedFilter === 'status:improving'}
                      label={showTranslation ? '↗ Покращуються' : '↗ Improving'}
                      sub={showTranslation ? 'Серія правильних відповідей' : 'Consecutive correct answers'}
                      count={statusCounts.improving}
                      badgeClass="text-indigo-600 dark:text-indigo-400"
                      onSelect={() => {
                        onSelectFilter('status:improving');
                        setIsFilterOpen(false);
                      }}
                    />
                    <FilterItem
                      active={selectedFilter === 'status:mastered'}
                      label={showTranslation ? '✓ Засвоєні (≥80%)' : '✓ Mastered (≥80%)'}
                      sub={showTranslation ? 'Стабільно засвоєні квитки' : 'Answered ≥3 times with high accuracy'}
                      count={statusCounts.mastered}
                      badgeClass="text-emerald-600 dark:text-emerald-400"
                      onSelect={() => {
                        onSelectFilter('status:mastered');
                        setIsFilterOpen(false);
                      }}
                    />
                    <FilterItem
                      active={selectedFilter === 'status:bookmarked'}
                      label={showTranslation ? '🔖 Збережені' : '🔖 Bookmarked'}
                      sub={showTranslation ? 'Збережені для швидкого перегляду' : 'Starred questions for review'}
                      count={statusCounts.bookmarked}
                      badgeClass="text-amber-500"
                      onSelect={() => {
                        onSelectFilter('status:bookmarked');
                        setIsFilterOpen(false);
                      }}
                    />
                  </div>
                </div>

                {/* 4. Custom Collections (if any created) */}
                {customGroups.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1 mb-2">
                      {showTranslation ? 'Власні колекції' : 'Custom Collections'}
                    </div>
                    <div className="space-y-1.5">
                      {customGroups.map((g) => (
                        <FilterItem
                          key={g.id}
                          active={selectedFilter === `group:${g.id}`}
                          label={`📁 ${g.name}`}
                          sub={`${g.questionIds.length} tickets`}
                          count={g.questionIds.length}
                          onSelect={() => {
                            onSelectFilter(`group:${g.id}`);
                            setIsFilterOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Safe Area Bottom Padding */}
                <div className="h-8 safe-area-pb" />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 3. Mobile / Tablet Dedicated Search Modal (< 768px) - PORTALED TO DOCUMENT.BODY */}
      {isMounted &&
        isSearchOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex flex-col justify-start sm:justify-center p-2 sm:p-4 animate-in fade-in duration-100 md:hidden"
            onClick={() => setIsSearchOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Search exam questions"
          >
            <div
              ref={searchModalRef}
              className="w-full max-w-lg bg-white dark:bg-[#0B111E] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[85vh] mt-0 sm:my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input Bar */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/90 dark:bg-[#131C2E]">
                <Search className="w-4 h-4 text-sky-500 shrink-0" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      handleSelect(searchResults[0].question.num);
                    } else if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                    }
                  }}
                  placeholder="Search ticket # (e.g. 42), clinical terms..."
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      mobileInputRef.current?.focus();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    aria-label="Clear search input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
                >
                  Close
                </button>
              </div>

              {/* Active filter reminder banner */}
              {selectedFilter !== 'all' && (
                <div className="px-3.5 py-1.5 bg-sky-50/80 dark:bg-sky-950/50 border-b border-sky-100 dark:border-sky-900/40 text-[11px] text-sky-800 dark:text-sky-300 flex items-center justify-between">
                  <span className="truncate">
                    Active filter: <strong>{activeFilterInfo.label}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsFilterOpen(true);
                    }}
                    className="text-[10px] font-semibold underline shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Mobile Results / Quick Topics */}
              <div className="overflow-y-auto flex-1 p-2 divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#0B111E]">
                {query.trim() === '' ? (
                  <div className="p-4 text-xs text-slate-500 dark:text-slate-400 space-y-3">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                      <span>Popular Quick Topics</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Dementia', 'Medications', 'Blood Pressure', 'Ethics', 'Palliative', 'Safety'].map(
                        (tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setQuery(tag);
                              mobileInputRef.current?.focus();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#162032] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs active:bg-sky-500 active:text-white transition"
                          >
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                      Enter ticket numbers (e.g. <strong>#42</strong> or <strong>42</strong>) to jump directly.
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No tickets found for "{query}"
                    </p>
                    <p className="mt-1">Try another keyword, ticket number, or category name.</p>
                  </div>
                ) : (
                  searchResults.map((item) => {
                    const q = item.question;
                    const p = progressMap[q.id];
                    const mastery = getQuestionMasteryInfo(p);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleSelect(q.num)}
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-[#162032] active:bg-sky-500/10 transition flex items-start gap-2.5 text-slate-800 dark:text-slate-100"
                      >
                        <span className="w-12 px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[11px] font-bold text-center shrink-0 mt-0.5">
                          #{q.num}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                            <span className="truncate">{q.category}</span>
                            {mastery.status !== 'unanswered' && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 whitespace-nowrap ${mastery.badgeClass}`}
                                title={showTranslation ? mastery.explanationUa : mastery.explanationEn}
                              >
                                <span className="hidden xs:inline">
                                  {showTranslation ? mastery.labelUa : mastery.labelEn}
                                </span>
                                <span className="xs:hidden">
                                  {showTranslation ? mastery.compactLabelUa : mastery.compactLabelEn}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                            {q.questionEn}
                          </div>
                          {showTranslation && q.questionUa && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 mt-0.5">
                              {q.questionUa}
                            </div>
                          )}
                          {item.matchType !== 'question' && item.matchSnippet && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              ↳ {item.matchSnippet}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 4. Desktop & Tablet Inline Combined Filter + Search Bar (>= 768px / md:flex) */}
      <div
        ref={containerRef}
        className="relative hidden md:flex flex-1 max-w-sm lg:max-w-md xl:max-w-lg items-center bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-xl transition-all focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500/40 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-2xs"
      >
        {/* Category & Collection Filter Dropdown */}
        <div className="relative flex items-center shrink-0 border-r border-slate-200 dark:border-slate-700/80">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={selectedFilter}
            onChange={(e) => onSelectFilter(e.target.value)}
            className="pl-7 pr-3 py-1.5 bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[125px] lg:max-w-[155px] truncate [&>option]:bg-white dark:[&>option]:bg-[#131C2E] [&>option]:text-slate-900 dark:[&>option]:text-slate-100 [&>optgroup]:bg-white dark:[&>optgroup]:bg-[#131C2E] [&>optgroup]:text-slate-600 dark:[&>optgroup]:text-slate-400"
            title="Filter active study category or collection"
          >
            <option value="all">All Topics ({questions.length})</option>
            <optgroup label="Study Mastery Status">
              {statusCounts.unstable > 0 && (
                <option value="status:unstable">⚡ Unstable ({statusCounts.unstable})</option>
              )}
              {statusCounts.needsReview > 0 && (
                <option value="status:needs_review">✗ Needs Review ({statusCounts.needsReview})</option>
              )}
              {statusCounts.improving > 0 && (
                <option value="status:improving">↗ Improving ({statusCounts.improving})</option>
              )}
              {statusCounts.mastered > 0 && (
                <option value="status:mastered">✓ Mastered ({statusCounts.mastered})</option>
              )}
              {statusCounts.bookmarked > 0 && (
                <option value="status:bookmarked">🔖 Bookmarked ({statusCounts.bookmarked})</option>
              )}
            </optgroup>
            {customGroups.length > 0 && (
              <optgroup label="Custom Collections">
                {customGroups.map((g) => (
                  <option key={g.id} value={`group:${g.id}`}>
                    📁 {g.name} ({g.questionIds.length})
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label={showTranslation ? 'Офіційні категорії NACC' : 'Exam Categories'}>
              {categories.map((cat) => {
                const count = questions.filter((q) => q.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {showTranslation ? getCategoryTranslation(cat) : cat} ({count})
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>

        {/* Global Keyword & Ticket Number Search */}
        <div className="relative flex-1 flex items-center min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            ref={desktopInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleDesktopKeyDown}
            placeholder={
              selectedFilter !== 'all'
                ? `Search tickets, #num (⌘K)...`
                : 'Search 807 tickets or #num (⌘K)...'
            }
            className="w-full pl-8 pr-9 py-1.5 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  desktopInputRef.current?.focus();
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded shadow-2xs">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Desktop Results Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0B111E] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150 max-h-[70vh] flex flex-col">
            {query.trim() === '' ? (
              <div className="p-4 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                  <span>Popular Search Topics</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['Dementia', 'Medications', 'Blood Pressure', 'Palliative', 'Safety', 'Ethics'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setQuery(tag);
                          desktopInputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#162032] border border-slate-200/80 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-300 text-slate-700 dark:text-slate-300 transition"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
                <p className="text-[11px] pt-1 text-slate-400 dark:text-slate-500">
                  Tip: Type a ticket number like <strong className="text-slate-700 dark:text-slate-300">#42</strong> to jump straight to that ticket.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  No questions found for "{query}"
                </p>
                <p className="mt-1">
                  Try typing ticket numbers (1–807), topics like <em>Ethics</em> or medical terms.
                </p>
              </div>
            ) : (
              <>
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#131C2E] text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Found {searchResults.length} matching tickets</span>
                  <span className="text-[10px] text-slate-400">↑↓ to navigate · Enter to jump</span>
                </div>
                <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-1 bg-white dark:bg-[#0B111E]">
                  {searchResults.map((item, idx) => {
                    const q = item.question;
                    const p = progressMap[q.id];
                    const mastery = getQuestionMasteryInfo(p);
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleSelect(q.num)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-slate-900 dark:text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-[#162032] text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="w-12 px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[11px] font-bold text-center shrink-0 mt-0.5">
                          #{q.num}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">
                              {q.category}
                            </span>
                            {mastery.status !== 'unanswered' && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 whitespace-nowrap ${mastery.badgeClass}`}
                                title={showTranslation ? mastery.explanationUa : mastery.explanationEn}
                              >
                                <span className="hidden xs:inline">
                                  {showTranslation ? mastery.labelUa : mastery.labelEn}
                                </span>
                                <span className="xs:hidden">
                                  {showTranslation ? mastery.compactLabelUa : mastery.compactLabelEn}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-medium line-clamp-2 leading-relaxed text-slate-900 dark:text-slate-100">
                            {q.questionEn}
                          </div>
                          {showTranslation && q.questionUa && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 mt-0.5">
                              {q.questionUa}
                            </div>
                          )}
                          {item.matchType !== 'question' && item.matchSnippet && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              ↳ {item.matchSnippet}
                            </div>
                          )}
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1 opacity-0 group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};
