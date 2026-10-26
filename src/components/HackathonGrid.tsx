'use client';

import React from 'react';
import { Hackathon, Task } from '../types/index';
import { HackathonCard } from './HackathonCard';
import { Sparkles, Trophy, Mic, CornerDownLeft } from 'lucide-react';

interface HackathonGridProps {
  hackathons: Hackathon[];
  onUpdateTasks: (hackathonId: string, updatedTasks: Task[]) => void;
  onDeleteHackathon: (hackathonId: string, hackathonName: string) => void;
  onLoadSampleData: () => void;
  onPopulatePrompt?: (prompt: string) => void;
  isReadOnly?: boolean;
}

export const HackathonGrid: React.FC<HackathonGridProps> = ({
  hackathons,
  onUpdateTasks,
  onDeleteHackathon,
  onLoadSampleData,
  onPopulatePrompt,
  isReadOnly = false,
}) => {
  // Sort by nearest deadline ascending
  const sortedHackathons = [...hackathons].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const samplePrompt = 'add Smart India Hackathon, deadline November 5 at 11:59 PM';

  if (sortedHackathons.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 sm:p-10 text-center space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto text-cyan-400 shadow-inner">
          <Trophy className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {isReadOnly ? 'No hackathons on this shared board.' : 'No hackathons yet.'}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {isReadOnly
              ? 'Click "Back to my board" to return to your saved hackathons.'
              : (
                <>Say or type something like, <span className="text-cyan-300 font-medium">&ldquo;{samplePrompt}&rdquo;</span></>
              )}
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {onPopulatePrompt && (
              <button
                type="button"
                onClick={() => onPopulatePrompt(samplePrompt)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 transition active:scale-95 shadow-sm"
                title="Click to fill command bar with this sample"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Try: &ldquo;{samplePrompt}&rdquo;</span>
                <CornerDownLeft className="w-3 h-3 text-cyan-500" />
              </button>
            )}

            <button
              type="button"
              onClick={onLoadSampleData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
              title="Add the sample hackathons back without wiping your own"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load sample data</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-2">
          <span>Active Hackathons</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
            Sorted by nearest deadline
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedHackathons.map((hackathon) => (
          <HackathonCard
            key={hackathon.id}
            hackathon={hackathon}
            onUpdateTasks={onUpdateTasks}
            onDeleteHackathon={onDeleteHackathon}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    </div>
  );
};
