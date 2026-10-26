'use client';

import React, { useEffect } from 'react';
import { X, Command, Mic } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      // Toggle modal with ? if not typing in input or textarea
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }

      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      keys: ['Ctrl', 'Enter'],
      macKeys: ['⌘', 'Enter'],
      description: 'Execute voice dictation / command from Command Bar',
      badge: 'Primary',
    },
    {
      keys: ['K'],
      description: 'Switch between Cards view and Kanban Board view',
      badge: 'View',
    },
    {
      keys: ['T'],
      description: 'Switch to Operations Timeline view',
      badge: 'View',
    },
    {
      keys: ['N'],
      description: 'Launch What Now focus intelligence & Pomodoro sprint',
      badge: 'Focus',
    },
    {
      keys: ['R'],
      description: 'Open Rules Reader to parse guidelines & extract tasks',
      badge: 'Rules',
    },
    {
      keys: ['/'],
      description: 'Quickly focus the Command Bar',
      badge: 'Navigation',
    },
    {
      keys: ['?'],
      description: 'Toggle this keyboard shortcut guide',
      badge: 'Help',
    },
    {
      keys: ['Esc'],
      description: 'Dismiss open modals or close sheets',
      badge: 'Escape',
    },
    {
      keys: ['Drag & Drop'],
      description: 'Drag tasks between To-Do, Doing, and Done in Kanban view',
      badge: 'Kanban',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl shadow-cyan-950/40 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                War Room Shortcuts
              </h2>
              <p className="text-xs text-zinc-400">Master Hackboard hands-free with Wispr Flow</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="mt-4 space-y-3">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-[10px]">
                  {sc.badge}
                </span>
                <span className="text-sm text-zinc-300">{sc.description}</span>
              </div>

              <div className="flex items-center gap-1">
                {sc.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-1 text-xs font-mono font-semibold text-zinc-200 bg-zinc-800 border border-zinc-600 rounded-md shadow-inner"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tip Footer */}
        <div className="mt-5 p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-transparent border border-cyan-800/30 text-xs text-zinc-300 flex items-start gap-2.5">
          <Mic className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 font-semibold">Wispr Flow Voice Tip:</strong> Hold your designated Wispr hotkey anywhere to talk naturally. Release to paste into Hackboard, then press <kbd className="px-1 py-0.5 text-[10px] font-mono bg-zinc-800 border border-zinc-700 rounded">Ctrl+Enter</kbd> to parse!
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
