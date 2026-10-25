'use client';

import React from 'react';
import { Hackathon, Task } from '../types/index';
import { HackathonCard } from './HackathonCard';
import { Sparkles, Trophy } from 'lucide-react';

interface HackathonGridProps {
  hackathons: Hackathon[];
  onUpdateTasks: (hackathonId: string, updatedTasks: Task[]) => void;
  onDeleteHackathon: (hackathonId: string) => void;
  onResetDemo: () => void;
}

export const HackathonGrid: React.FC<HackathonGridProps> = ({
  hackathons,
  onUpdateTasks,
  onDeleteHackathon,
  onResetDemo,
}) => {
  // Sort by nearest deadline ascending
  const sortedHackathons = [...hackathons].sort((a, b) => {
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  if (sortedHackathons.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center space-y-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto text-zinc-500">
          <Trophy className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Your War Room is Clear</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            No hackathons currently on your plate. Hold your Wispr key and dictate a new one or restore the demo board.
          </p>
        </div>
        <button
          onClick={onResetDemo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-zinc-950 hover:bg-cyan-400 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Restore Demo Hackathons</span>
        </button>
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
          />
        ))}
      </div>
    </div>
  );
};
