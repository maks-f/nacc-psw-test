import React, { useState } from 'react';
import {
  Bookmark,
  Play,
  Trash2,
  ArrowRight,
  BookOpen,
  FolderPlus,
  Plus,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { CustomGroup, Question, QuestionProgress, QuizConfig } from '../types';

interface BookmarksViewProps {
  questions: Question[];
  progressMap: Record<number, QuestionProgress>;
  customGroups: CustomGroup[];
  onToggleBookmark: (questionId: number) => void;
  onJumpToTicket: (ticketNum: number) => void;
  onStartQuiz: (config: QuizConfig) => void;
  onDeleteGroup: (groupId: string) => void;
  onCreateGroup: (name: string, color: string) => CustomGroup;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  questions,
  progressMap,
  customGroups,
  onToggleBookmark,
  onJumpToTicket,
  onStartQuiz,
  onDeleteGroup,
  onCreateGroup,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bookmarks' | 'collections'>('bookmarks');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const bookmarkedQuestions = questions.filter((q) => progressMap[q.id]?.bookmarked);

  const handleStartBookmarkedQuiz = () => {
    if (bookmarkedQuestions.length === 0) return;
    onStartQuiz({
      mode: 'bookmarked',
      startTicket: 1,
      endTicket: 807,
      questionCount: Math.min(50, bookmarkedQuestions.length),
      shuffle: true,
      instantFeedback: true,
      showExplanations: true,
    });
  };

  const handleStartGroupQuiz = (group: CustomGroup) => {
    if (group.questionIds.length === 0) {
      alert('This collection has no questions yet. Add questions to this collection from the Study screen.');
      return;
    }
    onStartQuiz({
      mode: 'group',
      groupId: group.id,
      startTicket: 1,
      endTicket: 807,
      questionCount: Math.min(50, group.questionIds.length),
      shuffle: true,
      instantFeedback: true,
      showExplanations: true,
    });
  };

  const handleCreateNewGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), '#0284c7');
    setNewGroupName('');
    setIsCreatingGroup(false);
  };

  const selectedGroup = customGroups.find((g) => g.id === selectedGroupId);
  const selectedGroupQuestions = selectedGroup
    ? questions.filter((q) => selectedGroup.questionIds.includes(q.id))
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Sub-tab switcher */}
      <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800/80 p-1 text-xs font-semibold">
        <button
          onClick={() => {
            setActiveSubTab('bookmarks');
            setSelectedGroupId(null);
          }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'bookmarks'
              ? 'bg-white dark:bg-[#121927] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-current" />
          <span>Starred Tickets ({bookmarkedQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('collections')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'collections'
              ? 'bg-white dark:bg-[#121927] text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderPlus className="w-3.5 h-3.5 text-sky-500" />
          <span>Custom Collections ({customGroups.length})</span>
        </button>
      </div>

      {/* VIEW 1: Starred Bookmarks */}
      {activeSubTab === 'bookmarks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-500 fill-current" />
                <span>Starred Review Tickets</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bookmarkedQuestions.length} questions saved for targeted review
              </p>
            </div>

            {bookmarkedQuestions.length > 0 && (
              <button
                onClick={handleStartBookmarkedQuiz}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Quiz Starred ({bookmarkedQuestions.length})</span>
              </button>
            )}
          </div>

          {bookmarkedQuestions.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
              <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Starred Tickets Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                While studying tickets, tap the bookmark icon (or press 'B') to save difficult
                questions here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bookmarkedQuestions.map((q) => {
                const p = progressMap[q.id];
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-mono text-[11px]">
                          #{q.num}
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {q.category}
                        </span>
                      </span>

                      <button
                        onClick={() => onToggleBookmark(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                      {q.questionEn}
                    </p>

                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 p-2 rounded-lg">
                      ✓ Correct Answer: {q.correctOptionId}.{' '}
                      {q.options.find((o) => o.id === q.correctOptionId)?.textEn}
                    </div>

                    {p?.notes && (
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded-lg">
                        📝 Note: {p.notes}
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        onClick={() => onJumpToTicket(q.num)}
                        className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Study Ticket #{q.num}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Custom Collections */}
      {activeSubTab === 'collections' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-sky-500" />
                <span>Custom Question Collections</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Curate custom topic sets and drill specific ticket groups
              </p>
            </div>

            <button
              onClick={() => setIsCreatingGroup((p) => !p)}
              className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Collection</span>
            </button>
          </div>

          {/* Inline Collection Creator */}
          {isCreatingGroup && (
            <form
              onSubmit={handleCreateNewGroup}
              className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-850 bg-sky-50/50 dark:bg-sky-950/20 space-y-2.5"
            >
              <div className="text-xs font-bold text-sky-900 dark:text-sky-300">
                Create New Collection
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Collection name (e.g. Critical Safety & Transfers)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="px-4 py-2 rounded-lg bg-sky-500 text-white font-bold text-xs disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {/* If inspecting a specific collection */}
          {selectedGroup ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: selectedGroup.color }}
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedGroup.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedGroupQuestions.length} tickets in this collection
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedGroupQuestions.length > 0 && (
                    <button
                      onClick={() => handleStartGroupQuiz(selectedGroup)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Quiz Set</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedGroupId(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1.5"
                  >
                    Back to All
                  </button>
                </div>
              </div>

              {/* Questions in this group */}
              {selectedGroupQuestions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No tickets assigned to this collection yet. Open any ticket in the Study view and
                  tap <strong>+ Collection</strong> to assign it here!
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedGroupQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Ticket #{q.num}:
                        </span>{' '}
                        <span className="text-slate-600 dark:text-slate-300">
                          {q.questionEn}
                        </span>
                      </div>
                      <button
                        onClick={() => onJumpToTicket(q.num)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shrink-0 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                      >
                        Study
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Collection Cards List */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customGroups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {group.name}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete collection "${group.name}"? Questions will remain in the main question bank.`
                            )
                          ) {
                            onDeleteGroup(group.id);
                          }
                        }}
                        className="text-slate-300 hover:text-rose-500 p-1"
                        title="Delete collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {group.questionIds.length} tickets curated
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setSelectedGroupId(group.id)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
                    >
                      <span>View Tickets</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    {group.questionIds.length > 0 && (
                      <button
                        onClick={() => handleStartGroupQuiz(group)}
                        className="py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Quiz</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
