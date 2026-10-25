'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Target, 
  AlertTriangle 
} from 'lucide-react';
import { WhatNowRecommendation, TaskStatus } from '../types/index';
import { triggerCompletionConfetti } from '../lib/confetti';

interface WhatNowModalProps {
  recommendation: WhatNowRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTaskStatus: (hackathonId: string, taskId: string, status: TaskStatus) => void;
}

export const WhatNowModal: React.FC<WhatNowModalProps> = ({
  recommendation,
  isOpen,
  onClose,
  onUpdateTaskStatus,
}) => {
  const [timerSeconds, setTimerSeconds] = useState<number>(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompletedPromptOpen, setIsCompletedPromptOpen] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer whenever a new recommendation is loaded
  useEffect(() => {
    if (recommendation) {
      setTimerSeconds(25 * 60);
      setIsRunning(false);
      setIsCompletedPromptOpen(false);
    }
  }, [recommendation]);

  // Pomodoro timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompletedPromptOpen(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  if (!isOpen || !recommendation) return null;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleStartTimer = () => {
    setIsRunning(true);
    // Also mark task as 'doing' if it was 'todo'
    if (recommendation.task.status === 'todo') {
      onUpdateTaskStatus(recommendation.hackathon.id, recommendation.task.id, 'doing');
    }
  };

  const handlePauseTimer = () => {
    setIsRunning(false);
  };

  const handleResetTimer = (minutesCount = 25) => {
    setIsRunning(false);
    setTimerSeconds(minutesCount * 60);
    setIsCompletedPromptOpen(false);
  };

  const handleAdjustTimer = (deltaMinutes: number) => {
    setTimerSeconds((prev) => Math.max(60, prev + deltaMinutes * 60));
  };

  const handleConfirmDone = () => {
    onUpdateTaskStatus(recommendation.hackathon.id, recommendation.task.id, 'done');
    triggerCompletionConfetti();
    setIsCompletedPromptOpen(false);
    onClose();
  };

  const handleKeepDoing = () => {
    onUpdateTaskStatus(recommendation.hackathon.id, recommendation.task.id, 'doing');
    setIsCompletedPromptOpen(false);
    handleResetTimer(15); // +15 min focus extension
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-zinc-900 border border-cyan-500/50 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/50 text-zinc-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold">
                War Room Focus Intelligence
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Recommended Next Step
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Focus Card Box */}
        <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-5 space-y-4">
          {/* Hackathon Badge & Plain Sentence Reason */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {recommendation.hackathon.name}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                • {recommendation.task.estimateHours || 1} hr estimated
              </span>
              {recommendation.isOverbooked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/50">
                  <AlertTriangle className="w-3 h-3 text-rose-400" /> Overbooked
                </span>
              )}
            </div>

            {/* Plain Sentence Reason Required */}
            <p className="text-xs sm:text-sm font-semibold text-cyan-200">
              {recommendation.reason}
            </p>
          </div>

          {/* Large Task Headline */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-1">
              Prime Objective
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {recommendation.task.title}
            </h3>
          </div>
        </div>

        {/* Pomodoro Focus Timer Section */}
        <div className="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 text-center space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              Pomodoro Focus Timer
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-wider">
              {formattedTimer}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-zinc-950 shadow-lg shadow-cyan-400/25 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Focus Sprint (25m)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePauseTimer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/25 transition active:scale-95"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Timer</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleResetTimer(25)}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Reset to 25m"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleAdjustTimer(5)}
              className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-semibold text-zinc-300 transition"
              title="Add 5 minutes"
            >
              +5m
            </button>

            <button
              type="button"
              onClick={() => handleAdjustTimer(-5)}
              className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-semibold text-zinc-300 transition"
              title="Subtract 5 minutes"
            >
              -5m
            </button>
          </div>
        </div>

        {/* Completion Prompt Overlay (When timer ends) */}
        {isCompletedPromptOpen && (
          <div className="rounded-xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-900 border border-emerald-500/50 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sprint Finished! Did you complete this task?</span>
            </div>
            <p className="text-xs text-zinc-300">
              &ldquo;{recommendation.task.title}&rdquo; in {recommendation.hackathon.name}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmDone}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition"
              >
                Yes, Mark as Done
              </button>

              <button
                type="button"
                onClick={handleKeepDoing}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
              >
                Still In Progress (+15m)
              </button>

              <button
                type="button"
                onClick={() => setIsCompletedPromptOpen(false)}
                className="px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
