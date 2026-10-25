'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Hackathon, HistoryEntry, ParsedCommand, Task, TaskStatus } from '../types/index';
import { 
  getHackathons, 
  saveHackathons, 
  getHistory, 
  addHistoryEntry, 
  resetToDemo, 
  clearHistory,
  splitActiveAndPastHackathons
} from '../lib/storage';
import { Header } from '../components/Header';
import { CommandBar } from '../components/CommandBar';
import { HackathonGrid } from '../components/HackathonGrid';
import { KanbanBoard } from '../components/KanbanBoard';
import { TimelineView } from '../components/TimelineView';
import { HistoryPanel } from '../components/HistoryPanel';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { WhatNowModal } from '../components/WhatNowModal';
import { RulesReaderModal } from '../components/RulesReaderModal';
import { OverbookedBanner } from '../components/OverbookedBanner';
import { JudgeTourStrip } from '../components/JudgeTourStrip';
import { SharedBoardBanner } from '../components/SharedBoardBanner';
import { PastHackathonsDrawer } from '../components/PastHackathonsDrawer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { downloadCalendarIcs } from '../lib/calendar';
import { copyShareLink, decodeBoardFromHash, clearSharedHash } from '../lib/share';
import { triggerCompletionConfetti, triggerMegaConfetti } from '../lib/confetti';
import { formatIST } from '../lib/time';
import { getOverbookedHackathons, getWhatNowRecommendation } from '../lib/whatnow';
import { CheckCircle2, AlertCircle, Sparkles, X, Heart } from 'lucide-react';

function normalizeTaskForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(?:the|a|an)\b/gi, ' ')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isTaskAlreadyInHackathon(existingTasks: Task[], newTitle: string): boolean {
  const normNew = normalizeTaskForComparison(newTitle);
  if (!normNew) return false;

  return existingTasks.some((t) => {
    const normExisting = normalizeTaskForComparison(t.title);
    if (normExisting === normNew) return true;
    if (normExisting.includes(normNew) || normNew.includes(normExisting)) return true;
    const newTokens = normNew.split(' ').filter((w) => w.length > 2);
    if (newTokens.length > 0 && newTokens.every((w) => normExisting.includes(w))) return true;
    return false;
  });
}

