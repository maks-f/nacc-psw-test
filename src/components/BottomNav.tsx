import React from 'react';
import { BookOpen, HelpCircle, Flame, Bookmark, BarChart3 } from 'lucide-react';

export type ActiveTab = 'study' | 'quiz' | 'smart' | 'bookmarks' | 'analytics';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  bookmarkCount: number;
  weakCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  bookmarkCount,
  weakCount,
}) => {
  const tabs = [
    {
      id: 'study' as ActiveTab,
      label: 'Study',
      icon: BookOpen,
    },
    {
      id: 'quiz' as ActiveTab,
      label: 'Quiz',
      icon: HelpCircle,
    },
    {
      id: 'smart' as ActiveTab,
      label: 'Drill',
      icon: Flame,
      badge: weakCount > 0 ? weakCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'bookmarks' as ActiveTab,
      label: 'Saved',
      icon: Bookmark,
      badge: bookmarkCount > 0 ? bookmarkCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Stats',
      icon: BarChart3,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 safe-area-pb transition-colors">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 active:scale-95 transition-all cursor-pointer ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <div
                  className={`px-3 py-1 rounded-full transition-all flex items-center justify-center ${
                    isActive
                      ? 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-105 stroke-[2.25]' : 'scale-100 stroke-[1.75]'
                    }`}
                  />
                </div>
                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold ${tab.badgeColor} flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#0B111E]`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
