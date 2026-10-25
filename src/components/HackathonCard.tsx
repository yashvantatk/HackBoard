'use client';

import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Check, 
  Play, 
  Calendar,
  Layers
} from 'lucide-react';
import { Hackathon, Task, TaskStatus } from '../types/index';
import { formatIST, getCountdown, Countdown } from '../lib/time';

interface HackathonCardProps {
  hackathon: Hackathon;
  onUpdateTasks: (hackathonId: string, updatedTasks: Task[]) => void;
  onDeleteHackathon: (hackathonId: string) => void;
}

export const HackathonCard: React.FC<HackathonCardProps> = ({
  hackathon,
  onUpdateTasks,
  onDeleteHackathon,
}) => {
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(hackathon.deadline));
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Ticking countdown every second
  useEffect(() => {
    const update = () => {
      setCountdown(getCountdown(hackathon.deadline));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [hackathon.deadline]);

  // Task stats
  const totalTasks = hackathon.tasks.length;
  const doneTasks = hackathon.tasks.filter((t) => t.status === 'done').length;
  const progressRatio = totalTasks > 0 ? doneTasks / totalTasks : 0;
  const progressPercent = Math.round(progressRatio * 100);

  // SVG Progress Ring calculations
  const radius = 26;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Urgency styling definition
  // Green (> 48h), Amber (<= 48h), Red (<= 12h)
  const getUrgencyConfig = () => {
    if (countdown.isExpired) {
      return {
        border: 'border-zinc-800 bg-zinc-950/70',
        badge: 'bg-zinc-900 text-zinc-400 border-zinc-800',
        badgeText: 'DEADLINE PASSED',
        accentText: 'text-zinc-500',
        ringStroke: '#52525b',
        boxGlow: '',
      };
    }

    switch (countdown.urgency) {
      case 'critical': // <= 12 hours
        return {
          border: 'border-rose-500/60 bg-gradient-to-b from-rose-950/20 to-zinc-950/80 shadow-[0_0_30px_rgba(244,63,94,0.18)]',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse',
          badgeText: 'CRITICAL CRUNCH (<12h)',
          accentText: 'text-rose-400',
          ringStroke: '#f43f5e',
          boxGlow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
        };
      case 'warning': // <= 48 hours
        return {
          border: 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-zinc-950/80 shadow-[0_0_25px_rgba(245,158,11,0.15)]',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
          badgeText: 'WAR ROOM CRUNCH (<48h)',
          accentText: 'text-amber-400',
          ringStroke: '#f59e0b',
          boxGlow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        };
      case 'normal': // > 48 hours
      default:
        return {
          border: 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/15 to-zinc-950/80 shadow-[0_0_20px_rgba(16,185,129,0.12)]',
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          badgeText: 'ON TRACK (>48h)',
          accentText: 'text-emerald-400',
          ringStroke: '#10b981',
          boxGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
        };
    }
  };

  const urgencyStyles = getUrgencyConfig();

  // Task actions
  const toggleTaskStatus = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = hackathon.tasks.map((t) => {
      if (t.id === taskId) {
        // Toggle between todo and done
        const nextStatus: TaskStatus = t.status === 'done' ? 'todo' : 'done';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    onUpdateTasks(hackathon.id, updated);
  };

  const cycleTaskStatus = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = hackathon.tasks.map((t) => {
      if (t.id === taskId) {
        const nextMap: Record<TaskStatus, TaskStatus> = {
          todo: 'doing',
          doing: 'done',
          done: 'todo',
        };
        return { ...t, status: nextMap[t.status] };
      }
      return t;
    });
    onUpdateTasks(hackathon.id, updated);
  };

  const deleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = hackathon.tasks.filter((t) => t.id !== taskId);
    onUpdateTasks(hackathon.id, updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      status: 'todo',
      createdAt: new Date().toISOString(),
    };

    onUpdateTasks(hackathon.id, [...hackathon.tasks, newTask]);
    setNewTaskTitle('');
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden backdrop-blur-md ${urgencyStyles.border}`}
    >
      {/* Card Header & Countdown Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 cursor-pointer select-none space-y-4 hover:bg-white/[0.02] transition"
      >
        {/* Title, Badge & Progress Ring */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${urgencyStyles.badge}`}>
                {urgencyStyles.badgeText}
              </span>

              {hackathon.url && (
                <a
                  href={hackathon.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-cyan-300 transition"
                  title="Open hackathon site"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Link</span>
                </a>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {hackathon.name}
            </h3>

            <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Closes {formatIST(hackathon.deadline)}</span>
            </p>
          </div>

          {/* Progress Ring */}
          <div className="relative shrink-0 flex items-center justify-center w-14 h-14">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="-rotate-90 transform"
            >
              <circle
                stroke="#27272a"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={progressPercent === 100 ? '#10b981' : urgencyStyles.ringStroke}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-mono font-bold text-white leading-none">
                {doneTasks}/{totalTasks}
              </span>
              <span className="text-[9px] font-mono text-zinc-400 leading-none mt-0.5">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Live Ticking Countdown Box */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 text-center">
            <div className="text-lg sm:text-2xl font-mono font-black text-white tracking-tight">
              {String(countdown.days).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
              Days
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 text-center">
            <div className="text-lg sm:text-2xl font-mono font-black text-white tracking-tight">
              {String(countdown.hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
              Hours
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 text-center">
            <div className="text-lg sm:text-2xl font-mono font-black text-white tracking-tight">
              {String(countdown.minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
              Mins
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 text-center relative overflow-hidden">
            <div className={`text-lg sm:text-2xl font-mono font-black tracking-tight ${urgencyStyles.accentText}`}>
              {String(countdown.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">
              Secs
            </div>
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Expand / Collapse Toggle Bar */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            {totalTasks} Tasks ({doneTasks} completed)
          </span>

          <span className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
            {isExpanded ? (
              <>
                Collapse tasks <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Expand tasks <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </span>
        </div>
      </div>

      {/* Expandable Task List Section */}
      {isExpanded && (
        <div className="border-t border-zinc-800/80 bg-zinc-950/60 p-4 sm:p-5 space-y-3 animate-in fade-in duration-200">
          {/* Task Items */}
          <div className="space-y-2">
            {hackathon.tasks.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                No tasks added yet. Dictate tasks or add one below.
              </p>
            ) : (
              hackathon.tasks.map((task) => {
                const isDone = task.status === 'done';
                const isDoing = task.status === 'doing';

                return (
                  <div
                    key={task.id}
                    className={`group flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition ${
                      isDone
                        ? 'bg-zinc-900/30 border-zinc-900 text-zinc-500'
                        : isDoing
                        ? 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                        : 'bg-zinc-900/70 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {/* Checkbox & Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => toggleTaskStatus(task.id, e)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/40'
                            : isDoing
                            ? 'bg-blue-950 border-blue-400 text-blue-400'
                            : 'border-zinc-700 bg-zinc-900 hover:border-cyan-400'
                        }`}
                        title={isDone ? 'Mark To-Do' : 'Mark Done'}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        {isDoing && <Play className="w-2.5 h-2.5 fill-current" />}
                      </button>

                      <span
                        className={`text-xs sm:text-sm font-medium leading-tight truncate ${
                          isDone ? 'line-through text-zinc-500' : 'text-zinc-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Status Pill & Delete Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Estimate & Clickable Status Switcher */}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 shrink-0">
                        {task.estimateHours || 1}h
                      </span>

                      <button
                        type="button"
                        onClick={(e) => cycleTaskStatus(task.id, e)}
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md border transition ${
                          isDone
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                            : isDoing
                            ? 'bg-blue-950/80 text-blue-300 border-blue-500/40 hover:bg-blue-900'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                        }`}
                        title="Click to cycle status: To-Do → In Progress → Done"
                      >
                        {task.status === 'done' && 'Done'}
                        {task.status === 'doing' && 'In Progress'}
                        {task.status === 'todo' && 'To-Do'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => deleteTask(task.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Task Add Bar */}
          <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add task to this hackathon..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-cyan-500 hover:text-zinc-950 text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Add task"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Footer Delete Hackathon Option */}
          <div className="flex items-center justify-end pt-1">
            <button
              onClick={() => {
                if (confirm(`Remove "${hackathon.name}" from your board?`)) {
                  onDeleteHackathon(hackathon.id);
                }
              }}
              className="text-[11px] font-mono text-zinc-500 hover:text-rose-400 transition flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove Hackathon</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
