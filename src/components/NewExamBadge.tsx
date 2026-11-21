import React, { useState, useEffect, useRef } from 'react';
import { BadgePlus, X } from 'lucide-react';

interface NewExamBadgeProps {
  showTranslation?: boolean;
  compact?: boolean;
  interactive?: boolean;
}

export const NewExamBadge: React.FC<NewExamBadgeProps> = ({
  showTranslation = false,
  compact = false,
  interactive = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside or pressing Escape
  useEffect(() => {
    if (!showTooltip) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTooltip(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTooltip]);

  const tooltipText = showTranslation
    ? 'Нове питання з вибірки NACC Exam 2026 (додано окремо, раніше не було в базовому банку)'
    : 'New question from NACC Exam 2026 pool (newly added, was not in original bank)';

  const badgeContent = (
    <span
      className={`inline-flex items-center gap-1 rounded-md sm:rounded-lg font-bold border transition select-none shrink-0 ${
        compact
          ? 'px-1.5 py-0.5 text-[10px] leading-tight bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/35 hover:bg-indigo-500/25'
          : 'px-2 py-0.5 text-[11px] bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border-indigo-500/35 hover:border-indigo-500/50'
      } ${interactive ? 'cursor-pointer active:scale-95' : ''}`}
      title={tooltipText}
    >
      <BadgePlus className={compact ? 'w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0' : 'w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0'} />
      <span>{compact ? (showTranslation ? 'Нове' : 'New') : (showTranslation ? 'Нове в Exam 2026' : 'New in Exam 2026')}</span>
    </span>
  );

  if (!interactive) {
    return badgeContent;
  }

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip((prev) => !prev);
        }}
        className="inline-flex items-center focus:outline-hidden"
        aria-label={tooltipText}
      >
        {badgeContent}
      </button>

      {/* Touch-friendly Tooltip Popover */}
      {showTooltip && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-0 mb-1.5 z-40 w-64 p-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-xl backdrop-blur-xs border border-indigo-500/40 text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
              <BadgePlus className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{showTranslation ? 'Екзаменаційне оновлення 2026' : '2026 Exam Update'}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-white p-0.5"
              aria-label="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed">
            {tooltipText}
          </p>
        </div>
      )}
    </div>
  );
};
