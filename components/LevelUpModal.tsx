'use client';

import { useEffect } from 'react';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-xs bg-white rounded-3xl shadow-2xl text-center overflow-hidden"
        style={{ border: '2px solid #F1E2CF' }}
      >
        <div className="px-8 pt-8 pb-6">
          <img
            src="/mvuu.png"
            alt="Mvuu"
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
            style={{ border: '3px solid #EDE0FF', background: '#F5F0FF' }}
          />
          <div
            className="inline-block font-fredoka font-bold text-[13px] px-3 py-1 rounded-full mb-3"
            style={{ background: '#EEE7FF', color: '#7C5CFC', border: '2px solid #D4C7FF' }}
          >
            LEVEL UP
          </div>
          <div className="font-fredoka font-bold text-[48px] leading-none text-[#7C5CFC] mb-2">
            {level}
          </div>
          <p className="text-[14px] text-[#6f6155] leading-relaxed">
            You hit <span className="font-semibold text-[#2C2724]">Level {level}</span> mid-game. The grind is working.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-[#0369a1]" style={{ background: '#e0f2fe', border: '1.5px solid #bae6fd' }}>
            🧊 +1 Streak Freeze earned
          </div>
        </div>
        <div className="px-8 pb-7">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-white font-fredoka font-semibold text-[15px]"
            style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
          >
            Keep going →
          </button>
        </div>
      </div>
    </div>
  );
}
