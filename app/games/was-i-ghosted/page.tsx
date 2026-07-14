'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { getLevelProgress, getLevel, checkForNewBadgesOnOutcome, getInitialBadges } from '@/lib/gameLogic';
import { Badge, Task, CATEGORY_CONFIG } from '@/lib/types';
import { Outcome, OUTCOME_CONFIG } from '@/lib/outcomes';
import { getGameDay } from '@/lib/gameDay';
import { loadState, saveState, awardFreezeToken } from '@/lib/supabase/storage';
import LevelUpModal from '@/components/LevelUpModal';

const GHOSTED_KEY = 'gainfully-ghosted';

type GhostedChoice = 'ghosted' | 'natural' | 'waiting' | 'i_ghosted';

interface DailyGhostedPick {
  date: string;
  taskId: string;
  choice?: GhostedChoice;
}

interface GhostedGameState {
  daily: DailyGhostedPick | null;
  dismissed: string[]; // taskIds permanently resolved (natural / i_ghosted)
}

interface EligibleItem {
  task: Task;
  lastOutcome: Outcome;
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr).toLocaleDateString(
    'en-US', { month: 'short', day: 'numeric', year: 'numeric' }
  );
}

function getEligible(tasks: Task[], outcomes: Outcome[], dismissed: string[]): EligibleItem[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const items: EligibleItem[] = [];

  for (const task of tasks) {
    if (task.category !== 'application' && task.category !== 'networking') continue;
    if (dismissed.includes(task.id)) continue;

    const taskOutcomes = outcomes.filter((o) => o.taskId === task.id);
    if (taskOutcomes.length === 0) continue;
    if (taskOutcomes.some((o) => o.type === 'ghosted')) continue;

    const sorted = [...taskOutcomes].sort((a, b) => {
      const ta = new Date(a.date.length === 10 ? a.date + 'T12:00:00' : a.date).getTime();
      const tb = new Date(b.date.length === 10 ? b.date + 'T12:00:00' : b.date).getTime();
      return tb - ta;
    });
    const last = sorted[0];
    const lastMs = new Date(last.date.length === 10 ? last.date + 'T12:00:00' : last.date).getTime();
    if (lastMs >= cutoff) continue;

    items.push({ task, lastOutcome: last });
  }

  return items;
}

