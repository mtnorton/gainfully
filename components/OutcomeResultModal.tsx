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
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center animate-modal-in"
        style={{ border: isResilience ? '2px solid #EFE0CC' : '2px solid #F1E2CF' }}
      >
        <div className="text-5xl mb-3">{config.icon}</div>
        <h2 className="font-fredoka font-bold text-xl text-[#2C2724] mb-2">
          {config.label} Logged
        </h2>

        {result.xpAwarded > 0 && (
          <div
            className="inline-flex items-baseline gap-2 rounded-2xl px-6 py-3 mb-5"
            style={isResilience
              ? { background: '#F2E8DB', border: '2px solid #EFE0CC' }
              : { background: '#FFF7E8', border: '2px solid #FCE3B0' }
            }
          >
            <span className={`font-fredoka font-black text-3xl ${isResilience ? 'text-[#7C6F63]' : 'text-[#F5A300]'}`}>
              +{result.xpAwarded}
            </span>
            <span className={`font-fredoka font-bold text-lg ${isResilience ? 'text-[#97887A]' : 'text-[#D97706]'}`}>
              {isResilience ? 'Resilience XP' : 'XP'}
            </span>
          </div>
        )}

        {result.leveledUp && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#EEE7FF', border: '2px solid #D4C7FF' }}>
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-fredoka font-bold text-[#5B3FD6]">Level Up!</div>
            <div className="text-[#6f6155] text-sm">You&apos;re now Level {result.newLevel}!</div>
          </div>
        )}

        {result.newBadges.length > 0 && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#FFF7E8', border: '2px solid #FCE3B0' }}>
            <div className="font-fredoka font-bold text-[#B45309] text-sm mb-2">
              {result.newBadges.length === 1 ? 'Badge Unlocked!' : 'Badges Unlocked!'}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {result.newBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                  style={{ background: '#FFF0CD', border: '2px solid #FCE3B0' }}
                >
                  <span>{badge.icon}</span>
                  <span className="text-[#B45309] text-xs font-bold">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[#97887A] text-sm italic mb-6 leading-relaxed">
          &ldquo;{result.message}&rdquo;
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-fredoka font-semibold text-base transition-colors text-white"
          style={isResilience
            ? { background: '#F2E8DB', color: '#6f6155', boxShadow: '0 3px 0 #EFE0CC' }
            : { background: '#7C5CFC', boxShadow: '0 4px 0 #5B3FD6' }
          }
        >
          {isResilience ? 'Keep Going →' : 'Awesome! →'}
        </button>
      </div>
    </div>
  );
}
