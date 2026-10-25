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
  const [renderKey, setRenderKey] = useState(0);

  // Re-render when window resizes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setRenderKey((k) => k + 1);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Initialize mermaid with larger font sizes, taller bar height, and useMaxWidth: false
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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
        barHeight: 36,
        barGap: 10,
        topPadding: 50,
        leftPadding: 180,
        gridLineStartPadding: 40,
        fontSize: 14,
        sectionFontSize: 16,
        numberSectionStyles: 4,
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
      '    todayMarker stroke-width:3px,stroke:#06b6d4,opacity:0.95',
    ];

    let taskIndex = 0;

    for (const h of hackathons) {
      const hName = cleanStr(h.name);
      lines.push(`    section ${hName}`);

      const deadlineDate = new Date(h.deadline);
      const tasks = h.tasks || [];

      if (tasks.length === 0) {
        // Fallback milestone starting at current time ending at deadline
        lines.push(`    Deadline Milestone :crit, active, task_${taskIndex++}, ${formatISTGantt(now)}, ${formatISTGantt(deadlineDate)}`);
        continue;
      }

      // Schedule tasks starting at the current time so bars spread horizontally across the container
      let cumulativeHours = 0;
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const rawTitle = cleanStr(task.title);
        // Truncate long task names with ellipsis for crisp readability
        const tTitle = rawTitle.length > 26 ? rawTitle.substring(0, 23) + '...' : rawTitle;
        const estHours = task.estimateHours && task.estimateHours > 0 ? task.estimateHours : 1;

        // Start from current time (now) so the chart spans from now to deadline
        const taskStart = new Date(now.getTime() + cumulativeHours * 60 * 60 * 1000);
        cumulativeHours += estHours;
        let taskEnd = new Date(now.getTime() + cumulativeHours * 60 * 60 * 1000);

        if (taskEnd.getTime() > deadlineDate.getTime()) {
          taskEnd = deadlineDate;
        }
        if (taskEnd.getTime() <= taskStart.getTime()) {
          taskEnd = new Date(taskStart.getTime() + 30 * 60 * 1000);
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
        
        // Ensure SVG scales to 100% of container width and remove restrictive inline max-width
        const fluidSvg = svg
          .replace(/max-width:\s*[^;"]+;?/gi, '')
          .replace(/<svg\s+([^>]*?)style="([^"]*?)"/gi, (match, prefix, style) => {
            const cleanStyle = style.replace(/max-width:\s*[^;]+;?/gi, '').trim();
            return `<svg ${prefix} style="${cleanStyle}; width: 100%; min-width: 100%; display: block;"`;
          });

        setSvgContent(fluidSvg);
        setRenderError(null);
      } catch (err: unknown) {
        console.warn('Mermaid rendering issue, using visual fallback:', err);
        setRenderError('Mermaid rendering issue');
      }
    };

    renderChart();
  }, [hackathons, renderKey]);

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
            className="mermaid-wrapper w-full overflow-hidden [&_svg]:!w-full [&_svg]:!max-w-none [&_svg]:!h-auto [&_svg]:block"
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
