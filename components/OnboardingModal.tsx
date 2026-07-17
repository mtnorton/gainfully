'use client';

import { useEffect, useState } from 'react';

interface OnboardingModalProps {
  onClose: () => void;
}

const o = (t: string) => <span style={{ color: '#FF6B4A', fontWeight: 700 }}>{t}</span>;
const g = (t: string) => <span style={{ color: '#16A34A', fontWeight: 700 }}>{t}</span>;
const p = (t: string) => <span style={{ color: '#7C5CFC', fontWeight: 700 }}>{t}</span>;
const a = (t: string) => <span style={{ color: '#B45309', fontWeight: 700 }}>{t}</span>;

type SpotlightStep = { type: 'spotlight'; btnId: string; text: React.ReactNode };
type CardStep = { type: 'card' };
type Step = { type: 'welcome' } | SpotlightStep | CardStep;

const STEPS: Step[] = [
  { type: 'welcome' },
  {
    type: 'spotlight',
    btnId: 'log-activity-btn',
    text: (
      <>
        {o('Applied')} somewhere? {o('Followed up')}?{' '}
        {o('Doom-scrolled LinkedIn')} for 20 minutes?{' '}
        {g('Log it')} — the {p('meaningless XP')} will make it seem {g('less futile')}!
      </>
    ),
  },
  {
    type: 'spotlight',
    btnId: 'log-result-btn',
    text: (
      <>
        The {g('updates count too')}. Especially the {o('bad news')} —
        that&apos;s how we track the ones that {a('got away')}{' '}
        (and {g('laugh about it later')}).
      </>
    ),
  },
  { type: 'card' },
];

function useSpotlight(btnId: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!btnId) return;
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.scrollIntoView({ block: 'center' });
    btn.style.position = 'relative';
    btn.style.zIndex = '51';
    btn.style.boxShadow = '0 0 0 5px rgba(124,92,252,0.4), 0 0 32px rgba(124,92,252,0.55)';
    btn.style.borderRadius = '12px';

    const frame = requestAnimationFrame(() => setRect(btn.getBoundingClientRect()));

    return () => {
      cancelAnimationFrame(frame);
      btn.style.position = '';
      btn.style.zIndex = '';
      btn.style.boxShadow = '';
      btn.style.borderRadius = '';
    };
  }, [btnId]);

  return rect;
}

interface SpotlightCardProps {
  btnId: string;
  text: React.ReactNode;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onClose: () => void;
}

function SpotlightCard({ btnId, text, step, totalSteps, onNext, onClose }: SpotlightCardProps) {
  const rect = useSpotlight(btnId);
  const isLast = step === totalSteps - 1;

  const tooltipWidth = 304;
  const gap = 14;
  const rightEdge = rect ? window.innerWidth - rect.right : 16;
  const tooltipTop = rect ? rect.bottom + gap : window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      <div
        className="absolute z-10 rounded-[22px] p-5 shadow-2xl"
        style={{
          width: tooltipWidth,
          top: tooltipTop,
          right: Math.max(12, rightEdge),
          background: '#F5F0FF',
          border: '2px solid #D4C7FF',
        }}
      >
        <div
          className="absolute -top-[9px] right-6 w-4 h-4 rotate-45"
          style={{ background: '#F5F0FF', border: '2px solid #D4C7FF', borderBottom: 'none', borderRight: 'none' }}
        />

        <p className="text-[#2C2724] text-[14px] leading-relaxed font-medium">{text}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[#7C5CFC]' : 'bg-[#D4C7FF]'}`}
              />
            ))}
          </div>
          <button
            onClick={isLast ? onClose : onNext}
            className="px-5 py-2 rounded-xl text-white text-sm font-fredoka font-semibold"
            style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
          >
            {isLast ? "Let's go →" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const advance = () => isLast ? onClose() : setStep((s) => s + 1);

  // ── Spotlight steps ────────────────────────────────────────────────────────
  if (current.type === 'spotlight') {
    return (
      <SpotlightCard
        btnId={current.btnId}
        text={current.text}
        step={step}
        totalSteps={STEPS.length}
        onNext={advance}
        onClose={onClose}
      />
    );
  }

  // ── Google sign-in card (step 3) ───────────────────────────────────────────
  if (current.type === 'card') {
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

          <div className="flex flex-col items-center px-8 pt-8 pb-6 text-center">
            <div className="text-6xl mb-5">🔗</div>
            <div
              className="relative rounded-2xl px-5 py-4 text-sm leading-relaxed text-[#2C2724]"
              style={{ background: '#FFF7E8', border: '2px solid #FCE3B0' }}
            >
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                style={{ background: '#FFF7E8', border: '2px solid #FCE3B0', borderBottom: 'none', borderRight: 'none' }}
              />
              <p>
                {p('Connect Google')} and Mvuu remembers your {g('streak')}, your{' '}
                {o('XP')}, your whole {a('glorious mess')}.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-8 pb-7">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[#7C5CFC]' : 'bg-[#EFE0CC]'}`}
                />
              ))}
            </div>
            <button
              onClick={() => {
                onClose();
                setTimeout(() => document.querySelector<HTMLButtonElement>('[aria-label="User profile"]')?.click(), 100);
              }}
              className="px-5 py-2 rounded-xl text-white text-sm font-fredoka font-semibold transition-colors"
              style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
            >
              Connect →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 0: Mvuu welcome ───────────────────────────────────────────────────
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

        <div className="flex items-center justify-between px-8 pb-7">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[#7C5CFC]' : 'bg-[#EFE0CC]'}`}
              />
            ))}
          </div>
          <button
            onClick={advance}
            className="px-5 py-2 rounded-xl text-white text-sm font-fredoka font-semibold transition-colors"
            style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
