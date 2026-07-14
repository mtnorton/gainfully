'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { getLevel } from '@/lib/gameLogic';
import { TaskCategory } from '@/lib/types';
import { getGameDay } from '@/lib/gameDay';
import { loadState, saveState, awardFreezeToken } from '@/lib/supabase/storage';
import LevelUpModal from '@/components/LevelUpModal';

const FACT_KEY = 'gainfully-fact-day';

const FACTS = [
  "Despite weighing up to 3,200 kg, hippos can run at speeds of up to 30 km/h on land — faster than most humans. 🦛",
  "Hippos secrete a reddish-orange fluid called 'blood sweat' that functions as both a natural sunscreen and an antibiotic. Science has not yet replicated it. 🦛",
  "Hippos spend up to 16 hours a day submerged in water to regulate their body temperature, since they have no functional sweat glands. 🦛",
  "Despite being strict herbivores, hippos are responsible for an estimated 500 human deaths per year, making them Africa's deadliest large land animal. 🦛",
  "The word 'hippopotamus' comes from ancient Greek for 'river horse,' despite hippos being more closely related to whales than to any horse. 🦛",
  "A group of hippos is called a 'bloat.' This is a real scientific term and it is perfect. 🦛",
  "Baby hippos are born underwater and must swim to the surface to take their first breath. They can also nurse while fully submerged. 🦛",
  "Hippos can hold their breath for up to five minutes and sleep underwater, rising to breathe without ever waking up. 🦛",
  "Hippos and whales share a common ancestor from roughly 55 million years ago, making them more closely related to dolphins than to pigs. 🦛",
  "Hippos communicate through a sound called a 'wheeze honk' that travels simultaneously through air and water, audible to both surface and submerged hippos at once. 🦛",
];

function getDailyFactIndex(date: string): number {
  let hash = 0;
  for (const ch of date) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % FACTS.length;
}

function trackEvent(name: string, params?: Record<string, string | number>) {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', name, params);
}

export default function FactOfTheDayPage() {
  const [mounted, setMounted] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  const today = getGameDay();
  const fact = FACTS[getDailyFactIndex(today)];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FACT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.date === today && saved.claimed) setClaimed(true);
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, [today]);

  async function handleClaim() {
    if (claimed) return;
    const XP = 25;
    try {
      const data = await loadState();
      const state: Record<string, unknown> = data ?? { tasks: [], totalXP: 0, badges: [], customActivities: [], xpOverrides: {} };
      const now = new Date().toISOString();
      state.tasks = [
        {
          id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: 'Fact of the Day',
          category: 'selfcare' as TaskCategory,
          xp: XP,
          completed: true,
          completedAt: now,
          createdAt: now,
        },
        ...((state.tasks as unknown[]) ?? []),
      ];
      const oldXP = (state.totalXP as number) ?? 0;
      const newXP = oldXP + XP;
      state.totalXP = newXP;
      await saveState(state);
      if (getLevel(newXP) > getLevel(oldXP)) {
        setLevelUpTo(getLevel(newXP));
        awardFreezeToken().catch(() => {});
      }
    } catch { /* ignore */ }

    localStorage.setItem(FACT_KEY, JSON.stringify({ date: today, claimed: true }));
    setClaimed(true);
    trackEvent('game_claimed', { game: 'fact_of_day', xp: 25 });
  }

  if (!mounted) return null;

  return (
    <>
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-sm mx-auto px-4 py-8">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-sm text-[#97887A] hover:text-[#2C2724] transition-colors mb-8"
        >
          ← Back to Games
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-fredoka font-bold text-[24px] text-[#2C2724] mb-2">💡 Fact of the Day</h1>
          <p className="text-[#97887A] text-sm leading-relaxed">Build your professional knowledge.</p>
        </div>

        {/* Fact card */}
        <div
          className="bg-white rounded-2xl p-6 mb-5"
          style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #B45309' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#B45309] mb-4">
            Today&apos;s Insight
          </p>
          <p className="text-[#2C2724] text-[15px] leading-relaxed font-medium">{fact}</p>
          <p className="text-[#C4B5A5] text-[11px] mt-5">Source: nature</p>
        </div>

        {/* Claim card */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '2px solid #F1E2CF' }}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-bold text-[#6f6155] text-sm">Professional development</span>
            <span className="font-fredoka font-black text-[#F5A300] text-2xl">25 XP</span>
          </div>
          <p className="text-[#A99C8D] text-xs mb-4">
            {claimed
              ? 'Knowledge acquired · come back tomorrow'
              : 'You absorbed this. Claim your XP.'}
          </p>

          {claimed ? (
            <div
              className="w-full py-2.5 rounded-xl text-[#7C6F63] text-sm font-semibold text-center"
              style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}
            >
              ✓ Claimed
            </div>
          ) : (
            <button
              onClick={handleClaim}
              className="w-full py-2.5 rounded-xl text-white font-fredoka font-semibold text-sm transition-colors"
              style={{ background: '#B45309', boxShadow: '0 3px 0 #92400E' }}
            >
              Claim 25 XP
            </button>
          )}
        </div>
      </main>
    </div>
    {levelUpTo !== null && <LevelUpModal level={levelUpTo} onClose={() => setLevelUpTo(null)} />}
    </>
  );
}
