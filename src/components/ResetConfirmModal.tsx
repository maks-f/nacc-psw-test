import React, { useState } from 'react';
import { AlertTriangle, X, Trash2, ShieldAlert, Check } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    onConfirmReset();
    setHasConfirmedCheckbox(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121927] border border-rose-200 dark:border-rose-900/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Reset Progress & Statistics?
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Irreversible Action
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            This will permanently erase all your saved training records on this device, including:
          </p>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>
                <strong>807 Tickets:</strong> All viewed tags, accuracy scores, and mistake counts
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>
                <strong>Quiz Records:</strong> All completed exam history, scores, and time records
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>
                <strong>Bookmarks & Notes:</strong> All starred tickets and personal annotations
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>
                <strong>Habit Streak:</strong> Study streak days and active calendar history
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-[11px] text-sky-800 dark:text-sky-300">
            💡 <strong>Recommendation:</strong> If you wish to save your progress before resetting,
            you can download a backup JSON file from the <strong>Export</strong> menu in the top bar.
          </div>

          {/* Safety Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasConfirmedCheckbox}
              onChange={(e) => setHasConfirmedCheckbox(e.target.checked)}
              className="w-4 h-4 text-rose-500 rounded border-slate-300 mt-0.5"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              I understand that resetting cannot be undone and will wipe all my data.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
          >
            Cancel, Keep My Data
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasConfirmedCheckbox}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Permanently Reset Everything</span>
          </button>
        </div>
      </div>
    </div>
  );
};
