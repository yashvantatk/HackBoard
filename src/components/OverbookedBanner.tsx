'use client';

import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import { OverbookedAlert } from '../lib/whatnow';

interface OverbookedBannerProps {
  alerts: OverbookedAlert[];
  onOpenWhatNow: () => void;
}

export const OverbookedBanner: React.FC<OverbookedBannerProps> = ({
  alerts,
  onOpenWhatNow,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (alerts.length === 0 || dismissed) return null;

  const primaryAlert = alerts[0];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/80 to-zinc-950 border border-rose-500/60 p-3.5 sm:p-4 shadow-xl shadow-rose-950/40 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-200 border border-rose-500/40">
                Crunch Warning
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                You&apos;re overbooked on {primaryAlert.hackathonName}
              </span>
            </div>

            <p className="text-xs text-rose-200/90">
              {primaryAlert.remainingWorkHours} hours of estimated work remaining, but only{' '}
              {primaryAlert.hoursLeft} hours until deadline!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={onOpenWhatNow}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-950 bg-rose-400 hover:bg-rose-300 transition shadow-md shadow-rose-400/25 active:scale-95"
          >
            <span>Focus Now (N)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-rose-300/70 hover:text-white hover:bg-rose-900/40 transition"
            title="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
