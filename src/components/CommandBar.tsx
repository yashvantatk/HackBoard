'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  CornerDownLeft, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { Hackathon, ParsedCommand } from '../types/index';
import { parseVoiceCommand } from '../lib/parser';

interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface CommandBarProps {
  hackathons: Hackathon[];
  onExecuteCommand: (parsed: ParsedCommand, rawInput: string) => void;
  externalInput?: string;
  isReadOnly?: boolean;
}

const EXAMPLE_CHIPS = [
  {
    label: '⏱️ Nebius video (2h)',
    prompt: 'demo video for Nebius takes 2 hours',
  },
  {
    label: '➕ Add task (Wispr, 1h)',
    prompt: 'add record demo for Wispr, 1 hour',
  },
  {
    label: '🎯 I have 2 hours',
    prompt: 'I have 2 hours what should I do',
  },
  {
    label: '❓ What should I do next',
    prompt: 'what should I do next',
  },
  {
    label: '⚡ Nvidia + 3 tasks',
    prompt: 'Nvidia closes October 30 at 11:59 pm. I still need the demo video, readme, and deploy.',
  },
  {
    label: "🎯 Mark readme for Navya's",
    prompt: "Mark readme for Navya's",
  },
  {
    label: '🚀 Start demo video',
    prompt: 'Start demo video',
  },
];

export const CommandBar: React.FC<CommandBarProps> = ({
  hackathons,
  onExecuteCommand,
  externalInput,
  isReadOnly = false,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activePreview, setActivePreview] = useState<ParsedCommand | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (externalInput !== undefined && externalInput !== '') {
      setInput(externalInput);
      textareaRef.current?.focus();
    }
  }, [externalInput]);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [input]);

  // Check Web Speech API support for fallback voice dictation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithSpeech = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      };
      const SpeechRecognition = 
        windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setHasSpeechSupport(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInput(prev => {
              const base = prev.trim();
              return base ? `${base} ${currentTranscript.trim()}` : currentTranscript.trim();
            });
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const runCommand = (textFromRef?: string, forceExecute = false) => {
    if (isReadOnly) return;
    const rawText = textFromRef !== undefined
      ? textFromRef
      : (textareaRef.current?.value ?? input);
    const textToSubmit = rawText.trim();
    if (!textToSubmit) return;

    const parsed = parseVoiceCommand(textToSubmit, hackathons);

    // Run command straight away when confidence is high or forced
    if (parsed.confidence === 'high' || forceExecute) {
      onExecuteCommand(parsed, textToSubmit);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
      setActivePreview(null);
    } else {
      setActivePreview(parsed);
    }

    // Stop browser mic if recording
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Global '/' hotkey to focus textarea (ignored when typing in inputs/textareas)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleBrowserDictation = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  const handleChipClick = (prompt: string) => {
    setInput(prompt);
    // Instant focus & show preview
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full space-y-3">
      {/* Command Box Container */}
      <div className={`relative rounded-2xl transition-all duration-300 p-1 ${
        isListening
          ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 shadow-[0_0_30px_rgba(6,182,212,0.35)]'
          : 'bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/60 shadow-xl shadow-black/40 hover:border-zinc-600'
      }`}>
        <div className="relative rounded-xl bg-zinc-950/90 backdrop-blur-md p-3 sm:p-4">
          {/* Top Bar with Wispr badge & Mic indicator */}
          <div className="flex items-center justify-between pb-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider ${
                isReadOnly ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                {isReadOnly ? 'Read-Only Shared Board' : 'Wispr War Room Input'}
              </span>
              {isListening && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Recording Audio...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  <kbd className="text-zinc-200">Ctrl</kbd>+<kbd className="text-zinc-200">Enter</kbd> to execute
                </span>
              )}
            </div>
          </div>

          {/* Auto-growing Textarea */}
          <div className="relative flex items-start gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              disabled={isReadOnly}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur();
                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (!isReadOnly) {
                    runCommand(textareaRef.current?.value);
                  }
                }
              }}
              placeholder={
                isReadOnly
                  ? "Viewing shared board in read-only mode. Click 'Import into my board' or 'Back to my board' to edit."
                  : "What's on my plate? Hold your Wispr key and talk."
              }
              className={`w-full resize-none bg-transparent text-sm sm:text-base font-normal text-zinc-100 placeholder-zinc-500 focus:outline-none leading-relaxed transition-all min-h-[56px] ${
                isReadOnly ? 'cursor-not-allowed opacity-60' : ''
              }`}
            />

            {/* Action buttons (Mic + Run) */}
            <div className="flex items-center gap-1.5 shrink-0 self-end">
              {hasSpeechSupport && !isReadOnly && (
                <button
                  type="button"
                  onClick={toggleBrowserDictation}
                  className={`p-2.5 rounded-xl transition flex items-center justify-center ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-800'
                  }`}
                  title={isListening ? 'Stop Mic' : 'Dictate with browser microphone'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {/* Small hint next to Execute */}
              {!isReadOnly && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 px-1.5 py-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">Enter</kbd>
                </span>
              )}

              <button
                type="button"
                onClick={() => runCommand(textareaRef.current?.value)}
                disabled={isReadOnly || !input.trim()}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                  isReadOnly || !input.trim()
                    ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 active:scale-95'
                }`}
              >
                <span>Execute</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Preview Card */}
      {/* "If the parser is sure show a small confirmation preview instead of guessing silently." */}
      {activePreview && (
        <div className="rounded-xl bg-zinc-900/90 border border-cyan-500/40 p-3 sm:p-3.5 shadow-lg shadow-cyan-950/30 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    {activePreview.confidence === 'high' ? 'High Confidence Preview' : 'Confirmation Preview'}
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">
                    {activePreview.type === 'create_hackathon' && 'Create New Hackathon'}
                    {activePreview.type === 'update_hackathon' && 'Update Hackathon'}
                    {activePreview.type === 'change_task' && 'Update Task Status'}
                    {activePreview.type === 'question' && 'War Room Query'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                  {activePreview.summary}
                </p>

                {/* Additional task pills if extracted */}
                {activePreview.tasksToCreate && activePreview.tasksToCreate.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activePreview.tasksToCreate.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono"
                      >
                        <Layers className="w-3 h-3 text-cyan-400" />
                        <span>{t.title}</span>
                        {t.estimateHours && (
                          <span className="text-cyan-400 text-[10px]">({t.estimateHours}h)</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setActivePreview(null)}
                className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              >
                Dismiss
              </button>

              <button
                onClick={() => runCommand(activePreview.rawText, true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-400/20 transition active:scale-95"
              >
                <span>Confirm & Apply</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clickable Example Chips */}
      {!isReadOnly && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-zinc-500 font-mono text-[11px] shrink-0 mr-1">
            Try rambling:
          </span>
          {EXAMPLE_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(chip.prompt)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-500/40 transition-all font-mono text-[11px] active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
