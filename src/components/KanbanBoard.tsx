'use client';

import React, { useState } from 'react';
import { Hackathon, Task, TaskStatus } from '../types/index';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  Timer
} from 'lucide-react';
import { formatISTShort, getCountdown } from '../lib/time';

interface KanbanBoardProps {
  hackathons: Hackathon[];
  onUpdateTasks: (hackathonId: string, updatedTasks: Task[]) => void;
  isReadOnly?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  hackathons,
  onUpdateTasks,
  isReadOnly = false,
}) => {
  const [activeHackathonId, setActiveHackathonId] = useState<string>(() => {
    return hackathons.length > 0 ? hackathons[0].id : '';
  });

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [newTaskInput, setNewTaskInput] = useState<{ [key in TaskStatus]?: string }>({});

  const activeHackathon = hackathons.find((h) => h.id === activeHackathonId) || hackathons[0];

  if (hackathons.length === 0 || !activeHackathon) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 sm:p-10 text-center space-y-3">
        <h3 className="text-base font-bold text-white">No hackathons yet.</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Say or type something like, <span className="text-cyan-300 font-medium">&ldquo;add Smart India Hackathon, deadline November 5 at 11:59 PM&rdquo;</span> to start.
        </p>
      </div>
    );
  }

  const tasks = activeHackathon.tasks || [];
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const doingTasks = tasks.filter((t) => t.status === 'doing');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const getColumnHours = (columnTasks: Task[]) => {
    return columnTasks.reduce((sum, t) => sum + (t.estimateHours && t.estimateHours > 0 ? t.estimateHours : 1), 0);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (isReadOnly) return;
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    if (isReadOnly) return;
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const updated = activeHackathon.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: targetStatus };
      }
      return t;
    });

    onUpdateTasks(activeHackathon.id, updated);
    setDraggedTaskId(null);
  };

  // Task Modifications
  const handleStatusChange = (taskId: string, nextStatus: TaskStatus) => {
    if (isReadOnly) return;
    const updated = activeHackathon.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: nextStatus };
      }
      return t;
    });
    onUpdateTasks(activeHackathon.id, updated);
  };

  const handleUpdateEstimate = (taskId: string, hours: number) => {
    if (isReadOnly) return;
    const validHours = Math.max(0.5, hours);
    const updated = activeHackathon.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, estimateHours: validHours };
      }
      return t;
    });
    onUpdateTasks(activeHackathon.id, updated);
  };

  const handleDeleteTask = (taskId: string) => {
    if (isReadOnly) return;
    const updated = activeHackathon.tasks.filter((t) => t.id !== taskId);
    onUpdateTasks(activeHackathon.id, updated);
  };

  const handleAddQuickTask = (status: TaskStatus) => {
    if (isReadOnly) return;
    const title = (newTaskInput[status] || '').trim();
    if (!title) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      status,
      estimateHours: 1, // Default 1 hour
      createdAt: new Date().toISOString(),
    };

    onUpdateTasks(activeHackathon.id, [...activeHackathon.tasks, newTask]);
    setNewTaskInput((prev) => ({ ...prev, [status]: '' }));
  };

  const countdown = getCountdown(activeHackathon.deadline);

  const columns: Array<{
    status: TaskStatus;
    title: string;
    tasks: Task[];
    color: string;
    borderColor: string;
    badgeBg: string;
  }> = [
    {
      status: 'todo',
      title: 'To Do',
      tasks: todoTasks,
      color: 'text-zinc-300',
      borderColor: 'border-zinc-800',
      badgeBg: 'bg-zinc-800 text-zinc-300',
    },
    {
      status: 'doing',
      title: 'Doing',
      tasks: doingTasks,
      color: 'text-cyan-300',
      borderColor: 'border-cyan-500/40',
      badgeBg: 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40',
    },
    {
      status: 'done',
      title: 'Done',
      tasks: doneTasks,
      color: 'text-emerald-300',
      borderColor: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Hackathon Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {hackathons.map((h) => {
          const isActive = h.id === activeHackathon.id;
          const cd = getCountdown(h.deadline);
          const totalWork = h.tasks
            .filter((t) => t.status !== 'done')
            .reduce((s, t) => s + (t.estimateHours || 1), 0);

          return (
            <button
              key={h.id}
              onClick={() => setActiveHackathonId(h.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 border ${
                isActive
                  ? 'bg-zinc-900 text-white border-cyan-500/50 shadow-md shadow-cyan-950/30'
                  : 'bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <span className="truncate max-w-[160px] sm:max-w-none">{h.name}</span>
              {(h.isDemo || h.id.startsWith('demo-')) && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                  Demo
                </span>
              )}
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {totalWork}h left
              </span>
              {cd.urgency === 'critical' && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Hackathon Info Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-300">
            Deadline: <strong className="text-white">{formatISTShort(activeHackathon.deadline)}</strong>
          </span>
          <span className="text-zinc-600">•</span>
          <span className={countdown.urgency === 'critical' ? 'text-rose-400 font-bold' : 'text-cyan-400'}>
            {countdown.days}d {countdown.hours}h {countdown.minutes}m remaining
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
          <span>
            {isReadOnly
              ? 'Read-only preview. Editing and drag-and-drop are disabled.'
              : 'Tip: Drag tasks between columns or voice dictate to move'}
          </span>
        </div>
      </div>

      {/* 3 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {columns.map((col) => {
          const hoursTotal = getColumnHours(col.tasks);
          const isTarget = !isReadOnly && dragOverColumn === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-2xl border bg-zinc-950/70 backdrop-blur-md p-3.5 transition-all duration-200 min-h-[420px] flex flex-col ${
                isTarget
                  ? 'border-cyan-400 ring-2 ring-cyan-500/20 bg-zinc-900/50'
                  : 'border-zinc-800/80'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60 mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xs font-mono uppercase font-bold tracking-wider ${col.color}`}>
                    {col.title}
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${col.badgeBg}`}>
                    {col.tasks.length}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                  <Timer className="w-3 h-3 text-zinc-500" />
                  <span>{hoursTotal} hr{hoursTotal === 1 ? '' : 's'}</span>
                </div>
              </div>

              {/* Task Cards */}
              <div className="flex-1 space-y-2.5 overflow-y-auto no-scrollbar">
                {col.tasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-zinc-800/60 rounded-xl flex items-center justify-center text-center p-3 text-zinc-600 text-xs">
                    {isReadOnly ? 'No tasks in this column' : 'Drop tasks here'}
                  </div>
                ) : (
                  col.tasks.map((task) => {
                    const est = task.estimateHours || 1;

                    return (
                      <div
                        key={task.id}
                        draggable={!isReadOnly}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`group relative rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 p-3 shadow-md transition space-y-2 ${
                          isReadOnly ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs sm:text-sm font-medium leading-snug ${
                            task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-100'
                          }`}>
                            {task.title}
                          </p>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition shrink-0"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Footer: Estimate Pill + Move Shortcuts */}
                        <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-zinc-800/40">
                          {/* Estimate Controls */}
                          <div className="flex items-center gap-1 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800 text-zinc-300">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{est}h</span>
                            {!isReadOnly && (
                              <div className="flex items-center gap-0.5 ml-1 border-l border-zinc-800 pl-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateEstimate(task.id, est + 1)}
                                  className="text-zinc-500 hover:text-white px-0.5"
                                  title="Add 1 hour estimate"
                                >
                                  +
                                </button>
                                {est > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateEstimate(task.id, est - 1)}
                                    className="text-zinc-500 hover:text-white px-0.5"
                                    title="Reduce 1 hour estimate"
                                  >
                                    -
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quick Column Shift Buttons */}
                          {!isReadOnly && (
                            <div className="flex items-center gap-1">
                              {col.status !== 'todo' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(task.id, 'todo')}
                                  className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                                  title="Move to To-Do"
                                >
                                  To-Do
                                </button>
                              )}
                              {col.status !== 'doing' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(task.id, 'doing')}
                                  className="px-1.5 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/40 transition"
                                  title="Move to Doing"
                                >
                                  Doing
                                </button>
                              )}
                              {col.status !== 'done' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(task.id, 'done')}
                                  className="px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/40 transition"
                                  title="Move to Done"
                                >
                                  Done
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inline Quick Add Task */}
              {!isReadOnly && (
                <div className="pt-3 mt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newTaskInput[col.status] || ''}
                      onChange={(e) =>
                        setNewTaskInput((prev) => ({ ...prev, [col.status]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddQuickTask(col.status);
                        }
                      }}
                      placeholder={`+ Add task to ${col.title}...`}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddQuickTask(col.status)}
                      disabled={!(newTaskInput[col.status] || '').trim()}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-500 hover:text-zinc-950 text-zinc-400 disabled:opacity-40 transition"
                      title="Add task"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
