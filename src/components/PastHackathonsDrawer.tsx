'use client';

import React, { useState } from 'react';
import { Hackathon } from '../types/index';
import { ChevronDown, ChevronUp, Archive, Calendar, CheckCircle2 } from 'lucide-react';
import { formatISTShort } from '../lib/time';

interface PastHackathonsDrawerProps {
  pastHackathons: Hackathon[];
}

export const PastHackathonsDrawer: React.FC<PastHackathonsDrawerProps> = ({
  pastHackathons,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (pastHackathons.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden text-xs">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/40 transition select-none"
      >
        <div className="flex items-center gap-2.5">
          <Archive className="w-4 h-4 text-zinc-500" />
          <span className="font-mono font-bold text-zinc-400">
            Past / Closed Hackathons ({pastHackathons.length})
          </span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-mono">
            Archived
          </span>
        </div>

        <div className="flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
          <span>{isOpen ? 'Hide past boards' : 'Show past boards'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsed Items */}
      {isOpen && (
        <div className="border-t border-zinc-800/60 p-4 space-y-3 bg-zinc-950/80 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pastHackathons.map((h) => {
              const total = h.tasks.length;
              const done = h.tasks.filter((t) => t.status === 'done').length;

              return (
                <div
                  key={h.id}
                  className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 opacity-75 hover:opacity-100 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-zinc-300 font-mono text-sm truncate">
                      {h.name}
                    </h4>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Closed
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Closed on {formatISTShort(h.deadline)}</span>
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
                    <span>
                      {done}/{total} tasks completed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
