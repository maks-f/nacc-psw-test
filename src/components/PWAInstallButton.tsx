import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Smartphone,
  Laptop,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
}

type GuideTab = 'ios' | 'android' | 'desktop' | 'mac-safari';

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
}) => {
  const { isInstallable, isInstalled, platform, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Auto-detect initial guide tab based on current client device
  const defaultTab = useMemo<GuideTab>(() => {
    if (platform.isIOS) return 'ios';
    if (platform.isAndroid) return 'android';
    if (platform.isMac && platform.isSafari) return 'mac-safari';
    return 'desktop';
  }, [platform]);

  const [activeTab, setActiveTab] = useState<GuideTab>(defaultTab);

  // Sync tab with detected device when modal opens
  useEffect(() => {
    if (showGuideModal) {
      setActiveTab(defaultTab);
    }
  }, [showGuideModal, defaultTab]);

  // Close modal on Escape
  useEffect(() => {
    if (!showGuideModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowGuideModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuideModal]);

  // If already installed and running as standalone PWA or detected as installed, hide button completely
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === 'accepted') {
        return;
      }
      if (outcome === 'manual') {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Mobile Compact Button (< 640px) */}
      <button
        onClick={handleClick}
        className={`sm:hidden relative p-2 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 transition flex items-center justify-center cursor-pointer shadow-xs ${className}`}
        title="Install NACC Prep App / Встановити додаток"
        aria-label="Install NACC Prep PWA"
      >
        <Download className="w-4 h-4" />
        {isInstallable && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white dark:ring-[#0B111E] animate-pulse" />
        )}
      </button>

      {/* Desktop & Tablet Full Button (>= 640px) */}
      <button
        onClick={handleClick}
        className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95 ${className}`}
        title="Install NACC Exam Prep as an offline application"
        aria-label="Install NACC Exam Prep App"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
        {isInstallable && (
          <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse ml-0.5" />
        )}
      </button>

      {/* Cross-Platform Smart Installation Guide Modal rendered via Portal to escape header containing block */}
      {showGuideModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex flex-col justify-start sm:justify-center items-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowGuideModal(false);
              }
            }}
          >
            <div
              className="w-full max-w-md my-auto rounded-2xl bg-white dark:bg-[#131C2E] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header (Fixed at top) */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      id="pwa-install-title"
                      className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight"
                    >
                      Install NACC Prep
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Offline Study App · Автономний режим
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Device Selector Tabs (Fixed under header) */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl text-xs font-medium my-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('desktop')}
                  className={`py-1.5 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    activeTab === 'desktop'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Desktop</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={`py-1.5 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    activeTab === 'android'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Android</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={`py-1.5 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    activeTab === 'ios'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[10px]">iPhone/iPad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mac-safari')}
                  className={`py-1.5 px-1 rounded-lg text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    activeTab === 'mac-safari'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Mac Safari</span>
                </button>
              </div>

              {/* Scrollable Tab Instructions Content */}
              <div className="overflow-y-auto flex-1 min-h-0 space-y-3 pr-0.5 overscroll-contain text-xs text-slate-600 dark:text-slate-300">
                {activeTab === 'desktop' && (
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 shrink-0 mt-0.5 font-bold text-xs">
                        1
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Address Bar Icon / В адресному рядку
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Look at the right side of your browser URL bar. Click the{' '}
                          <strong>Install</strong> icon (computer monitor with down arrow) in
                          Chrome, Edge, or Brave.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 shrink-0 mt-0.5 font-bold text-xs">
                        2
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Browser Menu (⋮) / Меню браузера
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Alternatively, open the browser menu (⋮) → select{' '}
                          <strong>"Install NACC Exam Prep"</strong> or{' '}
                          <strong>"Save and share" → "Install page as app"</strong>.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Standalone Window / Окреме вікно
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          The app opens in its own window without browser toolbars and works fully
                          offline.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'android' && (
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 shrink-0 mt-0.5 font-bold text-xs">
                        1
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Tap Menu (⋮) / Меню Chrome
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Tap the three dots (⋮) in the top-right corner of Chrome or Samsung
                          Internet.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Install App / Встановити додаток
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Select <strong>"Install app"</strong> or{' '}
                          <strong>"Add to Home screen"</strong> (Додати на головний екран).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Home Screen Icon
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Tap "Install" to confirm. The NACC Prep icon will appear on your home
                          screen.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ios' && (
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
                        <Share className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Step 1: Tap Share / Натисніть "Поділитися"
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          In Safari, tap the <strong>Share</strong> button (box with upward arrow)
                          in the toolbar at the bottom.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Step 2: Add to Home Screen / На початковий екран
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Scroll down the sheet and select <strong>"Add to Home Screen"</strong>{' '}
                          (Додати на початковий екран).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Step 3: Tap Add / Готово
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Tap "Add" in the top-right corner. Launch NACC Prep in fullscreen app
                          mode.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'mac-safari' && (
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 shrink-0 mt-0.5 font-bold text-xs">
                        1
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Safari File Menu / Меню "Файл"
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          In Safari on macOS Sonoma or later, click <strong>File</strong> in the top
                          menu bar.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                        <PlusSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          Add to Dock / Додати до Dock
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          Select <strong>"Add to Dock..."</strong> (Додати до Dock) and click "Add".
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Benefits Banner */}
                <div className="p-3 rounded-xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>PWA Advantages / Переваги PWA</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    ✓ Full offline access to all 807 tickets and explanations
                    <br />
                    ✓ Fast launch without browser address bar clutter
                    <br />
                    ✓ Preserves all test progress and saved tickets locally
                  </p>
                </div>
              </div>

              {/* Modal Footer (Fixed at bottom) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition cursor-pointer shadow-xs active:scale-98"
                >
                  Got It · Зрозуміло
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
