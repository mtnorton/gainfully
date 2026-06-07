'use client';

import { useEffect } from 'react';
import { OutcomeResult, OUTCOME_CONFIG } from '@/lib/outcomes';

interface OutcomeResultModalProps {
  result: OutcomeResult | null;
  onClose: () => void;
}

export default function OutcomeResultModal({ result, onClose }: OutcomeResultModalProps) {
  useEffect(() => {
    if (!result) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [result, onClose]);

  if (!result) return null;

  const config = OUTCOME_CONFIG[result.type];
  const isResilience = config.sentiment === 'resilience';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center animate-modal-in border ${
          isResilience
            ? 'bg-slate-900 border-slate-700/60'
            : 'bg-slate-900 border-violet-500/40'
        }`}
      >
        <div className="text-5xl mb-3">{config.icon}</div>
        <h2
          className={`text-xl font-bold mb-2 ${
            isResilience ? 'text-slate-300' : 'text-slate-100'
          }`}
        >
          {config.label} Logged
        </h2>

        {result.xpAwarded > 0 && (
          <div
            className={`inline-flex items-baseline gap-2 rounded-2xl px-6 py-3 mb-5 border ${
              isResilience
                ? 'bg-slate-700/30 border-slate-600/40'
                : 'bg-yellow-400/10 border-yellow-400/30'
            }`}
          >
            <span
              className={`text-3xl font-black ${
                isResilience ? 'text-slate-300' : 'text-yellow-400'
              }`}
            >
              +{result.xpAwarded}
            </span>
            <span
              className={`font-bold text-lg ${
                isResilience ? 'text-slate-400' : 'text-yellow-300'
              }`}
            >
              {isResilience ? 'Resilience XP' : 'XP'}
            </span>
          </div>
        )}

        {result.leveledUp && (
          <div className="bg-violet-600/20 border border-violet-500/40 rounded-2xl p-4 mb-4">
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-violet-300 font-bold">Level Up!</div>
            <div className="text-slate-300 text-sm">You&apos;re now Level {result.newLevel}!</div>
          </div>
        )}

        {result.newBadges.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
            <div className="text-amber-300 font-semibold text-sm mb-2">
              {result.newBadges.length === 1 ? 'Badge Unlocked!' : 'Badges Unlocked!'}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {result.newBadges.map((badge) => (
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

        <p
          className={`text-sm italic mb-6 leading-relaxed ${
            isResilience ? 'text-slate-300' : 'text-slate-400'
          }`}
        >
          &ldquo;{result.message}&rdquo;
        </p>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-2xl font-semibold text-base transition-colors ${
            isResilience
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {isResilience ? 'Keep Going →' : 'Awesome! →'}
        </button>
      </div>
    </div>
  );
}
