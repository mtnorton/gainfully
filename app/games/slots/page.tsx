'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { getLevelProgress, getLevel, checkForNewBadges, checkForStreakBadges, calculateStreak, getInitialBadges } from '@/lib/gameLogic';
import { BUILT_IN_ACTIVITIES } from '@/lib/builtInActivities';
import { Task, Badge, TaskCategory, CustomActivity } from '@/lib/types';
import { getGameDay } from '@/lib/gameDay';
import { loadState, saveState, awardFreezeToken } from '@/lib/supabase/storage';
import LevelUpModal from '@/components/LevelUpModal';

export const SLOTS_PICK_KEY = 'gainfully-slots-pick';

export interface DailyPick {
  date: string;
  activityName: string;
  category: TaskCategory;
  baseXP: number;
  bonusXP: number;
  claimed?: boolean;
}

interface Activity {
  name: string;
  category: TaskCategory;
  xp: number;
}

const CAT_STYLE: Partial<Record<TaskCategory, { color: string; border: string; glow: string; emoji: string }>> = {
  application: { color: 'text-sky-300',    border: 'border-sky-500/40',    glow: 'shadow-sky-500/20',    emoji: '📋' },
  networking:  { color: 'text-blue-400',   border: 'border-blue-500/40',   glow: 'shadow-blue-500/20',   emoji: '🤝' },
  preparation: { color: 'text-yellow-300', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/20', emoji: '🎯' },
  research:    { color: 'text-amber-400',  border: 'border-amber-500/40',  glow: 'shadow-amber-500/20',  emoji: '🔍' },
  selfcare:    { color: 'text-rose-300',   border: 'border-rose-500/40',   glow: 'shadow-rose-500/20',   emoji: '🌿' },
};


const SPIN_DELAYS = [
  ...Array<number>(18).fill(50),
  ...Array<number>(8).fill(90),
  ...Array<number>(6).fill(150),
  ...Array<number>(4).fill(220),
  ...Array<number>(3).fill(340),
];

function trackEvent(name: string, params?: Record<string, string | number>) {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', name, params);
}

export default function SlotsPage() {
  const [levelProgress, setLevelProgress] = useState(getLevelProgress(0));
  const [totalXP, setTotalXP] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [dailyPick, setDailyPick] = useState<DailyPick | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function init() {
      let xpOverrides: Record<string, number> = {};
      let customActivities: CustomActivity[] = [];

      const data = await loadState();
      if (data) {
        xpOverrides = (data.xpOverrides as Record<string, number>) ?? {};
        customActivities = (data.customActivities as CustomActivity[]) ?? [];
      }

      const activities: Activity[] = [
        ...Object.entries(BUILT_IN_ACTIVITIES).flatMap(([cat, acts]) =>
          (acts ?? []).map((a) => ({
            name: a.name,
            category: cat as TaskCategory,
            xp: xpOverrides[a.name] ?? a.xp,
          }))
        ),
        ...customActivities.map((a) => ({
          name: a.name,
          category: a.category,
          xp: a.xp,
        })),
      ];
      setAllActivities(activities);

      const raw = localStorage.getItem(SLOTS_PICK_KEY);
      if (raw) {
        try {
          const pick: DailyPick = JSON.parse(raw);
          if (pick.date === getGameDay()) {
            setDailyPick(pick);
            setDisplayName(pick.activityName);
          }
        } catch { /* ignore */ }
      }

      setMounted(true);
    }
    init();
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const spin = useCallback(() => {
    if (spinning || dailyPick || allActivities.length === 0) return;
    setSpinning(true);
    trackEvent('game_played', { game: 'slots' });

    const winner = allActivities[Math.floor(Math.random() * allActivities.length)];
    let frame = 0;

    const step = () => {
      if (frame < SPIN_DELAYS.length) {
        setDisplayName(allActivities[Math.floor(Math.random() * allActivities.length)].name);
        timerRef.current = setTimeout(step, SPIN_DELAYS[frame++]);
      } else {
        const pick: DailyPick = {
          date: getGameDay(),
          activityName: winner.name,
          category: winner.category,
          baseXP: winner.xp,
          bonusXP: winner.xp,
        };
        localStorage.setItem(SLOTS_PICK_KEY, JSON.stringify(pick));
        setDisplayName(winner.name);
        setDailyPick(pick);
        setSpinning(false);
      }
    };

    step();
  }, [spinning, dailyPick, allActivities]);

  async function handleClaim() {
    if (!dailyPick || dailyPick.claimed) return;
    const xpEarned = dailyPick.baseXP + dailyPick.bonusXP;

    try {
      const data = await loadState();
      const state: Record<string, unknown> = data ?? { tasks: [], totalXP: 0, badges: [], customActivities: [], xpOverrides: {} };
      const oldTotalXP = (state.totalXP as number) ?? 0;
      const newTotalXP = oldTotalXP + xpEarned;
      const now = new Date().toISOString();
      const newTask: Task = {
        id: `slots-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: dailyPick.activityName,
        category: dailyPick.category,
        xp: xpEarned,
        completed: true,
        completedAt: now,
        createdAt: now,
      };

      const previousTasks: Task[] = (state.tasks as Task[]) ?? [];
      const completedBefore = previousTasks.filter((t: Task) => t.completed);
      const allTasks = [newTask, ...previousTasks];

      const currentBadges: Badge[] = getInitialBadges().map((b) => {
        const found = ((state.badges as Badge[]) ?? []).find((sb: Badge) => sb.id === b.id);
        return found ?? b;
      });

      const newBadges = checkForNewBadges(completedBefore, newTask, currentBadges, newTotalXP);
      const streak = calculateStreak(allTasks);
      const allCompleted = allTasks.filter((t: Task) => t.completed);
      const streakBadges = checkForStreakBadges(streak, allCompleted, currentBadges);
      const allNewBadges = [...newBadges, ...streakBadges];

      const updatedBadges = currentBadges.map((b: Badge) => {
        const fresh = allNewBadges.find((nb) => nb.id === b.id);
        return fresh ?? b;
      });

      state.tasks = allTasks;
      state.totalXP = newTotalXP;
      state.badges = updatedBadges;
      await saveState(state);
      setBadgeCount(updatedBadges.filter((b: Badge) => b.earned).length);
      if (getLevel(newTotalXP) > getLevel(oldTotalXP)) {
        setLevelUpTo(getLevel(newTotalXP));
        awardFreezeToken().catch(() => {});
      }
      setTotalXP(newTotalXP);
      setLevelProgress(getLevelProgress(newTotalXP));
    } catch { /* ignore */ }

    trackEvent('game_claimed', { game: 'slots', xp: xpEarned });
    const updated: DailyPick = { ...dailyPick, claimed: true };
    localStorage.setItem(SLOTS_PICK_KEY, JSON.stringify(updated));
    setDailyPick(updated);
  }

  if (!mounted) return null;

  const style = dailyPick
    ? (CAT_STYLE[dailyPick.category] ?? { color: 'text-slate-100', border: 'border-slate-600', glow: '', emoji: '⭐' })
    : null;

  return (
    <>
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-sm mx-auto px-4 py-8">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-[#97887A] hover:text-[#2C2724] transition-colors mb-8">
          ← Back to Games
        </Link>

        <div className="text-center mb-6">
          <h1 className="font-fredoka font-bold text-[24px] text-[#2C2724] mb-1">🎰 Slots</h1>
          <p className="text-[#97887A] text-sm">Spin for today&apos;s activity. It earns double XP.</p>
        </div>

        {/* Machine */}
        <div className="bg-[#2C2724] rounded-3xl p-5 shadow-2xl mb-5" style={{ border: '2px solid #1A1614' }}>

          {/* Reel viewport */}
          <div className="relative bg-[#1A1614] rounded-2xl border border-[#3D3430] h-32 flex items-center justify-center overflow-hidden mb-4">
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#1A1614] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#1A1614] to-transparent z-10 pointer-events-none" />

            {displayName ? (
              <p
                key={spinning ? displayName : 'landed'}
                className={`text-center font-semibold px-6 text-base leading-snug transition-colors duration-300 ${
                  spinning ? 'text-[#6f6155]' : (style?.color ?? 'text-white')
                }`}
              >
                {displayName}
              </p>
            ) : (
              <p className="text-[#4A3F3A] text-sm tracking-widest">· · ·</p>
            )}
          </div>

          {/* Spin / already spun */}
          {!dailyPick ? (
            <button
              onClick={spin}
              disabled={spinning}
              className="w-full py-3 rounded-xl text-white font-fredoka font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
            >
              {spinning ? 'Spinning…' : 'Spin'}
            </button>
          ) : (
            <div className="text-center py-1">
              <span className="text-xs text-[#6f6155]">Spun today · comes back tomorrow</span>
            </div>
          )}
        </div>

        {/* Bonus card */}
        {dailyPick && style && (
          <div className="bg-white rounded-2xl p-5 text-center" style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #F5A300' }}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-3">Today&apos;s bonus</p>
            <div className="flex items-baseline justify-center gap-3 mb-1">
              <span className="text-[#C4B5A5] text-lg line-through">{dailyPick.baseXP} XP</span>
              <span className="font-fredoka font-black text-[#F5A300] text-4xl">{dailyPick.baseXP + dailyPick.bonusXP} XP</span>
            </div>
            <p className="text-[#D97706] text-xs mb-4 font-semibold">
              {dailyPick.claimed ? 'Logged today · come back tomorrow' : `${style.emoji} ${dailyPick.activityName}`}
            </p>

            {dailyPick.claimed ? (
              <div className="w-full py-2.5 rounded-xl text-[#7C6F63] text-sm font-semibold text-center" style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}>
                ✓ Logged
              </div>
            ) : (
              <button
                onClick={handleClaim}
                className="w-full py-2.5 rounded-xl text-white font-fredoka font-semibold text-sm transition-colors"
                style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
              >
                Mark as done · Claim {dailyPick.baseXP + dailyPick.bonusXP} XP
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