function loadGameState(): GhostedGameState {
  try {
    const raw = localStorage.getItem(GHOSTED_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { daily: null, dismissed: [] };
}

const CHOICE_COPY: Record<GhostedChoice, { headline: string; body: string }> = {
  ghosted:   { headline: 'Yep. Ghosted.', body: "Logged. You called it — now it's official. On to better things." },
  natural:   { headline: 'A natural end.', body: 'Not every exchange is meant to go somewhere. That\'s okay.' },
  waiting:   { headline: 'Still in it.', body: "Patience is a skill. We'll check back in a day or two." },
  i_ghosted: { headline: 'You made a call.', body: "Sometimes you move on first. No judgment here." },
};

function trackEvent(name: string, params?: Record<string, string | number>) {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', name, params);
}

export default function WasIGhostedPage() {
  const [levelProgress, setLevelProgress] = useState(getLevelProgress(0));
  const [totalXP, setTotalXP] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allOutcomes, setAllOutcomes] = useState<Outcome[]>([]);
  const [eligible, setEligible] = useState<EligibleItem[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [daily, setDaily] = useState<DailyGhostedPick | null>(null);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<EligibleItem | null>(null);

  useEffect(() => {
    async function init() {
      let tasks: Task[] = [];
      let outcomes: Outcome[] = [];

      const data = await loadState();
      if (data) {
        tasks = (data.tasks ?? []) as Task[];
        outcomes = (data.outcomes ?? []) as Outcome[];
      }

      setAllTasks(tasks);
      setAllOutcomes(outcomes);

      const gs = loadGameState();
      const dis = gs.dismissed ?? [];
      setDismissed(dis);

      const items = getEligible(tasks, outcomes, dis);
      setEligible(items);

      const todayPick = gs.daily?.date === getGameDay() ? gs.daily : null;
      setDaily(todayPick);

      if (todayPick) {
        const item = items.find((e) => e.task.id === todayPick.taskId) ?? null;
        setCurrentItem(item);
      }

      setMounted(true);
    }
    init();
  }, []);

  function reveal() {
    if (eligible.length === 0) return;
    const item = eligible[Math.floor(Math.random() * eligible.length)];
    const newDaily: DailyGhostedPick = { date: getGameDay(), taskId: item.task.id };
    const gs = loadGameState();
    gs.daily = newDaily;
    localStorage.setItem(GHOSTED_KEY, JSON.stringify(gs));
    setDaily(newDaily);
    setCurrentItem(item);
    trackEvent('game_played', { game: 'was_i_ghosted' });
  }

  async function handleChoice(choice: GhostedChoice) {
    if (!daily || daily.choice || !currentItem) return;
    trackEvent('game_choice', { game: 'was_i_ghosted', choice });

    let newTotalXP = totalXP;

    if (choice === 'ghosted') {
      try {
        const data = await loadState();
        const state: Record<string, unknown> = data ?? { tasks: [], totalXP: 0, badges: [], outcomes: [], customActivities: [], xpOverrides: {} };

        const newOutcome: Outcome = {
          id: `ghosted-game-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          taskId: currentItem.task.id,
          type: 'ghosted',
          date: getGameDay(),
          xpAwarded: 5,
          createdAt: new Date().toISOString(),
        };

        const oldTotalXP = (state.totalXP as number) ?? 0;
        newTotalXP = oldTotalXP + 5;
        const currentBadges: Badge[] = getInitialBadges().map((b) => {
          const found = ((state.badges as Badge[]) ?? []).find((sb: Badge) => sb.id === b.id);
          return found ?? b;
        });
        const newBadges = checkForNewBadgesOnOutcome(
          (state.outcomes as Outcome[]) ?? [], newOutcome, currentBadges, newTotalXP
        );
        const updatedBadges = currentBadges.map((b) => {
          const fresh = newBadges.find((nb) => nb.id === b.id);
          return fresh ?? b;
        });

        state.outcomes = [...((state.outcomes as Outcome[]) ?? []), newOutcome];
        state.totalXP = newTotalXP;
        state.badges = updatedBadges;
        await saveState(state);
        setBadgeCount(updatedBadges.filter((b: Badge) => b.earned).length);
        setAllOutcomes(state.outcomes as Outcome[]);
        if (getLevel(newTotalXP) > getLevel(oldTotalXP)) {
          setLevelUpTo(getLevel(newTotalXP));
          awardFreezeToken().catch(() => {});
        }
      } catch { /* ignore */ }
    }

    const newDismissed = (choice === 'natural' || choice === 'i_ghosted')
      ? [...new Set([...dismissed, currentItem.task.id])]
      : dismissed;

    const updatedDaily: DailyGhostedPick = { ...daily, choice };
    const gs = loadGameState();
    gs.daily = updatedDaily;
    gs.dismissed = newDismissed;
    localStorage.setItem(GHOSTED_KEY, JSON.stringify(gs));

    setDaily(updatedDaily);
    setDismissed(newDismissed);
    setTotalXP(newTotalXP);
    setLevelProgress(getLevelProgress(newTotalXP));
  }

  if (!mounted) return null;

  // For the answered state, look up the task even if it's no longer eligible
  const answeredTask = daily?.choice
    ? (currentItem?.task ?? allTasks.find((t) => t.id === daily.taskId) ?? null)
    : null;
  const answeredLastOutcome = daily?.choice
    ? (currentItem?.lastOutcome ?? allOutcomes.filter((o) => o.taskId === daily.taskId).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0] ?? null)
    : null;

  const catConfig = (currentItem ?? (answeredTask ? { task: answeredTask } : null))
    ? CATEGORY_CONFIG[(currentItem?.task ?? answeredTask!).category]
    : null;
  const lastOutcomeConfig = (currentItem?.lastOutcome ?? answeredLastOutcome)
    ? OUTCOME_CONFIG[(currentItem?.lastOutcome ?? answeredLastOutcome!).type]
    : null;
  const days = (currentItem?.lastOutcome ?? answeredLastOutcome)
    ? daysSince((currentItem?.lastOutcome ?? answeredLastOutcome!).date)
    : 0;
  const displayTask = currentItem?.task ?? answeredTask;
  const displayLastOutcome = currentItem?.lastOutcome ?? answeredLastOutcome;

  const noEligible = eligible.length === 0 && !daily;
  const readyToReveal = !daily && eligible.length > 0;
  const answered = !!daily?.choice;
  const awaitingAnswer = daily && currentItem && !daily.choice;

  return (
    <>
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-sm mx-auto px-4 py-8">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-[#97887A] hover:text-[#2C2724] transition-colors mb-8">
          ← Back to Games
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-fredoka font-bold text-[24px] text-[#2C2724] mb-2">👻 Was I Ghosted?</h1>
          <p className="text-[#97887A] text-sm leading-relaxed">
            {noEligible && 'Manufacturing closure.'}
            {readyToReveal && `${eligible.length} cold trail${eligible.length === 1 ? '' : 's'} to investigate.`}
            {awaitingAnswer && 'One past interaction. Face the silence.'}
            {answered && 'Come back tomorrow for a new one.'}
          </p>
        </div>

        {noEligible && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🕸️</div>
            <p className="text-[#6f6155] font-bold mb-1">No cold trails yet.</p>
            <p className="text-[#97887A] text-sm leading-relaxed">
              Log results on your applications and networking tasks. Once an interaction is a week old, it&apos;ll show up here.
            </p>
          </div>
        )}

        {readyToReveal && (
          <div className="text-center">
            <button
              onClick={reveal}
              className="px-8 py-4 rounded-2xl text-white font-fredoka font-bold text-lg transition-colors"
              style={{ background: '#7C5CFC', boxShadow: '0 4px 0 #5B3FD6' }}
            >
              Investigate 👻
            </button>
          </div>
        )}

        {awaitingAnswer && displayTask && displayLastOutcome && catConfig && lastOutcomeConfig && (
          <div className="space-y-4">
            {/* Interaction card */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '2px solid #F1E2CF' }}>
              <p className="font-fredoka font-bold text-base text-[#2C2724] leading-snug mb-1">
                {displayTask.name}
              </p>
              {displayTask.company && (
                <p className="text-[#97887A] text-sm mb-2">{displayTask.company}</p>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border ${catConfig.colorClasses}`}>
                {catConfig.icon} {catConfig.label}
              </span>

              <div className="mt-4 pt-4" style={{ borderTop: '2px solid #F1E2CF' }}>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-1">Last result</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${lastOutcomeConfig.colorClasses}`}>
                    {lastOutcomeConfig.icon} {lastOutcomeConfig.shortLabel}
                  </span>
                  <span className="text-[#A99C8D] text-xs">{fmtDate(displayLastOutcome.date)}</span>
                </div>
                <p className="text-[#6f6155] text-sm font-bold mt-2">
                  {days} day{days === 1 ? '' : 's'} ago
                </p>
              </div>
            </div>

            {/* Choices */}
            <p className="text-[#6f6155] text-sm text-center font-bold">What happened here?</p>

            <div className="space-y-2">
              <button
                onClick={() => handleChoice('ghosted')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors text-left"
                style={{ background: '#FEE2E2', border: '2px solid #FECACA', color: '#DC2626' }}
              >
                👻 Yep, I got ghosted
              </button>
              <button
                onClick={() => handleChoice('natural')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors text-left hover:bg-[#F2E8DB] text-[#2C2724]"
                style={{ background: '#FBF3E8', border: '2px solid #EFE0CC' }}
              >
                🤝 Natural end of conversation
              </button>
              <button
                onClick={() => handleChoice('waiting')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors text-left hover:bg-[#F2E8DB] text-[#2C2724]"
                style={{ background: '#FBF3E8', border: '2px solid #EFE0CC' }}
              >
                ⏳ Still waiting on this one
              </button>
              <button
                onClick={() => handleChoice('i_ghosted')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors text-left text-[#97887A] hover:text-[#6f6155]"
                style={{ background: '#F6EEE2', border: '2px solid #EFE0CC' }}
              >
                🙈 I ghosted them
              </button>
            </div>
          </div>
        )}

        {answered && daily.choice && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 text-center" style={{ border: '2px solid #F1E2CF' }}>
              <p className="font-fredoka font-bold text-lg text-[#2C2724] mb-1">
                {CHOICE_COPY[daily.choice].headline}
              </p>
              <p className="text-[#97887A] text-sm leading-relaxed">
                {CHOICE_COPY[daily.choice].body}
              </p>
              {daily.choice === 'ghosted' && (
                <p className="text-[#F5A300] font-fredoka font-bold text-sm mt-3">+5 XP</p>
              )}
            </div>

            {displayTask && catConfig && displayLastOutcome && lastOutcomeConfig && (
              <div className="rounded-xl p-4 text-sm text-[#97887A]" style={{ background: '#FBF3E8', border: '2px solid #EFE0CC' }}>
                <p className="font-bold text-[#2C2724] mb-0.5">{displayTask.name}</p>
                {displayTask.company && <p className="text-xs mb-1">{displayTask.company}</p>}
                <p className="text-xs">
                  Last result: {lastOutcomeConfig.icon} {lastOutcomeConfig.shortLabel} · {days} days ago
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
    {levelUpTo !== null && <LevelUpModal level={levelUpTo} onClose={() => setLevelUpTo(null)} />}
    </>
  );
}
