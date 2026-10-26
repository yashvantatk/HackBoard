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

  // Compute exact timeline bounds strictly in Indian Standard Time (IST):
  // Start: 00:00:00 IST of today
  // End: 24:00:00 IST of the latest deadline day (ends exactly at the last deadline's day)
  const timeline = useMemo(() => {
    if (hackathons.length === 0) return null;

    const istFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const pad = (n: number) => String(n).padStart(2, '0');

    // Start of today in IST (00:00:00.000+05:30)
    const nowParts = istFormatter.formatToParts(now);
    const nowYear = parseInt(nowParts.find((p) => p.type === 'year')?.value || `${now.getFullYear()}`);
    const nowMonth = parseInt(nowParts.find((p) => p.type === 'month')?.value || `${now.getMonth() + 1}`);
    const nowDay = parseInt(nowParts.find((p) => p.type === 'day')?.value || `${now.getDate()}`);
    const timelineStart = new Date(`${nowYear}-${pad(nowMonth)}-${pad(nowDay)}T00:00:00+05:30`);

    // Latest deadline among active hackathons
    const maxDeadlineMs = Math.max(
      ...hackathons.map((h) => new Date(h.deadline).getTime()),
      timelineStart.getTime() + 24 * 60 * 60 * 1000 // At least 1 day
    );

    // Day of the last deadline in IST
    const maxParts = istFormatter.formatToParts(new Date(maxDeadlineMs));
    const maxYear = parseInt(maxParts.find((p) => p.type === 'year')?.value || `${maxDeadlineMs}`);
    const maxMonth = parseInt(maxParts.find((p) => p.type === 'month')?.value || '10');
    const maxDay = parseInt(maxParts.find((p) => p.type === 'day')?.value || '31');

    // Timeline ends at 24:00:00 IST of the last deadline's day (start of the next day)
    const lastDayStart = new Date(`${maxYear}-${pad(maxMonth)}-${pad(maxDay)}T00:00:00+05:30`);
    let timelineEnd = new Date(lastDayStart.getTime() + 24 * 60 * 60 * 1000);

    // Safeguard duration
    if (timelineEnd.getTime() <= timelineStart.getTime()) {
      timelineEnd = new Date(timelineStart.getTime() + 24 * 60 * 60 * 1000);
    }

    const totalDurationMs = timelineEnd.getTime() - timelineStart.getTime();
    const totalDays = Math.max(1, Math.round(totalDurationMs / (24 * 60 * 60 * 1000)));

    // Generate exactly one column per 24-hour day slice
    const days: { label: string; date: Date }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(timelineStart.getTime() + i * 24 * 60 * 60 * 1000);
      const label = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
      }).format(d);
      days.push({ label, date: d });
    }

    // Exact proportional percentage on the timeline scale
    const getPct = (timestampMs: number): number => {
      const clamped = Math.max(timelineStart.getTime(), Math.min(timelineEnd.getTime(), timestampMs));
      return ((clamped - timelineStart.getTime()) / totalDurationMs) * 100;
    };

    const nowPct = getPct(now.getTime());

    return {
      days,
      totalDays,
      timelineStart,
      timelineEnd,
      totalDurationMs,
      getPct,
      nowPct,
    };
  }, [hackathons, now]);

  if (hackathons.length === 0 || !timeline) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400 font-mono text-xs">
        No active hackathons to plot on the timeline.
      </div>
    );
  }

  const totalDoneTasks = hackathons.reduce(
    (acc, h) => acc + h.tasks.filter((t) => t.status === 'done').length,
    0
  );

  // Urgency styling matching cards
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            {showDone ? (
              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{showDone ? 'Hide Done' : `Show Done (${totalDoneTasks})`}</span>
          </button>

          {/* Urgency Legend: font size bumped to 12px (text-xs) */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-300">
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
          <div className="w-full min-w-[760px] flex flex-col divide-y divide-zinc-800/80 relative">
            
            {/* Sticky Header Row */}
            <div className="sticky top-0 z-40 flex items-stretch bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 h-11">
              {/* Left Fixed 200px Column: Hackathons Label */}
              <div className="w-[200px] min-w-[200px] max-w-[200px] shrink-0 sticky left-0 z-50 bg-zinc-900 px-4 py-2.5 border-r border-zinc-800 flex items-center justify-between text-[13px] font-mono font-bold text-zinc-200 shadow-sm">
                <span className="truncate" title="Hackathons & Tasks">Hackathons</span>
                <span className="text-xs text-zinc-400 font-normal">Tasks</span>
              </div>

              {/* Day Columns: Exactly one 24-hour slice per column */}
              <div className="flex-1 relative flex items-stretch">
                {timeline.days.map((day, idx) => (
                  <div
                    key={idx}
                    className="flex-1 px-2 border-r border-zinc-800/60 last:border-r-0 flex items-center justify-center text-center"
                  >
                    <span className="text-[13px] font-mono font-semibold text-zinc-200 tracking-wide">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical Line for Right Now across the grid & Now Badge offset just below the header row */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 z-30 pointer-events-none shadow-[0_0_10px_rgba(6,182,212,0.9)]"
              style={{ left: `calc(200px + (100% - 200px) * ${timeline.nowPct / 100})` }}
            >
              {/* Now Badge sits cleanly just below the header row so the Mon 26 label is never covered */}
              <div className="absolute top-[48px] -translate-x-1/2 z-40 pointer-events-none">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950">
                  Now
                </span>
              </div>
            </div>

            {/* Hackathon Sections and Tasks */}
            {hackathons.map((h) => {
              const cd = getCountdown(h.deadline, now);
              const deadlineMs = new Date(h.deadline).getTime();
              const deadlinePct = timeline.getPct(deadlineMs);

              // Bar starts at Now and ends at deadline
              const barLeft = Math.max(0, timeline.nowPct);
              const barWidth = Math.max(1, deadlinePct - barLeft);

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
                    <div className="w-[200px] min-w-[200px] max-w-[200px] shrink-0 sticky left-0 z-20 bg-zinc-950 px-4 py-2.5 border-r border-zinc-800 flex items-center justify-between gap-2 shadow-sm">
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
                      <span className="text-xs font-mono text-zinc-400 shrink-0">
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
                          {/* Duration text bumped to 12px (text-xs) */}
                          <span className="text-xs font-mono font-bold truncate">
                            {cdText}
                          </span>
                          <span className="hidden md:inline text-xs font-mono opacity-90 shrink-0 ml-2">
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
                        <div className="w-[200px] min-w-[200px] max-w-[200px] shrink-0 sticky left-0 z-20 bg-zinc-950 pl-6 pr-3 py-1.5 border-r border-zinc-800 flex items-center justify-between gap-1.5 shadow-sm">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {t.status === 'done' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            {t.status === 'doing' && (
                              <Play className="w-3.5 h-3.5 text-cyan-400 fill-current shrink-0" />
                            )}
                            {t.status === 'todo' && (
                              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            )}
                            {/* Task title bumped to 12px (text-xs) */}
                            <span
                              className={`text-xs font-mono truncate ${
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

                          {/* Task estimate bumped to 12px (text-xs) */}
                          <span className="text-xs font-mono text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0">
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
                            {/* Task mini-bar text bumped to 12px (text-xs) */}
                            <span className="text-xs font-mono truncate">
                              {t.title} ({estHours}h)
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
