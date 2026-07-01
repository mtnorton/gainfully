'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { getLevelProgress, getLevel } from '@/lib/gameLogic';
import { Task, CATEGORY_CONFIG } from '@/lib/types';
import { getGameDay } from '@/lib/gameDay';
import { loadState, saveState, awardFreezeToken } from '@/lib/supabase/storage';
import LevelUpModal from '@/components/LevelUpModal';

const MOMENTUM_KEY = 'gainfully-momentum';

// ── Strategies ────────────────────────────────────────────────────────────────

type StrategyKey = 'one_liner' | 'reference' | 'new_info' | 'the_ask';

const STRATEGY_KEYS: StrategyKey[] = ['one_liner', 'reference', 'new_info', 'the_ask'];

interface Strategy {
  label: string;
  emoji: string;
  tagline: string;
  copy: string;
  xp: number;
  taskLabel: string;
  activeClasses: string;
  winnerClasses: string;
}

const STRATEGIES: Record<StrategyKey, Strategy> = {
  one_liner: {
    label: 'One Liner',
    emoji: '💬',
    tagline: 'Quick, warm, no agenda',
    copy: 'Keep it short. "Saw this and thought of you" is a complete strategy. No ask, no pressure — just staying visible. A single sentence can open a door a paragraph never could.',
    xp: 10,
    taskLabel: 'Sent a quick networking follow-up',
    activeClasses: 'border-sky-400 bg-sky-500/20 text-sky-100 shadow-lg shadow-sky-500/20',
    winnerClasses: 'border-sky-400/70 bg-sky-500/10 text-sky-100',
  },
  reference: {
    label: 'Callback',
    emoji: '🔁',
    tagline: 'Reference the last conversation',
    copy: 'Pick one specific thing from your last exchange and mention it. "You mentioned you were working on X — how\'s that going?" It signals you were actually listening, and this isn\'t a mass message.',
    xp: 20,
    taskLabel: 'Followed up referencing a prior conversation',
    activeClasses: 'border-violet-400 bg-violet-500/20 text-violet-100 shadow-lg shadow-violet-500/20',
    winnerClasses: 'border-violet-400/70 bg-violet-500/10 text-violet-100',
  },
  new_info: {
    label: 'Value Drop',
    emoji: '💡',
    tagline: 'Lead with something useful',
    copy: 'Share an article, a job posting, a mutual contact, or an insight they\'d actually care about. Give before you ask. Useful messages get replies — a pitch alone doesn\'t.',
    xp: 25,
    taskLabel: 'Followed up with a value-add',
    activeClasses: 'border-amber-400 bg-amber-500/20 text-amber-100 shadow-lg shadow-amber-500/20',
    winnerClasses: 'border-amber-400/70 bg-amber-500/10 text-amber-100',
  },
  the_ask: {
    label: 'The Ask',
    emoji: '🎯',
    tagline: 'Time to move this forward',
    copy: 'Ask for a coffee chat, a referral intro, or something specific. Be direct. Make it easy to say yes — one clear, low-friction request is all you need.',
    xp: 30,
    taskLabel: 'Made a direct networking ask',
    activeClasses: 'border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-lg shadow-emerald-500/20',
    winnerClasses: 'border-emerald-400/70 bg-emerald-500/10 text-emerald-100',
  },
};

// ── Storage types ─────────────────────────────────────────────────────────────

interface MomentumPick {
  date: string;
  taskId: string;
  strategy?: StrategyKey;
  claimed?: boolean;
}

interface MomentumGameState {
  daily: MomentumPick | null;
  strategyCounts: Partial<Record<StrategyKey, number>>;
}

