'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  CheckSquare, 
  Square, 
  Calendar, 
  Users, 
  Video, 
  Code, 
  Globe, 
  BookOpen, 
  Image as ImageIcon, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { extractHackathonRules } from '../lib/rulesExtractor';
import { ExtractedChecklistItem, Hackathon, Task } from '../types/index';
import { triggerCompletionConfetti } from '../lib/confetti';

interface RulesReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHackathon: (hackathon: Hackathon) => void;
}

const SAMPLE_RULES_TEMPLATE = `Nebius Cloud & NVIDIA NIM Global Hackathon
Submissions close on October 30 at 11:59 pm IST. Judging results on November 2 at 5:00 pm IST.
Team Size: Solo or teams of up to 4 participants.

Submission Requirements:
1. Demo Video: You must provide a video demo under 3 minutes walking through the working app and architecture.
2. Code: Public GitHub repository with clean commit history and open source license.
3. Live Link: Hosted deployment on Vercel or public cloud endpoint.
4. README: Comprehensive documentation with setup instructions and NVIDIA NIM microservice benchmarks.
5. Screenshots & Architecture: Include UI screenshots and system diagrams.`;

export const RulesReaderModal: React.FC<RulesReaderModalProps> = ({
  isOpen,
  onClose,
  onAddHackathon,
}) => {
  const [rawText, setRawText] = useState('');
  const [hackathonName, setHackathonName] = useState('');
  const [deadlines, setDeadlines] = useState<Array<{ isoString: string; displayText: string; rawText: string }>>([]);
  const [selectedDeadline, setSelectedDeadline] = useState('');
  const [checklist, setChecklist] = useState<ExtractedChecklistItem[]>([]);
  const [teamSizeRule, setTeamSizeRule] = useState<string | undefined>();
  const [hasExtracted, setHasExtracted] = useState(false);

  // Auto-analyze when raw text changes
  useEffect(() => {
    if (rawText.trim().length > 20) {
      const extracted = extractHackathonRules(rawText);
      setHackathonName(extracted.hackathonName);
      setDeadlines(extracted.deadlines);
      setSelectedDeadline(extracted.selectedDeadlineIso);
      setChecklist(extracted.checklist);
      setTeamSizeRule(extracted.teamSizeRule);
      setHasExtracted(true);
    } else {
      setHasExtracted(false);
    }
  }, [rawText]);

  if (!isOpen) return null;

  const handleToggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUseSample = () => {
    setRawText(SAMPLE_RULES_TEMPLATE);
  };

  const handleCreateHackathon = () => {
    const finalName = hackathonName.trim() || 'Imported Hackathon';
    const finalDeadline = selectedDeadline || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const selectedTasks = checklist.filter((item) => item.selected);
    const tasks: Task[] = selectedTasks.map((item, idx) => ({
      id: `task-rules-${Date.now()}-${idx}`,
      title: item.title,
      status: 'todo',
      estimateHours: item.estimateHours || 1,
      createdAt: new Date().toISOString(),
    }));

    const newHackathon: Hackathon = {
      id: `hack-rules-${Date.now()}`,
      name: finalName,
      deadline: finalDeadline,
      tasks,
      createdAt: new Date().toISOString(),
      accentColor: '#06b6d4',
    };

    onAddHackathon(newHackathon);
    triggerCompletionConfetti();
    onClose();
  };

  const getCategoryIcon = (cat: ExtractedChecklistItem['category']) => {
    switch (cat) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-cyan-400" />;
      case 'code':
        return <Code className="w-3.5 h-3.5 text-emerald-400" />;
      case 'deploy':
        return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      case 'docs':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'media':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      case 'team':
        return <Users className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl shadow-cyan-950/40 text-zinc-100 flex flex-col space-y-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Hackathon Rules Reader
              </h2>
              <p className="text-xs text-zinc-400">
                Paste rules or submission text to auto-extract deadlines and checklists
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
          {/* Textarea for Rules */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="font-mono text-[11px] uppercase font-bold text-zinc-300">
                Paste Guidelines / Rules Text:
              </label>
              <button
                type="button"
                onClick={handleUseSample}
                className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[11px]"
              >
                Insert Sample Rules Template
              </button>
            </div>

            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste submission criteria, requirements, or Devpost rules here..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition leading-relaxed font-sans"
            />
          </div>

          {/* Extracted Details Preview */}
          {hasExtracted && (
            <div className="rounded-xl bg-zinc-950/70 border border-cyan-500/40 p-4 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  Extracted Preview
                </span>
                {teamSizeRule && (
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    {teamSizeRule}
                  </span>
                )}
              </div>

              {/* Editable Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Hackathon Name</label>
                <input
                  type="text"
                  value={hackathonName}
                  onChange={(e) => setHackathonName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Deadlines Section */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {deadlines.length > 1
                      ? `Found ${deadlines.length} dates. Pick final deadline:`
                      : 'Detected Deadline:'}
                  </span>
                </label>

                {deadlines.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">
                    No explicit deadline found. Will default to 3 days from now.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {deadlines.map((dl, i) => (
                      <label
                        key={i}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          selectedDeadline === dl.isoString
                            ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-200'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deadlinePicker"
                          value={dl.isoString}
                          checked={selectedDeadline === dl.isoString}
                          onChange={() => setSelectedDeadline(dl.isoString)}
                          className="accent-cyan-400"
                        />
                        <span className="font-mono font-bold">{dl.displayText}</span>
                        <span className="text-[10px] text-zinc-500 italic truncate">
                          (matches &ldquo;{dl.rawText}&rdquo;)
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Checklist Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Submission Tasks Checklist ({checklist.filter((c) => c.selected).length}/{checklist.length} checked):</span>
                  <span className="text-[10px] text-zinc-500">Tick to include as task</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        item.selected
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 opacity-60'
                      }`}
                    >
                      <button type="button" className="mt-0.5 shrink-0 text-cyan-400">
                        {item.selected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(item.category)}
                          <span className="font-semibold leading-tight truncate">{item.title}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-zinc-800 text-zinc-400 shrink-0">
                            {item.estimateHours}h
                          </span>
                        </div>
                        {item.detail && (
                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{item.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreateHackathon}
            disabled={!hasExtracted}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-cyan-400/20 transition active:scale-95"
          >
            <span>Add as Hackathon with Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
