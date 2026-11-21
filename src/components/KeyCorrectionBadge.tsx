import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, CheckCircle2, XCircle, Info } from 'lucide-react';
import { Question } from '../types';

interface KeyCorrectionBadgeProps {
  question: Question;
  showTranslation?: boolean;
  compact?: boolean;
}

export const KeyCorrectionBadge: React.FC<KeyCorrectionBadgeProps> = ({
  question,
  showTranslation = false,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const corr = question.keyCorrection;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!corr) return null;

  const correctOption = question.options.find((o) => o.id === question.correctOptionId);

  return (
    <>
      {/* Trigger Badge (Clickable on Mobile & Desktop) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-bold transition active:scale-95 cursor-pointer shadow-2xs select-none ${
          compact
            ? 'px-2 py-0.5 text-[10.5px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
            : 'px-2.5 py-1 text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border-amber-500/35 hover:border-amber-500/50'
        }`}
        title={
          showTranslation
            ? 'Увага: у старих тестах тут була помилка. Натисніть для деталей.'
            : 'Notice: This question had a disputed key in older tests. Click for details.'
        }
        aria-label={showTranslation ? 'Попередження про виправлену відповідь' : 'Key correction notice'}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
        <span>{showTranslation ? '⚠️ Виправлений ключ' : '⚠️ Corrected Key'}</span>
      </button>

      {/* Accessible Interactive Modal / Popover Tooltip (Portaled to body, 100% Mobile & Desktop friendly) */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[120] overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Centering container */}
            <div className="flex min-h-full items-center justify-center p-3 sm:p-5 text-center pointer-events-none">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="correction-dialog-title"
                className="relative w-full max-w-lg my-auto bg-white dark:bg-[#131C2E] border border-amber-500/40 rounded-3xl shadow-2xl text-left pointer-events-auto flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        id="correction-dialog-title"
                        className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate"
                      >
                        {showTranslation
                          ? 'Увага: виправлено офіційну відповідь'
                          : 'Notice: Key Correction Applied'}
                      </h3>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 font-medium truncate">
                        {showTranslation
                          ? `Квиток #${question.num} містив помилку в старому бланку`
                          : `Ticket #${question.num} had an erroneous key in legacy tests`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300">
                  {/* Visual Comparison Card */}
                  <div className="space-y-2.5">
                    {/* 1. Legacy Erroneous Option */}
                    <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{showTranslation ? 'Початково було позначено у тестах:' : 'Originally marked in legacy key:'}</span>
                        </span>
                        <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-800 dark:text-rose-300">
                          {showTranslation ? 'Помилковий ключ' : 'Faulty key'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 pl-5 text-xs sm:text-sm">
                        Варіант {corr.originalOptionId}: {corr.originalOptionTextEn}
                      </div>
                      {showTranslation && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                          {corr.originalOptionTextUa}
                        </div>
                      )}
                    </div>

                    {/* 2. Genuinely Correct Option */}
                    <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{showTranslation ? 'Дійсно правильна відповідь (зараховується):' : 'Genuinely correct answer (graded):'}</span>
                        </span>
                        <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                          {showTranslation ? 'Зараховується ✓' : 'Accepted ✓'}
                        </span>
                      </div>
                      <div className="font-bold text-emerald-900 dark:text-emerald-200 pl-5 text-xs sm:text-sm">
                        Варіант {question.correctOptionId}: {correctOption?.textEn}
                      </div>
                      {showTranslation && correctOption?.textUa && (
                        <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 pl-5">
                          {correctOption.textUa}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rationale / Clinical Explanation */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/90 dark:border-slate-800 space-y-1.5 leading-relaxed">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>{showTranslation ? 'Чому це виправлено' : 'Clinical & Standards Rationale'}</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200">
                      {showTranslation ? corr.reasonUa : corr.reasonEn}
                    </p>
                  </div>

                  {/* Clarification banner */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
                    💡{' '}
                    {showTranslation
                      ? 'У всіх режимах тренування та екзамену система зараховує як вірну виключно клінічно правильну відповідь.'
                      : 'Across all practice and exam modes, the platform grades and accepts exclusively the clinically correct answer.'}
                  </div>
                </div>

                {/* Footer Button */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    {showTranslation ? 'Зрозуміло' : 'Got It'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
