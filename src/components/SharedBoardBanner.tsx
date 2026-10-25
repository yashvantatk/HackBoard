'use client';

import React from 'react';
import { Copy, Eye } from 'lucide-react';

interface SharedBoardBannerProps {
  onImportToLocal: () => void;
  onExitSharedView: () => void;
}

export const SharedBoardBanner: React.FC<SharedBoardBannerProps> = ({
  onImportToLocal,
  onExitSharedView,
}) => {
  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-purple-950/90 border border-blue-500/50 p-4 shadow-xl shadow-blue-950/40 text-zinc-100 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
            <Eye className="w-5 h-5 text-blue-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-200 border border-blue-500/40">
                Shared Board View
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                You&apos;re viewing a shared board
              </h2>
            </div>
            <p className="text-xs text-blue-200/90 mt-0.5">
              Decoded 100% locally from the URL hash. Zero servers or API keys involved.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={onImportToLocal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-md shadow-cyan-400/25 active:scale-95"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy into My Board</span>
          </button>

          <button
            type="button"
            onClick={onExitSharedView}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition"
          >
            Exit Preview
          </button>
        </div>
      </div>
    </div>
  );
};
