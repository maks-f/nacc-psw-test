import React, { useState, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Upload,
  Printer,
  FileText,
  Cloud,
  FileCheck,
} from 'lucide-react';
import { Question, QuestionProgress } from '../types';
import {
  downloadFile,
  generateNotionMarkdown,
  printCheatSheet,
} from '../utils/exporters';
import { exportAllDataJSON, importAllDataJSON } from '../utils/storage';

interface ExportSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  progressMap: Record<number, QuestionProgress>;
  onDataImported: () => void;
}

export const ExportSyncModal: React.FC<ExportSyncModalProps> = ({
  isOpen,
  onClose,
  questions,
  progressMap,
  onDataImported,
}) => {
  const [copiedNotion, setCopiedNotion] = useState(false);
  const [notionFilter, setNotionFilter] = useState<'bookmarked' | 'mistakes' | 'all'>(
    'bookmarked'
  );
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopyNotion = async () => {
    const md = generateNotionMarkdown(questions, progressMap, notionFilter);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedNotion(true);
      setTimeout(() => setCopiedNotion(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedNotion(true);
      setTimeout(() => setCopiedNotion(false), 2500);
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportAllDataJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(
      `nacc-psw-prep-backup-${dateStr}.json`,
      jsonStr,
      'application/json'
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importAllDataJSON(content);
        if (success) {
          setImportStatus('Progress & stats successfully restored!');
          onDataImported();
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePrintPDF = () => {
    let target = questions;
    let label = 'All Tickets';
    if (notionFilter === 'bookmarked') {
      target = questions.filter((q) => progressMap[q.id]?.bookmarked);
      label = 'Starred / Bookmarked Tickets';
    } else if (notionFilter === 'mistakes') {
      target = questions.filter((q) => (progressMap[q.id]?.incorrectCount || 0) > 0);
      label = 'Difficult Mistake Tickets';
    }
    printCheatSheet(target, label);
  };

  const bookmarkedCount = questions.filter((q) => progressMap[q.id]?.bookmarked).length;
  const mistakesCount = questions.filter((q) => (progressMap[q.id]?.incorrectCount || 0) > 0)
    .length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Export, Backup & Notion Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync progress across devices or export study notes
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {importStatus && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2 text-xs">
              <FileCheck className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Section 1: Notion Markdown Note Export */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Notion Study Notes Export
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold">
                1-Click Markdown
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generates beautifully formatted markdown with Ukrainian translations, correct
              answers, clinical rationales, and memory mnemonics to paste into your Notion
              workspace.
            </p>

            {/* Scope selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNotionFilter('bookmarked')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                  notionFilter === 'bookmarked'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Saved ({bookmarkedCount})
              </button>
              <button
                type="button"
                onClick={() => setNotionFilter('mistakes')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                  notionFilter === 'mistakes'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Mistakes ({mistakesCount})
              </button>
              <button
                type="button"
                onClick={() => setNotionFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                  notionFilter === 'all'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                All (807)
              </button>
            </div>

            <button
              onClick={handleCopyNotion}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              {copiedNotion ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied to Clipboard! Ready to paste into Notion</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Notion Notes to Clipboard</span>
                </>
              )}
            </button>
          </div>

          {/* Section 2: PDF Printable Guide */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-2.5">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-indigo-500" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Offline PDF / Print Cheat Sheet
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generates a clean, high-contrast, printable booklet with questions, answers, and
              rationales for offline revision without a screen.
            </p>
            <button
              onClick={handlePrintPDF}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Generate Printable PDF ({notionFilter} filter)</span>
            </button>
          </div>

          {/* Section 3: Cloud Sync / Google Drive JSON Backup */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Backup & Restore (Google Drive Compatible)
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save your entire progress, bookmarks, and quiz statistics to a backup file. You can
              store it in Google Drive or iCloud and restore it on your phone or tablet at any
              time.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadBackup}
                className="flex-1 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Backup</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Restore Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
