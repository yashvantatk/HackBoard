'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Play, Target, FileText, Calendar } from 'lucide-react';

interface JudgeTourStripProps {
  onRunStep1Command: (sampleText: string) => void;
  onOpenStep2WhatNow: () => void;
  onOpenStep3RulesReader: () => void;
  onSwitchStep4Timeline: () => void;
}

const STORAGE_KEY = 'hackboard_tour_dismissed_v1';

export const JudgeTourStrip: React.FC<JudgeTourStripProps> = ({
  onRunStep1Command,
  onOpenStep2WhatNow,
  onOpenStep3RulesReader,
  onSwitchStep4Timeline,
}) => {
  const [isDismissed, setIsDismissed] = useState(true);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setIsDismissed(false);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setActiveStep(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  const handleStartTour = () => {
    setActiveStep(1);
    // Step 1: Run sample ramble
    onRunStep1Command('Nvidia closes October 30 at 11:59 pm. I still need the demo video, readme, and deploy.');
  };

  const handleNextStep = () => {
    if (activeStep === 1) {
      setActiveStep(2);
      onOpenStep2WhatNow();
    } else if (activeStep === 2) {
      setActiveStep(3);
      onOpenStep3RulesReader();
    } else if (activeStep === 3) {
      setActiveStep(4);
      onSwitchStep4Timeline();
    } else if (activeStep === 4) {
      setActiveStep(null);
    }
  };

  if (isDismissed && activeStep === null) return null;

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/60 to-purple-950/70 border border-cyan-500/40 p-4 shadow-xl shadow-cyan-950/30 text-zinc-100 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Welcome Text */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-900/80 text-cyan-200 border border-cyan-500/40">
                Judge Quickstart
              </span>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                Hackboard, your hackathon war room. Talk, it plans.
              </h2>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              Zero-backend, local-first voice operations. Try the 60-second guided interactive demo.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {activeStep === null ? (
            <button
              type="button"
              onClick={handleStartTour}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition shadow-lg shadow-cyan-400/20 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Try it in 60 seconds</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-300 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-700">
                Step {activeStep}/4
              </span>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-md shadow-cyan-400/25 active:scale-95"
              >
                <span>{activeStep === 4 ? 'Finish Tour 🎉' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Dismiss welcome strip"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Guide One-Line Caption Callout (when active) */}
      {activeStep !== null && (
        <div className="mt-3 pt-3 border-t border-cyan-800/40 flex items-center gap-2.5 text-xs text-cyan-200">
          {activeStep === 1 && (
            <>
              <Play className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Step 1:</strong> Dictated sample ramble into command bar — deadlines and tasks extracted live!
              </span>
            </>
          )}
          {activeStep === 2 && (
            <>
              <Target className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Step 2:</strong> Opened <em>What Now</em> focus card — least-slack algorithm scored your top task with a Pomodoro timer.
              </span>
            </>
          )}
          {activeStep === 3 && (
            <>
              <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Step 3:</strong> Opened <em>Rules Reader</em> — auto-extracting guidelines, demo video max duration, and requirements.
              </span>
            </>
          )}
          {activeStep === 4 && (
            <>
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Step 4:</strong> Switched to <em>Timeline View</em> — entire hackathon week plotted live with Mermaid Gantt.
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