function loadGameState(): MomentumGameState {
  try {
    const raw = localStorage.getItem(MOMENTUM_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { daily: null, strategyCounts: {} };
}

function saveGameState(gs: MomentumGameState) {
  localStorage.setItem(MOMENTUM_KEY, JSON.stringify(gs));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEligible(tasks: Task[]): Task[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return tasks.filter((t) => {
    if (t.category !== 'networking' || !t.completed) return false;
    const refMs = new Date(t.completedAt ?? t.createdAt).getTime();
    return refMs < cutoff;
  });
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Spin delays: fast flat phase → eased slowdown
// SPIN_BASE must be divisible by 4 so randomising winner offset gives equal probability
const SPIN_BASE = 32;

function buildDelays(totalSteps: number): number[] {
  return Array.from({ length: totalSteps }, (_, i) => {
    const p = i / totalSteps;
    if (p < 0.65) return 65;
    const t = (p - 0.65) / 0.35;
    return Math.round(65 + 455 * t * t); // 65ms → 520ms
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MomentumLabPage() {
  const [levelProgress, setLevelProgress] = useState(getLevelProgress(0));
  const [totalXP, setTotalXP] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [levelUpTo, setLevelUpTo] = useState<number | null>(null);

  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [noEligible, setNoEligible] = useState(false);
  const [daily, setDaily] = useState<MomentumPick | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [highlighted, setHighlighted] = useState<StrategyKey | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function init() {
      let tasks: Task[] = [];
      const data = await loadState();
      if (data) {
        tasks = (data.tasks ?? []) as Task[];
      }

      const items = getEligible(tasks);
      const gs = loadGameState();
      const todayPick = gs.daily?.date === getGameDay() ? gs.daily : null;

      if (todayPick) {
        setDaily(todayPick);
        const task = tasks.find((t) => t.id === todayPick.taskId) ?? null;
        setCurrentTask(task);
        if (todayPick.strategy) setHighlighted(todayPick.strategy);
      } else if (items.length > 0) {
        const task = items[Math.floor(Math.random() * items.length)];
        const newPick: MomentumPick = { date: getGameDay(), taskId: task.id };
        gs.daily = newPick;
        saveGameState(gs);
        setDaily(newPick);
        setCurrentTask(task);
      } else {
        setNoEligible(true);
      }

      setMounted(true);
    }
    init();
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const spin = useCallback(() => {
    if (spinning || !daily || daily.strategy) return;
    setSpinning(true);

    const startIdx = Math.floor(Math.random() * STRATEGY_KEYS.length);
    const winnerIdx = Math.floor(Math.random() * STRATEGY_KEYS.length);
    // Extra steps needed to land on winnerIdx after SPIN_BASE steps from startIdx
    const extra = (winnerIdx - ((startIdx + SPIN_BASE) % STRATEGY_KEYS.length) + STRATEGY_KEYS.length) % STRATEGY_KEYS.length;
    const totalSteps = SPIN_BASE + extra; // 32–35

    const delays = buildDelays(totalSteps);
    let frame = 0;
    let idx = startIdx;

    const step = () => {
      if (frame < totalSteps) {
        idx = (idx + 1) % STRATEGY_KEYS.length;
        setHighlighted(STRATEGY_KEYS[idx]);
        timerRef.current = setTimeout(step, delays[frame++]);
      } else {
        const winner = STRATEGY_KEYS[winnerIdx];
        setHighlighted(winner);
        setSpinning(false);
        setDaily((prev) => prev ? { ...prev, strategy: winner } : prev);
        const gs = loadGameState();
        gs.daily = { ...(gs.daily ?? { date: getGameDay(), taskId: daily.taskId }), strategy: winner };
        gs.strategyCounts = { ...gs.strategyCounts, [winner]: (gs.strategyCounts[winner] ?? 0) + 1 };
        saveGameState(gs);
      }
    };

    timerRef.current = setTimeout(step, delays[0]);
  }, [spinning, daily]);

  async function handleClaim() {
    if (!daily?.strategy || daily.claimed || !currentTask) return;
    const s = STRATEGIES[daily.strategy];

    try {
      const data = await loadState();
      const state: Record<string, unknown> = data ?? { tasks: [], totalXP: 0, badges: [], customActivities: [], xpOverrides: {} };
      const now = new Date().toISOString();
      const oldTotalXP = (state.totalXP as number) ?? 0;
      const newTotalXP = oldTotalXP + s.xp;
      state.tasks = [{
        id: `momentum-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: s.taskLabel,
        category: 'networking',
        company: currentTask.company,
        xp: s.xp,
        completed: true,
        completedAt: now,
        createdAt: now,
      }, ...((state.tasks as Task[]) ?? [])];
      state.totalXP = newTotalXP;
      await saveState(state);
      if (getLevel(newTotalXP) > getLevel(oldTotalXP)) {
        setLevelUpTo(getLevel(newTotalXP));
        awardFreezeToken().catch(() => {});
      }
      setTotalXP(newTotalXP);
      setLevelProgress(getLevelProgress(newTotalXP));
    } catch { /* ignore */ }

    const gs = loadGameState();
    gs.daily = { ...gs.daily!, claimed: true };
    saveGameState(gs);

    setDaily((prev) => prev ? { ...prev, claimed: true } : prev);
  }

  if (!mounted) return null;

  const winner = daily?.strategy ? STRATEGIES[daily.strategy] : null;
  const claimed = !!daily?.claimed;
  const catConfig = CATEGORY_CONFIG['networking'];

  return (
    <>
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-sm mx-auto px-4 py-8">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-[#97887A] hover:text-[#2C2724] transition-colors mb-8">
          ← Back to Games
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-fredoka font-bold text-[24px] text-[#2C2724] mb-2">🧪 Momentum Lab</h1>
          <p className="text-[#97887A] text-sm leading-relaxed">
            {noEligible
              ? 'Complete networking tasks and come back once they\'re a week old.'
              : claimed
              ? 'Nice work. Come back tomorrow for a new contact.'
              : winner
              ? `${winner.tagline} — mark it done when you send it.`
              : 'One networking contact per day. The machine picks your move.'}
          </p>
        </div>

        {noEligible ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-[#6f6155] font-bold mb-1">Nothing in the pipeline yet.</p>
            <p className="text-[#97887A] text-sm leading-relaxed">
              Log some networking activities and come back once they&apos;re at least a week old.
            </p>
          </div>
        ) : (
          <>
            {/* Contact card */}
            {currentTask && (
              <div className="bg-white rounded-2xl p-4 mb-5" style={{ border: '2px solid #F1E2CF' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-fredoka font-bold text-sm text-[#2C2724] leading-snug truncate">
                      {currentTask.company ?? currentTask.name}
                    </p>
                    {currentTask.company && (
                      <p className="text-[#97887A] text-xs mt-0.5 truncate">{currentTask.name}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${catConfig.colorClasses}`}>
                    {catConfig.icon} {catConfig.label}
                  </span>
                </div>
                <p className="text-[#A99C8D] text-xs mt-2">
                  {fmtDate(currentTask.completedAt ?? currentTask.createdAt)}
                  {' · '}
                  {daysSince(currentTask.completedAt ?? currentTask.createdAt)} days ago
                </p>
              </div>
            )}

            {/* Strategy grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {STRATEGY_KEYS.map((key) => {
                const s = STRATEGIES[key];
                const isHighlighted = highlighted === key;
                const isWinner = !spinning && daily?.strategy === key;
                const isDimmed = (spinning && !isHighlighted) || (!spinning && !!daily?.strategy && !isWinner);

                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-3 ${spinning ? 'transition-none' : 'transition-all duration-200'} ${
                      isWinner
                        ? s.winnerClasses
                        : isHighlighted
                        ? s.activeClasses
                        : isDimmed
                        ? 'border-[#EFE0CC] bg-[#F6EEE2] opacity-30'
                        : 'border-[#F1E2CF] bg-white'
                    }`}
                  >
                    <div className="text-lg mb-1 leading-none">{s.emoji}</div>
                    <div className="text-xs font-bold text-[#2C2724] leading-tight">{s.label}</div>
                    <div className="text-[11px] text-[#97887A] mt-0.5 leading-tight">{s.tagline}</div>
                    {isWinner && (
                      <p className="text-[11px] leading-relaxed mt-2 pt-2 border-t border-white/20 text-current opacity-80">
                        {s.copy}
                      </p>
                    )}
                    {isWinner && (
                      <p className="text-xs font-bold text-[#F5A300] mt-1.5">+{s.xp} XP</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action button */}
            {!daily?.strategy ? (
              <button
                onClick={spin}
                disabled={spinning}
                className="w-full py-3 rounded-xl text-white font-fredoka font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#0D9488', boxShadow: '0 3px 0 #0A7A71' }}
              >
                {spinning ? 'Randomizing…' : '🔬 Randomize'}
              </button>
            ) : claimed ? (
              <div className="w-full py-3 rounded-xl text-[#7C6F63] text-sm font-semibold text-center" style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}>
                ✓ Done for today
              </div>
            ) : (
              <button
                onClick={handleClaim}
                className="w-full py-3 rounded-xl text-white font-fredoka font-semibold text-sm transition-colors"
                style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
              >
                I did it · Claim {winner?.xp} XP
              </button>
            )}
          </>
        )}
      </main>
    </div>
    {levelUpTo !== null && <LevelUpModal level={levelUpTo} onClose={() => setLevelUpTo(null)} />}
    </>
  );
}