export default function HackboardPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentView, setCurrentView] = useState<'cards' | 'kanban' | 'timeline'>('cards');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isWhatNowOpen, setIsWhatNowOpen] = useState(false);
  const [isRulesReaderOpen, setIsRulesReaderOpen] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  const [isCopiedShare, setIsCopiedShare] = useState(false);
  const [whatNowAvailableHours, setWhatNowAvailableHours] = useState<number | undefined>();
  const [isMounted, setIsMounted] = useState(false);
  const [actionNotification, setActionNotification] = useState<{
    type: 'success' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive?: boolean;
    icon?: 'alert' | 'reset';
    onConfirm: () => void;
  } | null>(null);

  // Snapshot to restore board exactly when guided tour ends or is skipped
  const tourSnapshotRef = React.useRef<Hackathon[] | null>(null);

  const handleStartTour = () => {
    tourSnapshotRef.current = JSON.parse(JSON.stringify(getHackathons()));
  };

  const handleEndTour = () => {
    if (tourSnapshotRef.current) {
      saveHackathons(tourSnapshotRef.current);
      tourSnapshotRef.current = null;
    }
  };

  // Sync state from storage or URL hash
  const reloadFromStorage = useCallback(() => {
    // Check if URL hash has shared board
    const sharedData = decodeBoardFromHash();
    if (sharedData && sharedData.length > 0) {
      setHackathons(sharedData);
      setIsSharedView(true);
      setHistory(getHistory());
      return;
    }

    setIsSharedView(false);
    setHackathons(getHackathons());
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    setIsMounted(true);
    reloadFromStorage();

    const handleStorageUpdate = () => {
      reloadFromStorage();
    };

    window.addEventListener('hackboard-storage-changed', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('hashchange', handleStorageUpdate);

    return () => {
      window.removeEventListener('hackboard-storage-changed', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('hashchange', handleStorageUpdate);
    };
  }, [reloadFromStorage]);

  // Split Active vs Past Hackathons (Feature Four: Time passing)
  const { active: activeHackathons, past: pastHackathons } = useMemo(() => {
    return splitActiveAndPastHackathons(hackathons);
  }, [hackathons]);

  // Global keyboard shortcuts: K (toggle view), T (timeline), N (What now), R (Rules reader), ? (Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentView((prev) => (prev === 'cards' ? 'kanban' : 'cards'));
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setCurrentView('timeline');
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setWhatNowAvailableHours(undefined);
        setIsWhatNowOpen(true);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsRulesReaderOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute overbooked alerts on ACTIVE hackathons only
  const overbookedAlerts = useMemo(() => {
    return getOverbookedHackathons(activeHackathons);
  }, [activeHackathons]);

  // Compute What Now recommendation on ACTIVE hackathons only
  const whatNowRecommendation = useMemo(() => {
    return getWhatNowRecommendation(activeHackathons, whatNowAvailableHours);
  }, [activeHackathons, whatNowAvailableHours]);

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setActionNotification({ message, type });
    setTimeout(() => {
      setActionNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Calendar Export
  const handleExportCalendar = () => {
    downloadCalendarIcs(activeHackathons);
    addHistoryEntry(
      'Export to calendar',
      `Exported ${activeHackathons.length} hackathon deadlines to .ics with 24h & 2h alerts.`,
      'export_calendar'
    );
    showNotification('Downloaded iCalendar file (.ics) with 24h & 2h reminders!', 'success');
  };

  // Share Board
  const handleShareBoard = async () => {
    await copyShareLink(hackathons);
    setIsCopiedShare(true);
    setTimeout(() => setIsCopiedShare(false), 2500);
    showNotification('Zero-server share link copied to clipboard!', 'info');
  };

  // Import Shared Board to Local Storage
  const handleImportSharedBoard = () => {
    saveHackathons(hackathons);
    clearSharedHash();
    setIsSharedView(false);
    triggerCompletionConfetti();
    showNotification('Imported shared board into your local browser war room!', 'success');
  };

  // Exit Shared View
  const handleExitSharedView = () => {
    clearSharedHash();
    reloadFromStorage();
  };

  // Execute Parsed Command
  const handleExecuteCommand = (parsed: ParsedCommand, rawInput: string) => {
    const currentHackathons = getHackathons();

    switch (parsed.type) {
      case 'view_timeline': {
        setCurrentView('timeline');
        addHistoryEntry(rawInput, 'Switched to Operations Timeline view (Gantt chart).', 'view_timeline');
        showNotification('Switched to Operations Timeline view.', 'info');
        break;
      }

      case 'export_calendar': {
        handleExportCalendar();
        break;
      }

      case 'create_hackathon': {
        const name = parsed.targetHackathonName || 'New Hackathon';
        const deadline = parsed.deadlineIso || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        
        const tasks: Task[] = (parsed.tasksToCreate || []).map((t, idx) => ({
          id: `t-${Date.now()}-${idx}`,
          title: t.title,
          status: 'todo',
          estimateHours: t.estimateHours || 1,
          createdAt: new Date().toISOString(),
        }));

        const newHackathon: Hackathon = {
          id: `hack-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name,
          deadline,
          tasks,
          createdAt: new Date().toISOString(),
          accentColor: '#06b6d4',
        };

        const updated = [...currentHackathons, newHackathon];
        saveHackathons(updated);

        const summary = `Created "${name}" closing ${formatIST(deadline)} with ${tasks.length} task${tasks.length === 1 ? '' : 's'}.`;
        addHistoryEntry(rawInput, summary, 'create_hackathon', {
          hackathonName: name,
          deadline,
          tasksAdded: parsed.tasksToCreate?.map((t) => t.title),
        });

        triggerCompletionConfetti();
        showNotification(summary, 'success');
        break;
      }

      case 'update_hackathon': {
        const targetId = parsed.matchedHackathonId;
        const targetName = parsed.targetHackathonName;

        let found = false;
        const skippedTitles: string[] = [];
        let addedCount = 0;

        const updated = currentHackathons.map((h) => {
          if (h.id === targetId || (targetName && h.name.toLowerCase() === targetName.toLowerCase())) {
            found = true;
            const updatedDeadline = parsed.deadlineIso || h.deadline;
            const newTasksToAppend: Task[] = [];

            for (const t of (parsed.tasksToCreate || [])) {
              if (isTaskAlreadyInHackathon(h.tasks, t.title)) {
                skippedTitles.push(t.title);
              } else {
                newTasksToAppend.push({
                  id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  title: t.title,
                  status: 'todo',
                  estimateHours: t.estimateHours || 1,
                  createdAt: new Date().toISOString(),
                });
              }
            }

            addedCount = newTasksToAppend.length;

            return {
              ...h,
              deadline: updatedDeadline,
              tasks: [...h.tasks, ...newTasksToAppend],
            };
          }
          return h;
        });

        if (found) {
          saveHackathons(updated);
          let summary = '';
          if (addedCount > 0) {
            summary = `Added ${addedCount} new task${addedCount > 1 ? 's' : ''} to "${targetName}"${skippedTitles.length > 0 ? ` (${skippedTitles.join(', ')} already existed)` : ''}.`;
          } else if (skippedTitles.length > 0) {
            summary = `Task(s) (${skippedTitles.join(', ')}) were already on "${targetName}".`;
          } else {
            summary = parsed.summary;
          }

          addHistoryEntry(rawInput, summary, 'update_hackathon', {
            hackathonName: targetName,
            deadline: parsed.deadlineIso,
            tasksAdded: parsed.tasksToCreate?.map((t) => t.title),
          });
          triggerCompletionConfetti();
          showNotification(summary, 'success');
        } else {
          const newHack: Hackathon = {
            id: `hack-${Date.now()}`,
            name: targetName || 'Hackathon',
            deadline: parsed.deadlineIso || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            tasks: (parsed.tasksToCreate || []).map((t, idx) => ({
              id: `t-${Date.now()}-${idx}`,
              title: t.title,
              status: 'todo',
              estimateHours: t.estimateHours || 1,
              createdAt: new Date().toISOString(),
            })),
            createdAt: new Date().toISOString(),
          };
          saveHackathons([...currentHackathons, newHack]);
          addHistoryEntry(rawInput, `Created "${newHack.name}"`, 'create_hackathon');
          showNotification(`Created "${newHack.name}"`, 'success');
        }
        break;
      }

      case 'estimate_task': {
        if (!parsed.taskTarget || typeof parsed.taskTarget.estimateHours !== 'number') {
          showNotification('Could not determine task estimate.', 'warning');
          return;
        }

        const { taskId, hackathonId, taskName, estimateHours, hackathonName } = parsed.taskTarget;
        let matched = false;

        const updated = currentHackathons.map((h) => {
          if (hackathonId && h.id !== hackathonId) return h;

          const updatedTasks = h.tasks.map((t) => {
            if (t.id === taskId || t.title.toLowerCase().includes(taskName.toLowerCase())) {
              matched = true;
              return { ...t, estimateHours };
            }
            return t;
          });

          return { ...h, tasks: updatedTasks };
        });

        if (matched) {
          saveHackathons(updated);
          const summary = `Set estimate for "${taskName}" to ${estimateHours} hour${estimateHours === 1 ? '' : 's'}.`;
          addHistoryEntry(rawInput, summary, 'estimate_task', {
            taskChanged: {
              taskTitle: taskName,
              hackathonName: hackathonName || 'Hackathon',
              estimateHours,
            },
          });
          showNotification(summary, 'success');
        } else {
          showNotification(`Task "${taskName}" not found.`, 'warning');
        }
        break;
      }

      case 'change_task': {
        if (!parsed.taskTarget) {
          showNotification('Could not pinpoint the task to update.', 'warning');
          return;
        }

        const { taskId, hackathonId, targetStatus = 'done', taskName, hackathonName } = parsed.taskTarget;
        let matched = false;

        const updated = currentHackathons.map((h) => {
          if (hackathonId && h.id !== hackathonId) return h;

          const updatedTasks = h.tasks.map((t) => {
            if (t.id === taskId || t.title.toLowerCase().includes(taskName.toLowerCase())) {
              matched = true;
              return { ...t, status: targetStatus };
            }
            return t;
          });

          return { ...h, tasks: updatedTasks };
        });

        if (matched) {
          saveHackathons(updated);
          const summary = parsed.summary;
          addHistoryEntry(rawInput, summary, 'change_task', {
            taskChanged: {
              taskTitle: taskName,
              hackathonName: hackathonName || 'Hackathon',
              newStatus: targetStatus,
            },
          });

          if (targetStatus === 'done') {
            triggerCompletionConfetti();
          }
          showNotification(summary, 'success');
        } else {
          showNotification(`Task "${taskName}" not found in active boards.`, 'warning');
        }
        break;
      }

      case 'question': {
        const answer = parsed.questionAnswer || parsed.summary;
        addHistoryEntry(rawInput, answer, 'question');
        showNotification(answer, 'info');

        setWhatNowAvailableHours(parsed.availableHours);
        setIsWhatNowOpen(true);
        break;
      }

      default: {
        addHistoryEntry(
          rawInput,
          `Could not recognize action for: "${rawInput}".`,
          'unknown'
        );
        showNotification(parsed.summary, 'warning');
        break;
      }
    }
  };

  const handleUpdateTasks = (hackathonId: string, updatedTasks: Task[]) => {
    const current = getHackathons();
    const targetHackathon = current.find((h) => h.id === hackathonId);
    
    if (targetHackathon) {
      const prevDoneCount = targetHackathon.tasks.filter((t) => t.status === 'done').length;
      const newDoneCount = updatedTasks.filter((t) => t.status === 'done').length;
      if (newDoneCount > prevDoneCount) {
        if (newDoneCount === updatedTasks.length && updatedTasks.length > 0) {
          triggerMegaConfetti();
        } else {
          triggerCompletionConfetti();
        }
      }
    }

    const updated = current.map((h) => {
      if (h.id === hackathonId) {
        return { ...h, tasks: updatedTasks };
      }
      return h;
    });

    saveHackathons(updated);
  };

  const handleUpdateSingleTaskStatus = (hackathonId: string, taskId: string, status: TaskStatus) => {
    const current = getHackathons();
    const updated = current.map((h) => {
      if (h.id === hackathonId) {
        const tasks = h.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
        return { ...h, tasks };
      }
      return h;
    });

    saveHackathons(updated);
    addHistoryEntry(
      `Status update: ${status}`,
      `Task in hackathon marked as ${status}`,
      'change_task'
    );
  };

  const handleAddHackathonFromRules = (newHackathon: Hackathon) => {
    const current = getHackathons();
    saveHackathons([...current, newHackathon]);
    addHistoryEntry(
      `Imported from Rules: ${newHackathon.name}`,
      `Created "${newHackathon.name}" with ${newHackathon.tasks.length} tasks from rules reader`,
      'create_hackathon'
    );
    showNotification(`Imported "${newHackathon.name}" with ${newHackathon.tasks.length} tasks.`, 'success');
  };

  const handleDeleteHackathon = (hackathonId: string) => {
    const current = getHackathons();
    const removed = current.find((h) => h.id === hackathonId);
    const updated = current.filter((h) => h.id !== hackathonId);
    saveHackathons(updated);

    if (removed) {
      addHistoryEntry(
        `Remove ${removed.name}`,
        `Deleted hackathon "${removed.name}" from war room.`,
        'update_hackathon'
      );
      showNotification(`Removed "${removed.name}" from your board.`, 'info');
    }
  };

  const handleResetDemo = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Reset Demo Board?',
      message: 'This will restore the default demo hackathons (Meta Global AI, Nebius NVIDIA, Wispr Challenge) and reset task progress.',
      confirmLabel: 'Reset Demo',
      isDestructive: true,
      icon: 'reset',
      onConfirm: () => {
        resetToDemo();
        triggerCompletionConfetti();
        showNotification('Preloaded demo board: Meta, Nebius NVIDIA, Wispr Challenge.', 'success');
        setConfirmModalConfig(null);
      },
    });
  };

  const handleClearHistory = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Clear Command History?',
      message: 'This will clear all dictation and command history logs from this browser.',
      confirmLabel: 'Clear History',
      isDestructive: true,
      icon: 'alert',
      onConfirm: () => {
        clearHistory();
        showNotification('History log cleared.', 'info');
        setConfirmModalConfig(null);
      },
    });
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>INITIALIZING HACKBOARD WAR ROOM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient Cockpit Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <Header
        hackathons={activeHackathons}
        history={history}
        currentView={currentView}
        onToggleView={setCurrentView}
        onOpenWhatNow={() => {
          setWhatNowAvailableHours(undefined);
          setIsWhatNowOpen(true);
        }}
        onOpenRulesReader={() => setIsRulesReaderOpen(true)}
        onExportCalendar={handleExportCalendar}
        onShareBoard={handleShareBoard}
        onResetDemo={handleResetDemo}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isCopiedShare={isCopiedShare}
      />

      {/* Action Notification Toast Banner */}
      {actionNotification && (
        <div className="sticky top-[105px] z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-xl text-xs sm:text-sm font-medium ${
            actionNotification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/40'
              : actionNotification.type === 'info'
              ? 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200 shadow-cyan-950/40'
              : 'bg-amber-950/90 border-amber-500/40 text-amber-200 shadow-amber-950/40'
          }`}>
            <div className="flex items-center gap-2.5">
              {actionNotification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {actionNotification.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />}
              {actionNotification.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              <span>{actionNotification.message}</span>
            </div>

            <button
              onClick={() => setActionNotification(null)}
              className="p-1 hover:opacity-75 transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main War Room Body */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Read-Only Shared Board Banner (if URL hash present) */}
        {isSharedView && (
          <SharedBoardBanner
            onImportToLocal={handleImportSharedBoard}
            onExitSharedView={handleExitSharedView}
          />
        )}

        {/* Feature Five: Judge 60-Second Guided Tour Strip */}
        <JudgeTourStrip
          onStartTour={handleStartTour}
          onEndTour={handleEndTour}
          onRunStep1Command={(sampleText) => {
            const parsed = {
              type: 'update_hackathon' as const,
              confidence: 'high' as const,
              rawText: sampleText,
              summary: 'Created "Nebius NVIDIA Hackathon" closing Oct 30 at 11:59 PM IST with 3 tasks.',
              targetHackathonName: 'Nebius NVIDIA Hackathon',
              deadlineIso: new Date('2026-10-30T23:59:59+05:30').toISOString(),
              tasksToCreate: [
                { title: 'Demo video', estimateHours: 2 },
                { title: 'Devpost readme', estimateHours: 1 },
                { title: 'Deploy frontend', estimateHours: 1 },
              ],
            };
            handleExecuteCommand(parsed, sampleText);
          }}
          onOpenStep2WhatNow={() => {
            setIsRulesReaderOpen(false);
            setWhatNowAvailableHours(undefined);
            setIsWhatNowOpen(true);
          }}
          onOpenStep3RulesReader={() => {
            setIsWhatNowOpen(false);
            setIsRulesReaderOpen(true);
          }}
          onSwitchStep4Timeline={() => {
            setIsWhatNowOpen(false);
            setIsRulesReaderOpen(false);
            setCurrentView('timeline');
          }}
        />

        {/* Overbooked Warning Banner */}
        <OverbookedBanner
          alerts={overbookedAlerts}
          onOpenWhatNow={() => {
            setWhatNowAvailableHours(undefined);
            setIsWhatNowOpen(true);
          }}
        />

        {/* Command Bar */}
        <section>
          <CommandBar
            hackathons={activeHackathons}
            onExecuteCommand={handleExecuteCommand}
          />
        </section>

        {/* Board Operations Area: Cards / Board / Timeline (8 cols) + History (4 cols) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-8 space-y-6">
            {currentView === 'cards' && (
              <HackathonGrid
                hackathons={activeHackathons}
                onUpdateTasks={handleUpdateTasks}
                onDeleteHackathon={handleDeleteHackathon}
                onResetDemo={handleResetDemo}
              />
            )}

            {currentView === 'kanban' && (
              <KanbanBoard
                hackathons={activeHackathons}
                onUpdateTasks={handleUpdateTasks}
              />
            )}

            {currentView === 'timeline' && (
              <TimelineView
                key={`timeline-${activeHackathons.length}`}
                hackathons={activeHackathons}
              />
            )}

            {/* Feature Four: Collapsed Past Hackathons Drawer at the bottom */}
            <PastHackathonsDrawer pastHackathons={pastHackathons} />
          </div>

          {/* Action History Feed */}
          <div className="lg:col-span-4 xl:col-span-4 sticky top-28">
            <HistoryPanel
              history={history}
              onClearHistory={handleClearHistory}
            />
          </div>
        </section>
      </main>

      {/* Polish: Footer with GitHub link & Zero-Backend Info */}
      <footer className="relative z-10 border-t border-zinc-800/80 bg-zinc-950 py-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Hackboard War Room</span>
            <span>•</span>
            <span className="text-zinc-400">100% Local • Zero API Keys • Next.js Static Export</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/yashv/Hackboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-cyan-300 transition"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>GitHub Repository</span>
            </a>
            <span>•</span>
            <span className="flex items-center gap-1 text-zinc-400">
              Built with <Heart className="w-3 h-3 text-rose-500 fill-current" /> for multi-hackathon sprinters
            </span>
          </div>
        </div>
      </footer>

      {/* What Now Focus Modal with Pomodoro Timer */}
      <WhatNowModal
        isOpen={isWhatNowOpen}
        onClose={() => setIsWhatNowOpen(false)}
        recommendation={whatNowRecommendation}
        onUpdateTaskStatus={handleUpdateSingleTaskStatus}
      />

      {/* Rules Reader Modal */}
      <RulesReaderModal
        isOpen={isRulesReaderOpen}
        onClose={() => setIsRulesReaderOpen(false)}
        onAddHackathon={handleAddHackathonFromRules}
      />

      {/* Keyboard Shortcuts Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* In-App Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmModalConfig?.isOpen)}
        title={confirmModalConfig?.title || 'Confirm Action'}
        message={confirmModalConfig?.message || 'Are you sure you want to proceed?'}
        confirmLabel={confirmModalConfig?.confirmLabel || 'Confirm'}
        isDestructive={confirmModalConfig?.isDestructive}
        icon={confirmModalConfig?.icon}
        onConfirm={() => confirmModalConfig?.onConfirm()}
        onCancel={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}
