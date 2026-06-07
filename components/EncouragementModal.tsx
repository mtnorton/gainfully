'use client';

import { useEffect } from 'react';
import { CompletionEvent } from '@/lib/types';

interface EncouragementModalProps {
  completionEvent: CompletionEvent | null;
  onClose: () => void;
}

export default function EncouragementModal({ completionEvent, onClose }: EncouragementModalProps) {
  useEffect(() => {
    if (!completionEvent) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [completionEvent, onClose]);

  if (!completionEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-violet-500/40 rounded-3xl p-8 shadow-2xl text-center animate-modal-in">

        <div className="text-5xl mb-2">✨</div>
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Task Complete!</h2>
        <p className="text-slate-400 text-sm mb-5 px-4 leading-relaxed">
          &ldquo;{completionEvent.taskName}&rdquo;
        </p>

        <div className="inline-flex items-baseline gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-7 py-3 mb-5">
          <span className="text-yellow-400 text-4xl font-black">+{completionEvent.xpEarned}</span>
          <span className="text-yellow-300 font-bold text-xl">XP</span>
        </div>

        {completionEvent.leveledUp && (
          <div className="bg-violet-600/20 border border-violet-500/40 rounded-2xl p-4 mb-4">
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-violet-300 font-bold text-lg">Level Up!</div>
            <div className="text-slate-300 text-sm">You&apos;re now Level {completionEvent.newLevel}!</div>
          </div>
        )}

        {completionEvent.newBadges.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
            <div className="text-amber-300 font-semibold text-sm mb-2">
              {completionEvent.newBadges.length === 1 ? 'New Badge Unlocked!' : 'New Badges Unlocked!'}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {completionEvent.newBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5"
                >
                  <span>{badge.icon}</span>
                  <span className="text-amber-200 text-xs font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-slate-400 text-sm italic mb-6 leading-relaxed">
          &ldquo;{completionEvent.message}&rdquo;
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base transition-colors"
        >
          Keep Going! →
        </button>
      </div>
    </div>
  );
}
