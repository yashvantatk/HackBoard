'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Hackathon } from '../types/index';
import { formatISTShort, formatISTGantt, getCountdown } from '../lib/time';
import { Calendar, Clock, CheckCircle2, Play } from 'lucide-react';
import mermaid from 'mermaid';

interface TimelineViewProps {
  hackathons: Hackathon[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ hackathons }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);

  // Initialize mermaid once
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'monospace',
      themeVariables: {
        darkMode: true,
        background: '#09090b',
        primaryColor: '#06b6d4',
        primaryTextColor: '#f4f4f5',
        primaryBorderColor: '#0891b2',
        lineColor: '#52525b',
        secondaryColor: '#10b981',
        tertiaryColor: '#27272a',
      },
      gantt: {
        useMaxWidth: false,
        axisFormat: '%a %d',
        tickInterval: '1day',
        barHeight: 28,
        barGap: 8,
        topPadding: 45,
        leftPadding: 140,
        gridLineStartPadding: 35,
        fontSize: 12,
        sectionFontSize: 13,
      },
    });
  }, []);

  // Generate Mermaid Gantt Chart syntax and render SVG
  useEffect(() => {
    if (hackathons.length === 0) {
      setSvgContent('');
      return;
    }

    const now = new Date();
    const cleanStr = (s: string) => s.replace(/[:;,"'#]/g, ' ').replace(/\s+/g, ' ').trim();

    const lines: string[] = [
      'gantt',
      '    title Hackboard War Room Operations Timeline',
      '    dateFormat YYYY-MM-DD-HH:mm',
      '    axisFormat %a %d',
      '    tickInterval 1day',
      '    todayMarker stroke-width:2px,stroke:#06b6d4,opacity:0.9',
    ];

    let taskIndex = 0;

    for (const h of hackathons) {
      const hName = cleanStr(h.name);
      lines.push(`    section ${hName}`);

      const deadlineDate = new Date(h.deadline);
      const tasks = h.tasks || [];

      if (tasks.length === 0) {
        // Fallback bar for hackathon without tasks
        const start = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000);
        lines.push(`    Deadline Milestone :crit, active, task_${taskIndex++}, ${formatISTGantt(start)}, ${formatISTGantt(deadlineDate)}`);
        continue;
      }

      // Schedule tasks sequentially backwards from deadline or forward from now
      let cumulativeHours = 0;
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const rawTitle = cleanStr(task.title);
        // Cut long task names with an ellipsis to keep Mermaid chart readable
        const tTitle = rawTitle.length > 28 ? rawTitle.substring(0, 25) + '...' : rawTitle;
        const estHours = task.estimateHours && task.estimateHours > 0 ? task.estimateHours : 1;

        // Calculate a realistic time window
        let taskStart: Date;
        let taskEnd: Date;

        if (task.status === 'done') {
          // Completed task in the past
          taskEnd = new Date(now.getTime() - (tasks.length - i) * 3 * 60 * 60 * 1000);
          taskStart = new Date(taskEnd.getTime() - estHours * 60 * 60 * 1000);
        } else if (task.status === 'doing') {
          // Currently in progress
          taskStart = new Date(now.getTime() - 30 * 60 * 1000);
          taskEnd = new Date(taskStart.getTime() + estHours * 60 * 60 * 1000);
        } else {
          // To-do task placed between now and deadline
          taskStart = new Date(now.getTime() + cumulativeHours * 60 * 60 * 1000);
          cumulativeHours += estHours;
          taskEnd = new Date(taskStart.getTime() + estHours * 60 * 60 * 1000);
          if (taskEnd.getTime() > deadlineDate.getTime()) {
            taskEnd = deadlineDate;
          }
        }

        const id = `t_${taskIndex++}`;
        const modifier = task.status === 'done' ? 'done' : task.status === 'doing' ? 'active' : 'crit';

        lines.push(
          `    ${tTitle} :${modifier}, ${id}, ${formatISTGantt(taskStart)}, ${formatISTGantt(taskEnd)}`
        );
      }
    }

    const diagramDefinition = lines.join('\n');

    const renderChart = async () => {
      try {
        const uniqueId = `mermaid-gantt-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, diagramDefinition);
        setSvgContent(svg);
        setRenderError(null);
      } catch (err: unknown) {
        console.warn('Mermaid rendering issue, using visual fallback:', err);
        setRenderError('Mermaid rendering issue');
      }
    };

    renderChart();
  }, [hackathons]);

  if (hackathons.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-zinc-400">
        No active hackathons to plot on the timeline.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-zinc-200">
            <strong>Mermaid Gantt Timeline</strong> • All Hackathons &amp; Tasks this week
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" /> Doing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> To-Do / Deadline
          </span>
        </div>
      </div>

      {/* Mermaid Rendered Gantt Chart Container */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6 overflow-x-auto shadow-xl no-scrollbar min-h-[460px] flex flex-col justify-center">
        {!renderError && svgContent ? (
          <div
            ref={containerRef}
            className="mermaid-wrapper w-full min-w-full flex items-center justify-center min-h-[400px] [&_svg]:w-full [&_svg]:min-w-[650px] [&_svg]:h-auto [&_svg]:min-h-[380px]"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          /* High-resilience Visual Gantt Bar Fallback */
          <div className="space-y-6">
            {hackathons.map((h) => {
              const cd = getCountdown(h.deadline);
              return (
                <div key={h.id} className="space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <h4 className="text-sm font-bold text-white font-mono">{h.name}</h4>
                    <span className="text-xs font-mono text-cyan-400">
                      Closes {formatISTShort(h.deadline)} ({cd.days}d {cd.hours}h left)
                    </span>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {h.tasks.map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono ${
                          t.status === 'done'
                            ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500 line-through'
                            : t.status === 'doing'
                            ? 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {t.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                          {t.status === 'doing' && <Play className="w-3.5 h-3.5 text-cyan-400 fill-current flex-shrink-0" />}
                          {t.status === 'todo' && <Clock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />}
                          <span className="truncate max-w-[280px] sm:max-w-[480px]" title={t.title}>{t.title}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 flex-shrink-0">{t.estimateHours || 1}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
