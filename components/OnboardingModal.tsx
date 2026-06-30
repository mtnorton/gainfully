'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface OnboardingModalProps {
  onClose: () => void;
}

type Step =
  | { type: 'mvuu' }
  | { type: 'info'; emoji: string; text: ReactNode };

const o = (t: string) => <span style={{ color: '#FF6B4A', fontWeight: 600 }}>{t}</span>;
const g = (t: string) => <span style={{ color: '#16A34A', fontWeight: 600 }}>{t}</span>;

const STEPS: Step[] = [
  { type: 'mvuu' },
  {
    type: 'info',
    emoji: '📋',
    text: <>Log {g('activities')} like {g('applications')} and {g('networking')}. The {o('meaningless XP')} will make it seem {o('less futile')}!</>,
  },
  {
    type: 'info',
    emoji: '🏆',
    text: <>Earn {g('badges')} and check your {g('progress')} as you settle in for another week of {o('drudgery')}!</>,
  },
  {
    type: 'info',
    emoji: '🎮',
    text: <>And there are {g('games')}! When you need to {o('blow off some steam')}.</>,
  },
];

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-modal-in overflow-hidden"
        style={{ border: '2px solid #F1E2CF' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#97887A] hover:text-[#2C2724] text-xl leading-none transition-colors z-10"
          aria-label="Skip"
        >
          ×
        </button>

        {current.type === 'mvuu' ? (
          <div className="flex flex-col items-center px-8 pt-8 pb-6 text-center">
            <img
              src="/mvuu.png"
              alt="Mvuu the jobapotamus"
              className="w-28 h-28 rounded-full object-cover mb-5"
              style={{ border: '3px solid #EDE0FF', background: '#F5F0FF' }}
            />
            <div
              className="relative rounded-2xl px-5 py-4 text-sm leading-relaxed text-[#2C2724]"
              style={{ background: '#F5F0FF', border: '2px solid #EDE0FF' }}
            >
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                style={{ background: '#F5F0FF', border: '2px solid #EDE0FF', borderBottom: 'none', borderRight: 'none' }}
              />
              <p>
                Hi, {g('superstar')}! I&apos;m Mvuu, your{' '}
                <span style={{ color: '#7C5CFC', fontWeight: 600 }}>jobapotamus</span>! Me and my
                friends will cheer you on through the {o('black void')} that is your next job
                search. {g('Go team!')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center px-8 pt-10 pb-6 text-center">
            <div className="text-6xl mb-6">{current.emoji}</div>
            <p className="text-[#2C2724] text-[15px] leading-relaxed">{current.text}</p>
          </div>
        )}

        <div className="flex items-center justify-between px-8 pb-7">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-[#7C5CFC]' : 'bg-[#EFE0CC] hover:bg-[#D4C5B0]'
                }`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
            className="px-5 py-2 rounded-xl text-white text-sm font-fredoka font-semibold transition-colors"
            style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
          >
            {isLast ? "Let's go →" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
