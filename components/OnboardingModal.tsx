'use client';

import { useEffect, useState } from 'react';

interface OnboardingModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: '💼',
    title: 'Welcome to Gainfully',
    body: 'Your job search, gamified. Turn every application, networking call, and prep session into XP — and watch your progress stack up.',
    extra: null,
  },
  {
    icon: '⚡',
    title: 'Complete Tasks, Earn XP',
    body: 'Add a task for every job search action and complete it to earn XP and level up. Six categories to track — including self-care, because you can\'t search on empty.',
    extra: (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {[
          { icon: '📄', label: 'Application' },
          { icon: '🤝', label: 'Networking' },
          { icon: '📚', label: 'Interview Prep' },
          { icon: '❤️', label: 'Self-Care' },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
          >
            {icon} {label}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: '🏆',
    title: 'Track Results, Share Wins',
    body: 'Log outcomes on any task — interviews, offers, even rejections. The hard ones earn Resilience XP too. Check your weekly Progress page and share your momentum.',
    extra: (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {[
          { icon: '📅', label: 'Interview' },
          { icon: '🎉', label: 'Offer' },
          { icon: '💪', label: 'Rejection' },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
          >
            {icon} {label}
          </span>
        ))}
      </div>
    ),
  },
];

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-violet-500/40 rounded-3xl p-8 shadow-2xl text-center animate-modal-in">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors"
          aria-label="Skip"
        >
          ×
        </button>

        <div className="text-5xl mb-4">{current.icon}</div>
        <h2 className="text-xl font-bold text-slate-100 mb-3">{current.title}</h2>
        <p className="text-slate-400 text-sm leading-relaxed">{current.body}</p>

        {current.extra}

        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-violet-400' : 'bg-slate-700 hover:bg-slate-600'
                }`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            {isLast ? 'Start My Search →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
