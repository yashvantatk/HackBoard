'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Flame, 
  Clock, 
  Radio, 
  RotateCcw, 
  HelpCircle, 
  LayoutGrid, 
  Kanban, 
  Calendar as CalendarIcon, 
  Target, 
  FileText,
  Mic,
  CheckCircle2,
  Trophy,
  Share2,
  Download,
  FolderInput,
  Upload,
  Sparkles,
  Check
} from 'lucide-react';
import { Hackathon, HistoryEntry } from '../types/index';
import { formatISTShort, getCountdown } from '../lib/time';

interface HeaderProps {
  hackathons: Hackathon[];
  history: HistoryEntry[];
  currentView: 'cards' | 'kanban' | 'timeline';
  onToggleView: (view: 'cards' | 'kanban' | 'timeline') => void;
  onOpenWhatNow: () => void;
  onOpenRulesReader: () => void;
  onExportCalendar: () => void;
  onShareBoard: () => void;
  onLoadSampleData: () => void;
  onStartFresh?: () => void;
  hasDemoData?: boolean;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onOpenShortcuts: () => void;
  isCopiedShare: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hackathons,
  history,
  currentView,
  onToggleView,
  onOpenWhatNow,
  onOpenRulesReader,
  onExportCalendar,
  onShareBoard,
  onLoadSampleData,
  onStartFresh,
  hasDemoData = false,
  onExportBackup,
  onImportBackup,
  onOpenShortcuts,
  isCopiedShare,
}) => {
  const [currentIstTime, setCurrentIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentIstTime(formatISTShort(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hackathonsTracked = hackathons.length;
  const allTasks = hackathons.flatMap((h) => h.tasks);
  const tasksDoneThisWeek = allTasks.filter((t) => t.status === 'done').length;

  const wordsOfCommandsGiven = history.reduce((acc, entry) => {
    if (!entry.rawInput) return acc;
    const words = entry.rawInput.trim().split(/\s+/).filter(Boolean).length;
    return acc + words;
  }, 0);

  const urgentCount = hackathons.filter((h) => {
    const cd = getCountdown(h.deadline);
    return !cd.isExpired && (cd.urgency === 'critical' || cd.urgency === 'warning');
  }).length;

  return (
    <header className="relative border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
        {/* Top Bar: Brand, Privacy Badge & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Logo & War Room Badge */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-purple-600/30 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-zinc-950 animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
                  HACKBOARD
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    War Room
                  </span>
                </h1>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Voice-First War Room • Wispr Dictation • Local-First Storage
              </p>
            </div>
          </div>

          {/* Privacy Badge & Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Required Badge: "Your board never leaves this browser." */}
            <div 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shadow-sm"
              title="All data is stored exclusively in your local browser storage. Zero server calls."
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="tracking-tight text-[11px] sm:text-xs">Your board never leaves this browser.</span>
            </div>

            {/* View Switcher: Cards vs Board vs Timeline */}
            <div className="inline-flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => onToggleView('cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  currentView === 'cards'
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Cards view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleView('kanban')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  currentView === 'kanban'
                    ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Kanban Board view (Shortcut: K)"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleView('timeline')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  currentView === 'timeline'
                    ? 'bg-indigo-500 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Operations Timeline (Shortcut: T)"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </button>
            </div>

            {/* Focus & Rules Actions */}
            <button
              type="button"
              onClick={onOpenWhatNow}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm transition active:scale-95"
              title="Pick next best task (Shortcut: N)"
            >
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>What Now (N)</span>
            </button>

            <button
              type="button"
              onClick={onOpenRulesReader}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition"
              title="Parse submission rules (Shortcut: R)"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Read Rules (R)</span>
            </button>

            {/* Export to Calendar (.ics) */}
            <button
              type="button"
              onClick={onExportCalendar}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
              title="Export deadlines to .ics with 24h & 2h reminders"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Calendar (.ics)</span>
            </button>

            {/* Share Board Link */}
            <button
              type="button"
              onClick={onShareBoard}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${
                isCopiedShare
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
              }`}
              title="Compress board into zero-server share link"
            >
              {isCopiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Start Fresh (Menu Option when demo data is present) */}
            {hasDemoData && onStartFresh && (
              <button
                type="button"
                onClick={onStartFresh}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 transition"
                title="Remove sample data and start fresh with your own board"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Start fresh</span>
              </button>
            )}

            {/* Load Sample Data */}
            <button
              type="button"
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
              title="Add sample hackathons without wiping your own"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Load sample data</span>
            </button>

            {/* Export & Import Backup */}
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
              title="Export complete board backup as JSON"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden lg:inline">Backup</span>
            </button>

            <button
              type="button"
              onClick={onImportBackup}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
              title="Import and merge backup JSON file"
            >
              <FolderInput className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden lg:inline">Restore</span>
            </button>

            {/* Help (?) */}
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition"
              title="Shortcuts (?)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feature Four Submission Stats Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-zinc-400">
            <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
              Submission Live Metrics:
            </span>

            <div className="flex items-center gap-1 text-zinc-200">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              <strong className="text-white font-bold">{hackathonsTracked}</strong> hackathons tracked
            </div>

            <span className="text-zinc-700">•</span>

            <div className="flex items-center gap-1 text-zinc-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-emerald-400 font-bold">{tasksDoneThisWeek}</strong> tasks done this week
            </div>

            <span className="text-zinc-700">•</span>

            <div className="flex items-center gap-1 text-zinc-200">
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <strong className="text-purple-300 font-bold">{wordsOfCommandsGiven}</strong> words of commands given
            </div>

            {urgentCount > 0 && (
              <>
                <span className="text-zinc-700">•</span>
                <span className="inline-flex items-center gap-1 text-amber-400 font-bold animate-pulse">
                  <Flame className="w-3 h-3" /> {urgentCount} in crunch
                </span>
              </>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 text-zinc-400 text-[11px]">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{currentIstTime}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
