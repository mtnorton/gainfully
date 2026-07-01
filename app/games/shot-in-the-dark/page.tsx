'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { getLevelProgress, getLevel } from '@/lib/gameLogic';
import LevelUpModal from '@/components/LevelUpModal';
import { TaskCategory } from '@/lib/types';
import { getGameDay } from '@/lib/gameDay';
import { loadState, saveState, awardFreezeToken } from '@/lib/supabase/storage';

const SHOT_PICK_KEY = 'gainfully-shot-pick';

const XP_POOL = [5, 10, 10, 15, 20, 25, 30, 50, 75];

interface ShotPick {
  targetIndex: number;
  xpValue: number;
  pickedAt: string;
  lastClaimedDate: string | null;
}


function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PRE_PICK_QUIPS = [
  "Nine targets. Nine fates. Zero transparency. Pick one.",
  "Some are generous. Most are not. That's the game.",
  "Pick one. We're definitely not telling you what's in them.",
  "The darkness has opinions about your future. Find out which one is yours.",
];

function postPickQuip(xp: number): string {
  if (xp <= 10) return "Bold choice. True grit. Also: ouch.";
  if (xp <= 20) return "Solid. Not glamorous, but consistent.";
  if (xp <= 35) return "The darkness was in a good mood today.";
  return "You absolute legend. The universe sees you.";
}

const CLAIM_QUIPS = [
  "It's not going to claim itself.",
  "Your daily XP is just sitting there.",
  "Don't leave it on the table.",
  "The target waits for no one.",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function Target({
  onClick,
  revealed,
  xp,
  disabled,
}: {
  onClick?: () => void;
  revealed: boolean;
  xp: number;
  disabled: boolean;
}) {
  if (revealed) {
    return (
      <div className="w-24 h-24 rounded-full border-[3px] border-violet-500/60 bg-violet-600/15 flex flex-col items-center justify-center shadow-lg shadow-violet-500/20">
        <span className="text-violet-300 font-black text-2xl leading-none">{xp}</span>
        <span className="text-violet-400/60 text-[10px] font-semibold uppercase tracking-wide mt-0.5">XP / day</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-150 group
        ${disabled ? 'opacity-30 cursor-default' : 'hover:scale-105 active:scale-95 cursor-pointer'}`}
      style={{ border: '3px solid #EFE0CC', background: '#FBF3E8' }}
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center transition-colors" style={{ border: '1.5px solid #EFE0CC' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ border: '1px solid #EFE0CC' }}>
          <div className="w-2.5 h-2.5 rounded-full transition-colors" style={{ background: '#D4C5B0' }} />
        </div>
      </div>
    </button>
  );
}

export default function ShotInTheDarkPage() {
  const [levelProgress, setLevelProgress] = useState(getLevelProgress(0));
  const [totalXP, setTotalXP] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [pick, setPick] = useState<ShotPick | null>(null);
  const [mounted, setMounted] = useState(false);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
  const [preQuip] = useState(() => randomFrom(PRE_PICK_QUIPS));
  const [claimQuip] = useState(() => randomFrom(CLAIM_QUIPS));

  // Shuffled XP values for this render — only the picked one matters after selection
  const [shuffledXP] = useState(() => shuffle(XP_POOL));

  useEffect(() => {
    const raw = localStorage.getItem(SHOT_PICK_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.pickedAt === getGameDay()) {
          setPick(saved);
        }
      } catch { /* ignore */ }
    }
    setMounted(true);
  }, []);

  function handlePick(index: number, xpValue: number) {
    if (pick) return;
    const newPick: ShotPick = {
      targetIndex: index,
      xpValue,
      pickedAt: getGameDay(),
      lastClaimedDate: null,
    };
    localStorage.setItem(SHOT_PICK_KEY, JSON.stringify(newPick));
    setPick(newPick);
  }

  async function handleClaim() {
    if (!pick) return;
    try {
      const data = await loadState();
      const state: Record<string, unknown> = data ?? { tasks: [], totalXP: 0, badges: [], customActivities: [], xpOverrides: {} };
      const now = new Date().toISOString();
      const oldTotalXP = (state.totalXP as number) ?? 0;
      const newTotalXP = oldTotalXP + pick.xpValue;
      const newTask = {
        id: `shot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: 'Shot in the Dark',
        category: 'selfcare' as TaskCategory,
        xp: pick.xpValue,
        completed: true,
        completedAt: now,
        createdAt: now,
      };
      state.tasks = [newTask, ...((state.tasks as unknown[]) ?? [])];
      state.totalXP = newTotalXP;
      await saveState(state);
      if (getLevel(newTotalXP) > getLevel(oldTotalXP)) {
        setLevelUpTo(getLevel(newTotalXP));
        awardFreezeToken().catch(() => {});
      }
      setTotalXP(newTotalXP);
      setLevelProgress(getLevelProgress(newTotalXP));
    } catch { /* ignore */ }

    const updated: ShotPick = { ...pick, lastClaimedDate: getGameDay() };
    localStorage.setItem(SHOT_PICK_KEY, JSON.stringify(updated));
    setPick(updated);
  }

  if (!mounted) return null;

  const claimedToday = pick?.lastClaimedDate === getGameDay();

  return (
    <>
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-sm mx-auto px-4 py-8">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-[#97887A] hover:text-[#2C2724] transition-colors mb-8">
          ← Back to Games
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-fredoka font-bold text-[24px] text-[#2C2724] mb-2">🎯 Shot in the Dark</h1>
          <p className="text-[#97887A] text-sm leading-relaxed">
            {pick ? postPickQuip(pick.xpValue) : preQuip}
          </p>
        </div>

        {/* Target grid */}
        <div className="grid grid-cols-3 gap-5 justify-items-center mb-8">
          {shuffledXP.map((xp, i) => (
            <Target
              key={i}
              revealed={pick?.targetIndex === i}
              xp={pick?.targetIndex === i ? pick.xpValue : xp}
              disabled={!!pick && pick.targetIndex !== i}
              onClick={() => handlePick(i, xp)}
            />
          ))}
        </div>

        {!pick && (
          <p className="text-center text-[#C4B5A5] text-xs">
            Choose one. You only get one shot.
          </p>
        )}

        {/* Claim section */}
        {pick && (
          <div className="bg-white rounded-2xl p-5" style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #F5A300' }}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-bold text-[#6f6155] text-sm">Your daily target</span>
              <span className="font-fredoka font-black text-[#F5A300] text-2xl">{pick.xpValue} XP</span>
            </div>
            <p className="text-[#A99C8D] text-xs mb-4">
              {claimedToday ? 'Claimed today · come back tomorrow' : claimQuip}
            </p>

            {claimedToday ? (
              <div className="w-full py-2.5 rounded-xl text-[#7C6F63] text-sm font-semibold text-center" style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}>
                ✓ Claimed
              </div>
            ) : (
              <button
                onClick={handleClaim}
                className="w-full py-2.5 rounded-xl text-white font-fredoka font-semibold text-sm transition-colors"
                style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
              >
                Claim {pick.xpValue} XP
              </button>
            )}
          </div>
        )}
      </main>
    </div>
    {levelUpTo !== null && <LevelUpModal level={levelUpTo} onClose={() => setLevelUpTo(null)} />}
    </>
  );
}
