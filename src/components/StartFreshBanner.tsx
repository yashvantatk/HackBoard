'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface StartFreshBannerProps {
  onStartFresh: () => void;
}

export const StartFreshBanner: React.FC<StartFreshBannerProps> = ({ onStartFresh }) => {
  return (
    <div className="relative rounded-xl bg-gradient-to-r from-cyan-950/70 via-zinc-900/90 to-blue-950/70 border border-cyan-500/30 px-3.5 py-2 text-zinc-200 text-xs shadow-md animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            You&apos;re viewing sample data.
          </span>
        </div>

        <button
          type="button"
          onClick={onStartFresh}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-cyan-200 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 hover:border-cyan-400 transition shrink-0 active:scale-95"
        >
          <span>Start your own board</span>
          <ArrowRight className="w-3 h-3 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
