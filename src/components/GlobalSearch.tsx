import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  BookOpen,
  Bookmark,
  CheckCircle2,
  XCircle,
  Hash,
  Layers,
  ArrowRight,
  Sparkles,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { CustomGroup, Question, QuestionProgress } from '../types';
import { getQuestionMasteryInfo } from '../utils/mastery';

interface GlobalSearchProps {
  questions: Question[];
  onSelectQuestion: (ticketNum: number) => void;
  progressMap?: Record<number, QuestionProgress>;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  categories: string[];
  customGroups?: CustomGroup[];
}

interface SearchResultItem {
  question: Question;
  matchType: 'ticket' | 'question' | 'category' | 'option' | 'explanation';
  matchSnippet?: string;
  score: number;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  questions,
  onSelectQuestion,
  progressMap = {},
  selectedFilter,
  onSelectFilter,
  categories,
  customGroups = [],
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute status counts for the category/filter dropdown
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

  // Keyboard shortcut listener (Cmd/Ctrl + K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isInputActive = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setIsMobileOpen(true);
        } else {
          desktopInputRef.current?.focus();
          setIsOpen(true);
        }
      } else if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setIsMobileOpen(true);
        } else {
          desktopInputRef.current?.focus();
          setIsOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus mobile input when modal opens
  useEffect(() => {
    if (isMobileOpen) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 50);
    }
  }, [isMobileOpen]);

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
      // Don't duplicate if already added as exact ticket match
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

      // Check for partial ticket number match (e.g. searching "78" finds 78, 780, 781)
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
          matchType: 'question',
          matchSnippet: q.questionUa,
          score: 150 + categoryBonus,
        });
      }
    });

    // Sort by relevance score descending
    return results.sort((a, b) => b.score - a.score).slice(0, 20);
  }, [query, questions, selectedFilter]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const handleSelect = (ticketNum: number) => {
    onSelectQuestion(ticketNum);
    setIsOpen(false);
    setIsMobileOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && !isMobileOpen) return;

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
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* 1. Desktop & Tablet Harmonious Combined Filter + Search Bar */}
      <div
        ref={containerRef}
        className="relative hidden sm:flex flex-1 max-w-xs md:max-w-md lg:max-w-lg items-center bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 rounded-xl transition-all focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500/40 focus-within:bg-white dark:focus-within:bg-slate-900 shadow-2xs"
      >
        {/* Category & Collection Filter Dropdown */}
        <div className="relative flex items-center shrink-0 border-r border-slate-200 dark:border-slate-700/80">
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={selectedFilter}
            onChange={(e) => onSelectFilter(e.target.value)}
            className="pl-7 pr-3 py-1.5 bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[120px] md:max-w-[145px] lg:max-w-[165px] truncate"
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
            <optgroup label="Exam Categories">
              {categories.map((cat) => {
                const count = questions.filter((q) => q.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
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
            onKeyDown={handleKeyDown}
            placeholder={
              selectedFilter !== 'all'
                ? `Search tickets, #num (⌘K)...`
                : 'Search 807 tickets or #num (⌘K)...'
            }
            className="w-full pl-8 pr-9 py-1.5 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
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
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150 max-h-[70vh] flex flex-col">
            {query.trim() === '' ? (
              <div className="p-4 text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
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
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-300 text-slate-700 dark:text-slate-300 transition"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
                <p className="text-[11px] pt-1">
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
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-medium text-slate-500 flex items-center justify-between">
                  <span>Found {searchResults.length} matching tickets</span>
                  <span className="text-[10px] text-slate-400">↑↓ to navigate · Enter to jump</span>
                </div>
                <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
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
                            ? 'bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
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
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${mastery.badgeClass}`}
                                title={mastery.explanationEn}
                              >
                                {mastery.labelEn}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-medium line-clamp-2 leading-relaxed">
                            {q.questionEn}
                          </div>
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

      {/* 2. Mobile Compact Search & Filter Trigger Button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 max-w-[150px] truncate transition active:scale-95"
      >
        <Search className="w-3.5 h-3.5 text-sky-500 shrink-0" />
        <span className="truncate text-[11px] font-semibold">
          {selectedFilter === 'all'
            ? 'Search & Filter'
            : selectedFilter.startsWith('group:')
            ? `📁 ${customGroups.find((g) => g.id === selectedFilter.replace('group:', ''))?.name || 'Collection'}`
            : selectedFilter === 'status:unstable'
            ? '⚡ Unstable'
            : selectedFilter === 'status:needs_review'
            ? '✗ Needs Review'
            : selectedFilter === 'status:improving'
            ? '↗ Improving'
            : selectedFilter === 'status:mastered'
            ? '✓ Mastered'
            : selectedFilter === 'status:bookmarked'
            ? '🔖 Bookmarked'
            : selectedFilter}
        </span>
      </button>

      {/* 3. Mobile Fullscreen Modal with Unified Search & Category Filter */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col p-2 sm:p-4 animate-in fade-in duration-100 sm:hidden">
          <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
            {/* Category Filter Selector on Mobile */}
            <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/30">
              <Filter className="w-4 h-4 text-sky-500 shrink-0" />
              <select
                value={selectedFilter}
                onChange={(e) => onSelectFilter(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
              >
                <option value="all">All Topics ({questions.length} Tickets)</option>
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
                <optgroup label="Exam Categories">
                  {categories.map((cat) => {
                    const count = questions.filter((q) => q.category === cat).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>

            {/* Search Input Bar */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticket #, keywords..."
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Mobile Results / Quick Topics */}
            <div className="overflow-y-auto flex-1 p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
              {query.trim() === '' ? (
                <div className="p-4 text-xs text-slate-400 space-y-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>Popular Quick Topics</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Dementia', 'Medications', 'Blood Pressure', 'Ethics', 'Palliative', 'Safety'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setQuery(tag)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs active:bg-sky-500 active:text-white"
                        >
                          {tag}
                        </button>
                      )
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Enter ticket numbers (e.g. <strong>#42</strong> or <strong>#781</strong>) to jump directly.
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
                      className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 active:bg-sky-500/10 transition flex items-start gap-2.5"
                    >
                      <span className="w-12 px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[11px] font-bold text-center shrink-0 mt-0.5">
                        #{q.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                          <span className="truncate">{q.category}</span>
                          {mastery.status !== 'unanswered' && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${mastery.badgeClass}`}
                            >
                              {mastery.labelEn}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {q.questionEn}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
