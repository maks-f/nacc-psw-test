import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Check,
  Plus,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CustomGroup } from '../types';

interface QuestionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: number;
  ticketNum: number;
  customGroups: CustomGroup[];
  onToggleQuestionInGroup: (groupId: string, questionId: number) => void;
  onCreateGroup: (name: string, color: string) => CustomGroup;
  onDeleteGroup: (groupId: string) => void;
}

const COLOR_OPTIONS = [
  '#0284c7', // Sky Blue
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

export const QuestionGroupModal: React.FC<QuestionGroupModalProps> = ({
  isOpen,
  onClose,
  questionId,
  ticketNum,
  customGroups,
  onToggleQuestionInGroup,
  onCreateGroup,
  onDeleteGroup,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const created = onCreateGroup(newGroupName.trim(), selectedColor);
    // Add current question into the newly created group immediately
    onToggleQuestionInGroup(created.id, questionId);
    setNewGroupName('');
    setIsCreating(false);
  };

  const assignedGroups = customGroups.filter((g) => g.questionIds.includes(questionId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Assign Ticket #{ticketNum} to Collections
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organize questions into custom study sets and quizzes
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

        {/* Currently Assigned Summary */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Active in {assignedGroups.length} collection
            {assignedGroups.length === 1 ? '' : 's'}
          </span>
          {assignedGroups.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {assignedGroups.map((g) => (
                <span
                  key={g.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-xs"
                  style={{ backgroundColor: g.color }}
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Collections List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {customGroups.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p>No collections created yet.</p>
              <p className="mt-1">Create your first custom study collection below!</p>
            </div>
          ) : (
            customGroups.map((group) => {
              const isAssigned = group.questionIds.includes(questionId);
              return (
                <div
                  key={group.id}
                  onClick={() => onToggleQuestionInGroup(group.id, questionId)}
                  className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                    isAssigned
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: group.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {group.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {group.questionIds.length} ticket
                        {group.questionIds.length === 1 ? '' : 's'} inside
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isAssigned
                          ? 'bg-sky-500 border-sky-500 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isAssigned && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Delete collection "${group.name}"? Tickets will remain in the main bank.`
                          )
                        ) {
                          onDeleteGroup(group.id);
                        }
                      }}
                      className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Delete this collection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* New Group Creator */}
          {isCreating ? (
            <form
              onSubmit={handleCreateAndAdd}
              className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 space-y-3 mt-3"
            >
              <div className="text-xs font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Collection & Add Ticket #{ticketNum}</span>
              </div>

              <input
                type="text"
                autoFocus
                placeholder="e.g. Tricky Medical Terms, Final Exam Review"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Color:</span>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-4 h-4 rounded-full transition-transform ${
                        selectedColor === c ? 'scale-125 ring-2 ring-offset-1 ring-sky-500' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newGroupName.trim()}
                    className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 text-sky-600 dark:text-sky-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Collection</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
