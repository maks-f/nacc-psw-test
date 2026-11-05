import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode, hide button
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Desktop
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition"
        title="Install NACC Prep app to home screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:border-sky-400 transition"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden sm:inline">Add to Home Screen</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Install on iPhone / iPad (iOS)
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  To install this exam preparation app on your iPhone and study offline without
                  browser toolbars:
                </p>

                <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
                      <Share className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-white block">
                        Step 1: Tap Share
                      </strong>
                      <span>Tap the Safari Share button in the toolbar at the bottom.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-white block">
                        Step 2: Add to Home Screen
                      </strong>
                      <span>Scroll down and select "Add to Home Screen" (Додати на початковий екран).</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Once added, tap the NACC Prep icon on your home screen to launch in fullscreen
                  native app mode!
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback button for desktop browsers or unsupported prompt
  return (
    <button
      onClick={() => setShowIOSGuide(true)}
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:border-sky-400 transition"
      title="How to install on mobile"
    >
      <Smartphone className="w-3.5 h-3.5 text-sky-500" />
      <span>Install PWA</span>
    </button>
  );
};
