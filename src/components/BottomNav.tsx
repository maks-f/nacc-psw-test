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
      sublabel: 'Linear 1-807',
      icon: BookOpen,
    },
    {
      id: 'quiz' as ActiveTab,
      label: 'Quiz',
      sublabel: 'Custom Range',
      icon: HelpCircle,
    },
    {
      id: 'smart' as ActiveTab,
      label: 'Drill',
      sublabel: 'Spaced Rep',
      icon: Flame,
      badge: weakCount > 0 ? weakCount : null,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'bookmarks' as ActiveTab,
      label: 'Saved',
      sublabel: 'Starred',
      icon: Bookmark,
      badge: bookmarkCount > 0 ? bookmarkCount : null,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Stats',
      sublabel: 'Mastery',
      icon: BarChart3,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0E1420]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 safe-area-pb">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white ${tab.badgeColor} flex items-center justify-center shadow-xs`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-sky-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
