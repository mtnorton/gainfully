'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Task, Badge, TaskCategory, CATEGORY_CONFIG } from '@/lib/types';
import { Outcome, OUTCOME_CONFIG, OutcomeType } from '@/lib/outcomes';
import { getInitialBadges, getLevelProgress } from '@/lib/gameLogic';

const STORAGE_KEY = 'gainfully-state';

interface WeekSummary {
  tasks: Task[];
  byCategory: Partial<Record<TaskCategory, number>>;
  outcomes: Outcome[];
  outcomeCounts: Partial<Record<OutcomeType, number>>;
  taskXP: number;
  outcomeXP: number;
  totalXP: number;
  badges: Badge[];
  start: Date;
  end: Date;
}

function getWeekBounds(weeksAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const daysToMonday = (now.getDay() + 6) % 7;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);
  if (weeksAgo === 0) return { start: thisMonday, end: now };
  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - weeksAgo * 7);
  const end = new Date(thisMonday);
  end.setDate(thisMonday.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buildWeekSummary(
  tasks: Task[],
  outcomes: Outcome[],
  badges: Badge[],
  weeksAgo: number
): WeekSummary {
  const { start, end } = getWeekBounds(weeksAgo);

  const weekTasks = tasks.filter((t) => {
    if (!t.completed || !t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d >= start && d <= end;
  });

  const weekOutcomes = outcomes.filter((o) => {
    const d = new Date(o.date + 'T12:00:00');
    return d >= start && d <= end;
  });

  const weekBadges = badges.filter((b) => {
    if (!b.earned || !b.earnedAt) return false;
    const d = new Date(b.earnedAt);
    return d >= start && d <= end;
  });

  const byCategory: Partial<Record<TaskCategory, number>> = {};
  for (const t of weekTasks) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
  }

  const outcomeCounts: Partial<Record<OutcomeType, number>> = {};
  for (const o of weekOutcomes) {
    outcomeCounts[o.type] = (outcomeCounts[o.type] ?? 0) + 1;
  }

  const taskXP = weekTasks.reduce((s, t) => s + t.xp, 0);
  const outcomeXP = weekOutcomes.reduce((s, o) => s + (o.xpAwarded ?? 0), 0);

  return {
    tasks: weekTasks,
    byCategory,
    outcomes: weekOutcomes,
    outcomeCounts,
    taskXP,
    outcomeXP,
    totalXP: taskXP + outcomeXP,
    badges: weekBadges,
    start,
    end,
  };
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CAT_ORDER: TaskCategory[] = ['application', 'networking', 'preparation', 'research', 'selfcare', 'custom'];
const OUTCOME_ORDER: OutcomeType[] = ['offer', 'second_interview', 'interview', 'referral', 'response', 'rejection', 'ghosted', 'position_closed', 'other', 'standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'];

function buildShareText(summary: WeekSummary, level: number, totalXP: number, isThisWeek: boolean): string {
  const lines: string[] = [];
  lines.push(isThisWeek ? '💼 This week in my job search:' : '💼 Last week in my job search:');
  lines.push('');

  if (summary.totalXP > 0) {
    lines.push(`⚡ +${summary.totalXP} XP — Level ${level} (${totalXP.toLocaleString()} total)`);
  }

  if (summary.tasks.length > 0) {
    const catParts = CAT_ORDER
      .filter((c) => summary.byCategory[c])
      .map((c) => `${CATEGORY_CONFIG[c].icon} ${summary.byCategory[c]}`)
      .join('  ');
    lines.push(`✅ ${summary.tasks.length} task${summary.tasks.length !== 1 ? 's' : ''}: ${catParts}`);
  }

  const positives: OutcomeType[] = ['offer', 'second_interview', 'interview', 'referral', 'response'];
  const positiveLines = positives
    .filter((t) => summary.outcomeCounts[t])
    .map((t) => {
      const count = summary.outcomeCounts[t]!;
      const cfg = OUTCOME_CONFIG[t];
      return `${cfg.icon} ${count > 1 ? `${count}× ` : ''}${cfg.label}`;
    });
  if (positiveLines.length > 0) {
    lines.push('');
    lines.push(...positiveLines);
  }

  const resilienceTotal =
    (summary.outcomeCounts.rejection ?? 0) + (summary.outcomeCounts.ghosted ?? 0);
  const nonsenseTotal =
    (summary.outcomeCounts.standard_nonsense ?? 0) +
    (summary.outcomeCounts.ridiculous_nonsense ?? 0) +
    (summary.outcomeCounts.outrageous_nonsense ?? 0);
  if (resilienceTotal > 0) {
    lines.push(`💪 ${resilienceTotal} rejection${resilienceTotal !== 1 ? 's' : ''} handled`);
  }
  if (nonsenseTotal > 0) {
    lines.push(`🙄 ${nonsenseTotal} recruiter nonsense survived`);
  }

  if (summary.badges.length > 0) {
    lines.push('');
    lines.push(summary.badges.map((b) => `${b.icon} ${b.name}`).join(' · '));
  }

  lines.push('');
  lines.push('#JobSearch #Gainfully');

  return lines.join('\n');
}

interface WeekSectionProps {
  label: 'This Week' | 'Last Week';
  summary: WeekSummary;
  level: number;
  totalXP: number;
  copied: boolean;
  onCopy: (text: string) => void;
}

function WeekSection({ label, summary, level, totalXP, copied, onCopy }: WeekSectionProps) {
  const isThisWeek = label === 'This Week';
  const dateRange = isThisWeek
    ? `${fmtDate(summary.start)} – today`
    : `${fmtDate(summary.start)} – ${fmtDate(summary.end)}`;
  const hasActivity = summary.tasks.length > 0 || summary.outcomes.length > 0;
  const shareText = hasActivity ? buildShareText(summary, level, totalXP, isThisWeek) : '';

  return (
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-slate-100 font-semibold">{label}</h2>
          <p className="text-slate-500 text-xs mt-0.5">{dateRange}</p>
        </div>
        {hasActivity && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onCopy(shareText)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <a
              href={`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/30 text-sky-300 text-xs font-medium transition-colors"
            >
              🦋 Bluesky
            </a>
          </div>
        )}
      </div>

      {!hasActivity ? (
        <p className="text-slate-500 text-sm">
          {isThisWeek
            ? "No activity logged yet — head to the dashboard to get started."
            : "No activity logged this week."}
        </p>
      ) : (
        <div className="space-y-5">
          {summary.totalXP > 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-yellow-400">+{summary.totalXP}</span>
              <span className="text-slate-400 text-sm">XP earned</span>
              {summary.outcomeXP > 0 && summary.taskXP > 0 && (
                <span className="text-slate-600 text-xs">
                  ({summary.taskXP} tasks + {summary.outcomeXP} results)
                </span>
              )}
            </div>
          )}

          {summary.tasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Tasks completed · {summary.tasks.length}
              </p>
              <div className="space-y-1.5">
                {CAT_ORDER.filter((c) => summary.byCategory[c]).map((cat) => {
                  const count = summary.byCategory[cat]!;
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">
                        <span className="mr-2">{cfg.icon}</span>{cfg.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-100 tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {summary.outcomes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Results logged · {summary.outcomes.length}
              </p>
              <div className="space-y-1.5">
                {OUTCOME_ORDER.filter((t) => summary.outcomeCounts[t]).map((type) => {
                  const count = summary.outcomeCounts[type]!;
                  const cfg = OUTCOME_CONFIG[type];
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className={`text-sm ${cfg.sentiment === 'positive' ? 'text-slate-200' : 'text-slate-400'}`}>
                        <span className="mr-2">{cfg.icon}</span>{cfg.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-100 tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {summary.badges.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Badges unlocked
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2"
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <span className="text-amber-200 text-xs font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProgressPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'this' | 'last' | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTasks(parsed.tasks ?? []);
        setOutcomes(parsed.outcomes ?? []);
        setTotalXP(parsed.totalXP ?? 0);
        const merged = getInitialBadges().map((b) => {
          const saved = (parsed.badges ?? []).find((sb: Badge) => sb.id === b.id);
          return saved ?? b;
        });
        setBadges(merged);
        setBadgeCount(merged.filter((b: Badge) => b.earned).length);
      }
    } catch {}
    setMounted(true);
  }, []);

  const handleCopy = (text: string, key: 'this' | 'last') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  if (!mounted) return null;

  const levelProgress = getLevelProgress(totalXP);
  const thisWeek = buildWeekSummary(tasks, outcomes, badges, 0);
  const lastWeek = buildWeekSummary(tasks, outcomes, badges, 1);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-2xl mx-auto px-4 flex flex-wrap items-center py-2 gap-y-1 sm:flex-nowrap sm:h-16 sm:py-0">
          <div className="flex items-center gap-2 order-1">
            <span className="text-2xl">💼</span>
            <span className="text-xl font-bold text-slate-100 tracking-tight">Gainfully</span>
          </div>
          <nav className="flex gap-0.5 w-full sm:w-auto sm:ml-4 order-3 sm:order-2 pb-1 sm:pb-0">
            <Link href="/" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Dashboard</Link>
            <Link href="/pipeline" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Pipeline</Link>
            <span className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium">Progress</span>
            <Link href="/badges" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
              Badges{badgeCount > 0 && (
                <span className="ml-1.5 text-amber-400 font-bold">{badgeCount}</span>
              )}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 order-2 sm:order-3">
            <div className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full px-3 py-1">
              <span className="text-violet-300 font-semibold text-sm">Lvl {levelProgress.level}</span>
            </div>
            <span className="text-yellow-400 font-bold text-sm">{totalXP.toLocaleString()} XP</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-16">
        <WeekSection
          label="This Week"
          summary={thisWeek}
          level={levelProgress.level}
          totalXP={totalXP}
          copied={copiedKey === 'this'}
          onCopy={(text) => handleCopy(text, 'this')}
        />
        <WeekSection
          label="Last Week"
          summary={lastWeek}
          level={levelProgress.level}
          totalXP={totalXP}
          copied={copiedKey === 'last'}
          onCopy={(text) => handleCopy(text, 'last')}
        />
      </main>
    </div>
  );
}
