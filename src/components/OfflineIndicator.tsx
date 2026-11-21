import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, WifiOff, CheckCircle2, X, HardDrive, Database, ShieldCheck } from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  showTranslation?: boolean;
  totalQuestions?: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showTranslation = false,
  totalQuestions = 925,
}) => {
  const { isOnline, isReadyOffline } = useOfflineStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  return (
    <>
      {/* 1. Header Badges */}
      {!isOnline ? (
        <>
          {/* Mobile Offline Warning Button (< 640px) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="sm:hidden p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center animate-pulse cursor-pointer shadow-xs"
            title={showTranslation ? `Офлайн режим (${totalQuestions} квитків в кеші)` : `Offline mode active (${totalQuestions} tickets cached)`}
            aria-label="Offline Mode Active"
          >
            <WifiOff className="w-4 h-4" />
          </button>

          {/* Desktop Offline Warning Badge (>= 640px) */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold animate-pulse transition cursor-pointer"
            title={showTranslation ? `Офлайн режим: ${totalQuestions} квитків доступні без мережі` : `Offline mode: ${totalQuestions} tickets cached locally`}
          >
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>{showTranslation ? `Офлайн (${totalQuestions} квитків)` : `Offline (${totalQuestions} Tickets)`}</span>
          </button>
        </>
      ) : (
        /* Desktop Online & Offline Ready Badge (>= 1024px) */
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium transition cursor-pointer"
          title={
            showTranslation
              ? `База з ${totalQuestions} квитків збережена в пам’яті пристрою. Працює без інтернету.`
              : `All ${totalQuestions} tickets cached locally. Works offline without internet.`
          }
          aria-label="Offline Readiness Status"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{showTranslation ? 'Офлайн готовий' : 'Offline Ready'}</span>
        </button>
      )}

      {/* 2. Detailed Offline Readiness Info Modal */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200"
              onClick={() => setIsModalOpen(false)}
              aria-hidden="true"
            />

            {/* Viewport */}
            <div className="flex min-h-full items-center justify-center p-3 sm:p-5 text-center pointer-events-none">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="offline-modal-title"
                className="relative w-full max-w-md my-auto bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl text-left pointer-events-auto flex flex-col overflow-hidden transition-all"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3
                        id="offline-modal-title"
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight"
                      >
                        {showTranslation ? 'Офлайн-готовність додатка' : 'Offline Readiness Status'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isOnline
                          ? showTranslation
                            ? 'Підключено до мережі · Кеш готовий'
                            : 'Connected to Network · Cache Ready'
                          : showTranslation
                          ? 'Автономний режим · Без інтернету'
                          : 'Offline Mode · No Internet'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                  {/* Status Banner */}
                  <div
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                      isOnline
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500/30 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    />
                    <div className="space-y-0.5 leading-relaxed">
                      <div className="font-bold text-xs">
                        {isOnline
                          ? showTranslation
                            ? 'Додаток на 100% готовий до роботи без інтернету'
                            : 'Application is 100% ready for offline use'
                          : showTranslation
                          ? 'Ви працюєте автономно: повна функціональність збережена'
                          : 'You are working offline: full study functionality preserved'}
                      </div>
                      <p className="text-[11px] opacity-90">
                        {showTranslation
                          ? 'Ви можете готуватися до іспиту NACC PSW у лікарні, транспорті чи за відсутності зв’язку.'
                          : 'You can prepare for the NACC PSW exam anywhere without mobile data or Wi-Fi.'}
                      </p>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-850/70 p-3.5 border border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {showTranslation ? `${totalQuestions} офіційних квитків у пам’яті` : `${totalQuestions} official tickets preloaded`}
                      </span>
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {totalQuestions} / {totalQuestions}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {showTranslation ? 'Клінічні пояснення та мнемоніки' : 'Clinical rationales & memory aids'}
                      </span>
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {showTranslation ? 'Готово' : 'Ready'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {showTranslation ? 'Локальне збереження відповідей та нотаток' : 'Local storage of answers & notes'}
                      </span>
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {showTranslation ? 'Активно' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850/50 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    {showTranslation ? 'Зрозуміло' : 'Got it'}
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
