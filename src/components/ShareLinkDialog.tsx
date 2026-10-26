'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Share2, Check, Copy, X } from 'lucide-react';

interface ShareLinkDialogProps {
  isOpen: boolean;
  shareUrl: string;
  onClose: () => void;
  onCopied?: () => void;
}

export const ShareLinkDialog: React.FC<ShareLinkDialogProps> = ({
  isOpen,
  shareUrl,
  onClose,
  onCopied,
}) => {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.select();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        success = true;
      }
    } catch {
      // Fallback to execCommand
    }

    if (!success && inputRef.current) {
      try {
        inputRef.current.select();
        document.execCommand('copy');
        success = true;
      } catch {
        // Fallback failed
      }
    }

    setCopied(true);
    onCopied?.();
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-cyan-950/20 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 flex-shrink-0">
            <Share2 className="w-5 h-5" />
          </div>

          <div className="space-y-1 pr-6">
            <h3 className="text-base font-bold text-white tracking-tight">
              Share Board Link
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your board data is compressed directly into this zero-server link. Anyone with this link can view a read-only preview.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            ref={inputRef}
            type="text"
            readOnly
            value={shareUrl}
            onClick={() => inputRef.current?.select()}
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-200 select-all focus:outline-none focus:border-cyan-500"
          />

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 shrink-0 ${
              copied
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                : 'bg-cyan-400 hover:bg-cyan-300 text-zinc-950 shadow-md shadow-cyan-400/20'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
