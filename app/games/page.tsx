'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { msUntilNextReset, formatCountdown } from '@/lib/gameDay';

const GAMES = [
  {
    href: '/games/slots',
    emoji: '🎰',
    name: 'Slots',
    description: "Can't decide what to do? Let the machine pick. One activity per day, double XP if you do it.",
    accentColor: '#7C5CFC',
    tint: '#F1ECFF',
  },
  {
    href: '/games/shot-in-the-dark',
    emoji: '🎯',
    name: 'Shot in the Dark',
    description: "Pick a target blind. Whatever XP is behind it, that's yours to claim every day.",
    accentColor: '#3B82F6',
    tint: '#E7F0FF',
  },
  {
    href: '/games/see-what-sticks',
    emoji: '🎲',
    name: 'See What Sticks',
    description: "Throw it all at the wall. Something's bound to land.",
    accentColor: '#16A34A',
    tint: '#E4F8EC',
  },
  {
    href: '/games/was-i-ghosted',
    emoji: '👻',
    name: 'Was I Ghosted?',
    description: "One old interaction per day. Time to face the silence and call it what it is.",
    accentColor: '#6B7686',
    tint: '#EEF1F6',
  },
  {
    href: '/games/momentum-lab',
    emoji: '🧪',
    name: 'Momentum Lab',
    description: "One networking contact a day. The machine picks your follow-up move. Science.",
    accentColor: '#0D9488',
    tint: '#DCF6F1',
  },
  {
    href: '/games/hot-or-cold',
    emoji: '🌡️',
    name: 'Hot or Cold',
    description: "Pick a target company, set a goal, and log every outreach. Finish in one day to earn a bonus.",
    accentColor: '#F4543C',
    tint: '#FFE7E3',
  },
  {
    href: '/games/fact-of-the-day',
    emoji: '💡',
    name: 'Fact of the Day',
    description: "Build your professional knowledge. One insight per day, 25 XP for staying sharp.",
    accentColor: '#B45309',
    tint: '#FEF3C7',
  },
];

export default function GamesPage() {
  const [mounted, setMounted] = useState(false);
  const [msLeft, setMsLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setMsLeft(msUntilNextReset());
    const id = setInterval(() => setMsLeft(msUntilNextReset()), 1000);
    return () => clearInterval(id);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="font-fredoka font-bold text-[24px] text-[#2C2724] mb-1">Games</h1>
          <p className="text-[13px] text-[#97887A]">Take a break. Try your luck. The job search will still be there.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game) => (
            <Link
              key={game.href}
              href={game.href}
              className="group flex flex-col bg-white rounded-[20px] p-[18px] transition-all duration-200 hover:scale-[1.02]"
              style={{ border: '2px solid #F1E2CF', borderBottom: `5px solid ${game.accentColor}` }}
            >
              <div
                className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[25px] mb-3 flex-shrink-0"
                style={{ background: game.tint }}
              >
                {game.emoji}
              </div>
              <h2 className="font-fredoka font-bold text-[17px] text-[#2C2724]">{game.name}</h2>
              <p className="text-[12px] text-[#97887A] leading-snug flex-1 mt-1">{game.description}</p>
              <div className="font-fredoka font-bold text-[14px] mt-3" style={{ color: game.accentColor }}>
                Play →
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-[#A99C8D] text-xs mt-6">
          Resets in{' '}
          <span className="text-[#6f6155] font-mono tabular-nums">{formatCountdown(msLeft)}</span>
          {' '}· midnight ET
        </p>
      </main>
    </div>
  );
}
