import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Check,
  Clock,
  AlertCircle,
  Calendar,
  Target,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { DailyReminderSettings } from '../types';
import {
  getDailyReminderSettings,
  saveDailyReminderSettings,
} from '../utils/storage';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Mo' },
  { key: 'tue', label: 'Tu' },
  { key: 'wed', label: 'We' },
  { key: 'thu', label: 'Th' },
  { key: 'fri', label: 'Fr' },
  { key: 'sat', label: 'Sa' },
  { key: 'sun', label: 'Su' },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<DailyReminderSettings>(() =>
    getDailyReminderSettings()
  );
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support Web Notifications.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      const updated = { ...settings, enabled: true };
      setSettings(updated);
      saveDailyReminderSettings(updated);
      setStatusMsg('Notifications enabled!');
    } else {
      setStatusMsg('Permission denied by browser.');
    }
  };

  const handleToggleEnabled = async (checked: boolean) => {
    if (checked && permission !== 'granted') {
      await handleRequestPermission();
      return;
    }
    const updated = { ...settings, enabled: checked };
    setSettings(updated);
    saveDailyReminderSettings(updated);
  };

  const handleTimePreset = (time: string) => {
    const updated = { ...settings, time };
    setSettings(updated);
    saveDailyReminderSettings(updated);
  };

  const handleDayToggle = (day: DayKey) => {
    let newDays = [...settings.days];
    if (newDays.includes(day)) {
      if (newDays.length > 1) {
        newDays = newDays.filter((d) => d !== day);
      }
    } else {
      newDays.push(day);
    }
    const updated = { ...settings, days: newDays };
    setSettings(updated);
    saveDailyReminderSettings(updated);
  };

  const handleSelectAllDays = (weekdaysOnly = false) => {
    const newDays: DayKey[] = weekdaysOnly
      ? ['mon', 'tue', 'wed', 'thu', 'fri']
      : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const updated = { ...settings, days: newDays };
    setSettings(updated);
    saveDailyReminderSettings(updated);
  };

  const handleGoalChange = (goalType: 'tickets' | 'mistakes' | 'quiz' | 'custom') => {
    const updated = { ...settings, goalType };
    setSettings(updated);
    saveDailyReminderSettings(updated);
  };

  const handleSendTestNotification = () => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      alert('Please enable notification permissions first.');
      return;
    }

    let goalText = 'Review 20 tickets to keep your streak alive!';
    if (settings.goalType === 'mistakes') {
      goalText = 'Drill your past mistakes to reinforce memory.';
    } else if (settings.goalType === 'quiz') {
      goalText = 'Take a quick 20-question practice test today!';
    } else if (settings.goalType === 'custom' && settings.customMessage) {
      goalText = settings.customMessage;
    }

    try {
      new Notification('📚 NACC Exam Prep Study Time', {
        body: goalText,
        icon: '/apple-touch-icon.png',
        badge: '/icon.svg',
      });
      setStatusMsg('Test push notification delivered!');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (e) {
      console.error(e);
      setStatusMsg('Failed to trigger notification.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Customizable Study Reminders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize notification schedule, frequency, and daily study goals
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

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {statusMsg && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 font-medium text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{statusMsg}</span>
            </div>
          )}

          {permission !== 'granted' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Browser permission required:</span>
                Tap below to grant push notification permissions on your device.
              </div>
            </div>
          )}

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-xs">
                Enable Daily Study Alerts
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Receive scheduled push notifications
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              className="w-5 h-5 text-sky-500 rounded border-slate-300 cursor-pointer"
            />
          </div>

          {/* Schedule Days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Repeat on Days</span>
              </label>
              <div className="flex gap-2 text-[10px] text-sky-600 dark:text-sky-400">
                <button
                  type="button"
                  onClick={() => handleSelectAllDays(false)}
                  className="hover:underline"
                >
                  All Days
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllDays(true)}
                  className="hover:underline"
                >
                  Weekdays
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map(({ key, label }) => {
                const isSelected = settings.days.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDayToggle(key)}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker and Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Reminder Time</span>
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={settings.time}
                onChange={(e) => handleTimePreset(e.target.value)}
                className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
              />
              <div className="flex flex-wrap gap-1 flex-1">
                {[
                  { label: 'Morning', time: '08:30' },
                  { label: 'Lunch', time: '13:00' },
                  { label: 'Evening', time: '19:30' },
                  { label: 'Night', time: '21:30' },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleTimePreset(p.time)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
                      settings.time === p.time
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {p.label} ({p.time})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Study Goal Target */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Notification Motivation Goal</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'tickets' as const,
                  title: '20 Tickets Review',
                  desc: 'Steady sequential progress',
                },
                {
                  id: 'mistakes' as const,
                  title: 'Error Drill Focus',
                  desc: 'Reinforce weak spots',
                },
                {
                  id: 'quiz' as const,
                  title: 'Practice Test',
                  desc: 'Mock exam condition',
                },
                {
                  id: 'custom' as const,
                  title: 'Custom Note',
                  desc: 'Your own motivation',
                },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleGoalChange(g.id)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    settings.goalType === g.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {g.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {g.desc}
                  </div>
                </button>
              ))}
            </div>

            {settings.goalType === 'custom' && (
              <input
                type="text"
                value={settings.customMessage || ''}
                onChange={(e) => {
                  const updated = { ...settings, customMessage: e.target.value };
                  setSettings(updated);
                  saveDailyReminderSettings(updated);
                }}
                placeholder="e.g. Remember: 15 minutes of tickets = guaranteed pass!"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white"
              />
            )}
          </div>

          {/* Sound & Test */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <span>Chime / Vibration alert</span>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => {
                  const updated = { ...settings, soundEnabled: e.target.checked };
                  setSettings(updated);
                  saveDailyReminderSettings(updated);
                }}
                className="w-4 h-4 text-sky-500 rounded border-slate-300 ml-1"
              />
            </label>

            <button
              type="button"
              onClick={handleSendTestNotification}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Test Push</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
