'use client';

import { useEffect, useState } from 'react';
import { CompletionEvent } from '@/lib/types';
import { getRandomCharacterAppearance, type CharacterAppearance } from '@/lib/encouragements';

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

  const [appearance, setAppearance] = useState<CharacterAppearance>(null);

  useEffect(() => {
    if (completionEvent) setAppearance(getRandomCharacterAppearance());
  }, [completionEvent]);

  if (!completionEvent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center animate-modal-in"
        style={{ border: '2px solid #F1E2CF' }}
      >

        {appearance ? (
          <div className="flex items-start gap-3 mb-4 text-left">
            <div
              className="w-14 h-14 rounded-full flex-shrink-0"
              style={{
                backgroundImage: `url(${appearance.imageSrc})`,
                backgroundSize: '210%',
                backgroundPosition: 'center 8%',
                border: `3px solid ${appearance.borderColor}`,
              }}
            />
            <div
              className="flex-1 rounded-2xl px-3 py-2.5 text-sm italic text-[#97887A] leading-relaxed"
              style={{ background: appearance.bgColor, border: `2px solid ${appearance.borderColor}` }}
            >
              &ldquo;{appearance.message}&rdquo;
            </div>
          </div>
        ) : (
          <div className="text-5xl mb-2">✨</div>
        )}
        <h2 className="font-fredoka font-bold text-[22px] text-[#2C2724] mb-1">{completionEvent.celebration}</h2>
        <p className="text-[#97887A] text-sm mb-5 px-4 leading-relaxed">
          &ldquo;{completionEvent.taskName}&rdquo;
        </p>

        <div className="inline-flex items-baseline gap-2 rounded-2xl px-7 py-3 mb-5" style={{ background: '#FFF7E8', border: '2px solid #FCE3B0' }}>
          <span className="font-fredoka font-black text-[#F5A300] text-4xl">+{completionEvent.xpEarned}</span>
          <span className="font-fredoka font-bold text-[#D97706] text-xl">XP</span>
        </div>

        {completionEvent.streak >= 2 && !completionEvent.newBadges.some((b) => b.id.startsWith('streak_')) && (
          <div className="rounded-2xl px-4 py-2.5 mb-4 flex items-center justify-center gap-2" style={{ background: '#FFF0E0', border: '2px solid #FFD9B8' }}>
            <span className="text-lg">🔥</span>
            <span className="font-fredoka font-bold text-[#C2410C] text-[15px]">{completionEvent.streak}-day streak</span>
          </div>
        )}

        {completionEvent.leveledUp && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#EEE7FF', border: '2px solid #D4C7FF' }}>
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-fredoka font-bold text-lg text-[#5B3FD6]">Level Up!</div>
            <div className="text-[#6f6155] text-sm">You&apos;re now Level {completionEvent.newLevel}!</div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[11px] font-semibold text-[#0369a1]" style={{ background: '#e0f2fe', border: '1.5px solid #bae6fd' }}>
              🧊 +1 Streak Freeze earned
            </div>
          </div>
        )}

        {completionEvent.newBadges.length > 0 && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#FFF7E8', border: '2px solid #FCE3B0' }}>
            <div className="font-fredoka font-bold text-sm text-[#B45309] mb-2">
              {completionEvent.newBadges.length === 1 ? 'New Badge Unlocked!' : 'New Badges Unlocked!'}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {completionEvent.newBadges.map((badge) => (
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

        {!appearance && (
          <p className="text-[#97887A] text-sm italic mb-6 leading-relaxed">
            &ldquo;{completionEvent.message}&rdquo;
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-white font-fredoka font-semibold text-base transition-colors hover:opacity-90"
          style={{ background: '#7C5CFC', boxShadow: '0 4px 0 #5B3FD6' }}
        >
          Keep Going! →
        </button>
      </div>
    </div>
  );
}
