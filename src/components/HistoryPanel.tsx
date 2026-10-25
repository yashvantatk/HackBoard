'use client';

import React from 'react';
import { HistoryEntry } from '../types/index';
import { formatISTShort } from '../lib/time';
import { 
  History, 
  Trash2, 
  Mic, 
  CornerDownRight 
} from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryEntry[];
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onClearHistory,
}) => {
  const getBadgeStyle = (type: HistoryEntry['actionType']) => {
    switch (type) {
      case 'create_hackathon':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'update_hackathon':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'change_task':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'question':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getBadgeLabel = (type: HistoryEntry['actionType']) => {
    switch (type) {
      case 'create_hackathon':
        return 'New Hackathon';
      case 'update_hackathon':
        return 'Board Updated';
      case 'change_task':
        return 'Task Changed';
      case 'question':
        return 'Query Answered';
      default:
        return 'Command';
    }
  };

  return (
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/70 backdrop-blur-md p-4 sm:p-5 flex flex-col h-full max-h-[850px] space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-cyan-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Action History
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                {history.length}
              </span>
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono">What you said → What Hackboard did</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* History Items Feed (Newest First) */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 no-scrollbar">
        {history.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Mic className="w-8 h-8 text-zinc-700 mx-auto" />
            <p className="text-xs text-zinc-500">
              No command history yet. Dictate your thoughts to start populating this war room feed.
            </p>
          </div>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70 space-y-2.5 transition hover:border-zinc-700"
            >
              {/* Header with Type & Timestamp */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span
                  className={`px-2 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getBadgeStyle(
                    entry.actionType
                  )}`}
                >
                  {getBadgeLabel(entry.actionType)}
                </span>
                <span className="text-zinc-500">
                  {formatISTShort(entry.timestamp)}
                </span>
              </div>

              {/* What I Said (Raw Voice Input) */}
              <div className="flex items-start gap-2 bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/60">
                <Mic className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-300 italic font-normal leading-relaxed">
                  &ldquo;{entry.rawInput}&rdquo;
                </p>
              </div>

              {/* What Hackboard Did */}
              <div className="flex items-start gap-2 pl-1">
                <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-cyan-300 font-medium leading-relaxed">
                  {entry.actionSummary}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
