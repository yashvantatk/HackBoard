'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Hackathon } from '../types/index';
import { getCountdown, Countdown, formatISTShort } from '../lib/time';
import { Calendar, Clock, CheckCircle2, Play, Eye, EyeOff } from 'lucide-react';

interface TimelineViewProps {
  hackathons: Hackathon[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ hackathons }) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [showDone, setShowDone] = useState<boolean>(false);

  // Live timer tick every 10 seconds to update 'Now' marker and countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute timeline span: from start of today (IST) until end of latest deadline day (IST)
  const timeline = useMemo(() => {
    if (hackathons.length === 0) return null;

    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const nowParts = istFormatter.formatToParts(now);
    const nowYear = parseInt(nowParts.find((p) => p.type === 'year')?.value || `${now.getFullYear()}`);
    const nowMonth = parseInt(nowParts.find((p) => p.type === 'month')?.value || `${now.getMonth() + 1}`);
    const nowDay = parseInt(nowParts.find((p) => p.type === 'day')?.value || `${now.getDate()}`);

    const pad = (n: number) => String(n).padStart(2, '0');
    // Start of today in IST (00:00:00+05:30)
    const startDate = new Date(`${nowYear}-${pad(nowMonth)}-${pad(nowDay)}T00:00:00+05:30`);

    // Latest deadline among hackathons
    const maxDeadlineMs = Math.max(
      ...hackathons.map((h) => new Date(h.deadline).getTime()),
      startDate.getTime() + 3 * 24 * 60 * 60 * 1000 // At least 3 full days
    );
    const maxDeadlineDate = new Date(maxDeadlineMs);

    const maxParts = istFormatter.formatToParts(maxDeadlineDate);
    const maxYear = parseInt(maxParts.find((p) => p.type === 'year')?.value || `${maxDeadlineDate.getFullYear()}`);
    const maxMonth = parseInt(maxParts.find((p) => p.type === 'month')?.value || `${maxDeadlineDate.getMonth() + 1}`);
    const maxDay = parseInt(maxParts.find((p) => p.type === 'day')?.value || `${maxDeadlineDate.getDate()}`);

    // End of last deadline day in IST (23:59:59+05:30)
    const endDate = new Date(`${maxYear}-${pad(maxMonth)}-${pad(maxDay)}T23:59:59+05:30`);

    // Generate day columns
    const days: { label: string; date: Date }[] = [];
    let cur = new Date(startDate.getTime());
    while (cur.getTime() <= endDate.getTime() + 1000) {
      const label = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
      }).format(cur);
      days.push({ label, date: new Date(cur.getTime()) });
      cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
    }

    const totalStartMs = startDate.getTime();
    const totalEndMs = endDate.getTime();
    const totalDurationMs = Math.max(1, totalEndMs - totalStartMs);

    const getPct = (timestampMs: number): number => {
      const clamped = Math.max(totalStartMs, Math.min(totalEndMs, timestampMs));
      return ((clamped - totalStartMs) / totalDurationMs) * 100;
    };

    const nowPct = getPct(now.getTime());

    return {
      days,
      totalStartMs,
      totalEndMs,
      totalDurationMs,
      getPct,
      nowPct,
    };
  }, [hackathons, now]);

  if (hackathons.length === 0 || !timeline) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400 font-mono text-sm">
        No active hackathons to plot on the timeline.
      </div>
    );
  }

  const totalDoneTasks = hackathons.reduce(
    (acc, h) => acc + h.tasks.filter((t) => t.status === 'done').length,
    0
  );

  // Card-matching urgency color for the hackathon deadline bars
  const getUrgencyClasses = (cd: Countdown) => {
    if (cd.isExpired) {
      return 'bg-zinc-800 border-zinc-700 text-zinc-400';
    }
    switch (cd.urgency) {
      case 'critical': // <= 12 hours
        return 'bg-gradient-to-r from-rose-600/90 to-rose-500/90 border-rose-400 text-white shadow-lg shadow-rose-950/50';
      case 'warning': // <= 48 hours
        return 'bg-gradient-to-r from-amber-600/90 to-amber-500/90 border-amber-400 text-white shadow-lg shadow-amber-950/50';
      case 'normal': // > 48 hours
      default:
        return 'bg-gradient-to-r from-emerald-600/90 to-emerald-500/90 border-emerald-400 text-white shadow-lg shadow-emerald-950/50';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-zinc-200">
            <strong>Operations Timeline</strong> • {timeline.days.length} Days View (IST)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDone((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            {showDone ? (
              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{showDone ? 'Hide Done' : `Show Done (${totalDoneTasks})`}</span>
          </button>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> &gt;48h
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> &le;48h
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> &le;12h
            </span>
          </div>
        </div>
      </div>

      {/* Custom HTML + Tailwind Responsive Timeline */}
      <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden">
        <div className="w-full overflow-x-auto no-scrollbar">
          <div className="w-full min-w-[760px] flex flex-col divide-y divide-zinc-800/80">
            
            {/* Sticky Header Row */}
            <div className="sticky top-0 z-40 flex items-stretch bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
              {/* Left Fixed 200px Column: Hackathons Label */}
              <div className="w-[200px] min-w-[200px] max-w-[200px] shrink-0 sticky left-0 z-50 bg-zinc-900 px-4 py-3 border-r border-zinc-800 flex items-center justify-between text-[13px] font-mono font-bold text-zinc-300">
                <span className="truncate" title="Hackathons & Tasks">Hackathons</span>
                <span className="text-[10px] text-zinc-400 font-normal">Tasks</span>
              </div>

              {/* Day Columns */}
              <div className="flex-1 relative flex items-stretch">
                {timeline.days.map((day, idx) => (
                  <div
                    key={idx}
                    className="flex-1 px-3 py-3 border-r border-zinc-800/60 last:border-r-0 flex items-center justify-center text-center"
                  >
                    <span className="text-[13px] font-mono font-semibold text-zinc-300 tracking-wide">
                      {day.label}
                    </span>
                  </div>
                ))}

                {/* Now Marker Pill in Header */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 pointer-events-none"
                  style={{ left: `${timeline.nowPct}%` }}
                >
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950">
                    Now
                  </span>
                </div>
              </div>
            </div>

            {/* Hackathon Sections and Tasks */}
            {hackathons.map((h) => {
              const cd = getCountdown(h.deadline, now);
              const deadlineMs = new Date(h.deadline).getTime();
              const deadlinePct = timeline.getPct(deadlineMs);

              // Bar starts at Now and ends at deadline
              const barLeft = Math.max(0, timeline.nowPct);
              const barWidth = Math.max(2, deadlinePct - barLeft);

              const cdText = cd.isExpired
                ? 'Closed'
                : `${cd.days > 0 ? `${cd.days}d ` : ''}${cd.hours}h ${cd.minutes}m left`;

              const visibleTasks = showDone
                ? h.tasks
                : h.tasks.filter((t) => t.status !== 'done');

              // Sequential placement for unfinished tasks starting at now
              let cumulativeTaskHours = 0;

              return (
                <div key={h.id} className="flex flex-col bg-zinc-950/60 hover:bg-zinc-900/20 transition-colors">
                  {/* Hackathon Parent Row */}
                  <div className="flex items-stretch min-h-[50px] relative">
                    {/* Fixed 200px Left Column: Hackathon Name */}
                    <div className="w-[200px] min-w-[200px] max-w-[200px] shrink-0 sticky left-0 z-30 bg-zinc-950 px-4 py-2.5 border-r border-zinc-800 flex items-center justify-between gap-2 shadow-sm">
                      <div className="min-w-0 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: h.accentColor || '#06b6d4' }}
                        />
                        <span
                          className="text-xs font-mono font-bold text-white truncate"
                          title={h.name}
                        >
                          {h.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                        {h.tasks.filter((t) => t.status === 'done').length}/{h.tasks.length}
                      </span>
                    </div>

                    {/* Hackathon Timeline Bar Area */}
                    <div className="flex-1 relative flex items-center px-1">
                      {/* Day Grid Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {timeline.days.map((_, idx) => (
                          <div
                            key={idx}
                            className="flex-1 border-r border-zinc-800/30 last:border-r-0"
                          />
                        ))}
                      </div>

                      {/* Thin Vertical Line for Right Now */}
                      <div
                        className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-20 pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.9)]"
                        style={{ left: `${timeline.nowPct}%` }}
                      />

                      {/* Colored Urgency Bar from Now until Deadline */}
                      <div
                        className={`absolute h-8 rounded-xl border flex items-center z-10 transition-all ${getUrgencyClasses(
                          cd
                        )}`}
                        style={{
                          left: `${barLeft}%`,
                          width: `${barWidth}%`,
                        }}
                        title={`${h.name}: closes ${formatISTShort(h.deadline)} (${cdText})`}
                      >
                        <div className="px-3 flex items-center justify-between w-full min-w-0">
                          <span className="text-[11px] font-mono font-bold truncate">
                            {cdText}
                          </span>
                          <span className="hidden md:inline text-[10px] font-mono opacity-80 shrink-0 ml-1">
                            Closes {formatISTShort(h.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Indented Task Sub-Rows */}
                  {visibleTasks.map((t) => {
                    const estHours = t.estimateHours && t.estimateHours > 0 ? t.estimateHours : 1;

                    // Calculate task position starting from now
                    const taskStartMs = now.getTime() + cumulativeTaskHours * 60 * 60 * 1000;
                    cumulativeTaskHours += estHours;
                    let taskEndMs = taskStartMs + estHours * 60 * 60 * 1000;
                    if (taskEndMs > deadlineMs) taskEndMs = deadlineMs;

                    const taskStartPct = timeline.getPct(taskStartMs);
                    const taskEndPct = timeline.getPct(taskEndMs);
                    const taskWidthPct = Math.max(1.5, taskEndPct - taskStartPct);

                    return (
                      <div
                        key={t.id}
                        className="flex items-stretch min-h-[34px] border-t border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors"
                      >
                        {/* Fixed 200px Left Column: Indented Task Title & Estimate */}
                        <div className="w-[200px] min-w-[200px] max-w-[200px] shrink-0 sticky left-0 z-30 bg-zinc-950 pl-6 pr-3 py-1.5 border-r border-zinc-800 flex items-center justify-between gap-1.5 shadow-sm">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {t.status === 'done' && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            )}
                            {t.status === 'doing' && (
                              <Play className="w-3 h-3 text-cyan-400 fill-current shrink-0" />
                            )}
                            {t.status === 'todo' && (
                              <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                            )}
                            <span
                              className={`text-[11px] font-mono truncate ${
                                t.status === 'done'
                                  ? 'text-zinc-500 line-through'
                                  : t.status === 'doing'
                                  ? 'text-cyan-200 font-semibold'
                                  : 'text-zinc-300'
                              }`}
                              title={t.title}
                            >
                              {t.title}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/90 px-1 py-0.5 rounded border border-zinc-800 shrink-0">
                            {estHours}h
                          </span>
                        </div>

                        {/* Task Timeline Track */}
                        <div className="flex-1 relative flex items-center px-1">
                          {/* Day Grid Lines */}
                          <div className="absolute inset-0 flex pointer-events-none">
                            {timeline.days.map((_, idx) => (
                              <div
                                key={idx}
                                className="flex-1 border-r border-zinc-800/30 last:border-r-0"
                              />
                            ))}
                          </div>

                          {/* Thin Vertical Line for Right Now */}
                          <div
                            className="absolute top-0 bottom-0 w-[2px] bg-cyan-400/80 z-20 pointer-events-none"
                            style={{ left: `${timeline.nowPct}%` }}
                          />

                          {/* Task Mini-Bar */}
                          <div
                            className={`absolute h-5 rounded-md border flex items-center px-2 z-10 transition-all ${
                              t.status === 'done'
                                ? 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500 line-through'
                                : t.status === 'doing'
                                ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-200 shadow-sm shadow-cyan-950'
                                : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-200'
                            }`}
                            style={{
                              left: `${t.status === 'done' ? timeline.getPct(new Date(t.createdAt || now).getTime()) : taskStartPct}%`,
                              width: `${taskWidthPct}%`,
                            }}
                            title={`${t.title} (${estHours}h) • Status: ${t.status}`}
                          >
                            <span className="text-[10px] font-mono truncate">
                              {t.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
