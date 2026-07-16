'use client';

import { useState, useEffect } from 'react';
import { Application, Task, Badge, TaskCategory, CATEGORY_CONFIG, LevelUpEvent } from '@/lib/types';
import { Outcome, OUTCOME_CONFIG, OutcomeType } from '@/lib/outcomes';
import { getInitialBadges, getLevelProgress, GAME_ONLY_TASK_NAMES } from '@/lib/gameLogic';
import { getLevelName } from '@/lib/levelNames';
import AppHeader from '@/components/AppHeader';
import { loadState } from '@/lib/supabase/storage';

interface WeekSummary {
  tasks: Task[];
  byCategory: Partial<Record<TaskCategory, number>>;
  outcomes: Outcome[];
  outcomeCounts: Partial<Record<OutcomeType, number>>;
  taskXP: number;
  outcomeXP: number;
  gameRounds: number;
  gameXP: number;
  totalXP: number;
  badges: Badge[];
  applications: Application[];
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
  applications: Application[],
  weeksAgo: number
): WeekSummary {
  const { start, end } = getWeekBounds(weeksAgo);

  const allWeekCompleted = tasks.filter((t) => {
    if (!t.completed || !t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d >= start && d <= end;
  });
  const weekTasks = allWeekCompleted.filter((t) => !GAME_ONLY_TASK_NAMES.has(t.name));
  const gameTasks = allWeekCompleted.filter((t) => GAME_ONLY_TASK_NAMES.has(t.name));

  const weekOutcomes = outcomes.filter((o) => {
    const d = new Date(o.date + 'T12:00:00');
    return d >= start && d <= end;
  });

  const weekBadges = badges.filter((b) => {
    if (!b.earned || !b.earnedAt) return false;
    const d = new Date(b.earnedAt);
    return d >= start && d <= end;
  });

  const weekApplications = applications.filter((a) => {
    const d = new Date(a.dateApplied ? a.dateApplied + 'T12:00:00' : a.createdAt);
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
  const gameXP = gameTasks.reduce((s, t) => s + t.xp, 0);

  return {
    tasks: weekTasks,
    byCategory,
    outcomes: weekOutcomes,
    outcomeCounts,
    taskXP,
    outcomeXP,
    gameRounds: gameTasks.length,
    gameXP,
    totalXP: taskXP + outcomeXP + gameXP,
    badges: weekBadges,
    applications: weekApplications,
    start,
    end,
  };
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CAT_ORDER: TaskCategory[] = ['application', 'recruiter', 'networking', 'preparation', 'research', 'skills', 'selfcare', 'hustle', 'custom'];
const OUTCOME_ORDER: OutcomeType[] = ['offer', 'second_interview', 'interview', 'referral', 'response', 'rejection', 'ghosted', 'position_closed', 'other', 'standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'];

function buildShareText(summary: WeekSummary, level: number, totalXP: number, isThisWeek: boolean): string {
  const lines: string[] = [];
  lines.push(isThisWeek ? '💼 This week in my job search:' : '💼 Last week in my job search:');
  lines.push('');

  if (summary.totalXP > 0) {
    lines.push(`⚡ +${summary.totalXP} XP — Level ${level} (${totalXP.toLocaleString()} total)`);
  }

  if (summary.gameRounds > 0) {
    lines.push(`🎮 ${summary.gameRounds} game round${summary.gameRounds !== 1 ? 's' : ''} played`);
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
  lines.push('#JobSearch #MVUU');

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
  const hasActivity = summary.tasks.length > 0 || summary.outcomes.length > 0 || summary.gameRounds > 0 || summary.applications.length > 0;
  const shareText = hasActivity ? buildShareText(summary, level, totalXP, isThisWeek) : '';

  return (
    <div className="bg-white rounded-[22px] p-[18px]" style={{ border: '2px solid #F1E2CF' }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-fredoka font-bold text-[18px] text-[#2C2724]">{label}</h2>
          <p className="text-[12px] text-[#A99C8D] mt-0.5">{dateRange}</p>
        </div>
        {hasActivity && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onCopy(shareText)}
              className="px-3 py-1 rounded-[9px] text-[#6f6155] text-xs font-bold transition-colors hover:opacity-80"
              style={{ background: '#F2E8DB' }}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
            <a
              href={`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-[9px] text-xs font-bold transition-colors hover:opacity-80"
              style={{ background: '#E4F0FF', color: '#2563EB' }}
            >
              Bluesky
            </a>
          </div>
        )}
      </div>

      {!hasActivity ? (
        <p className="text-[#97887A] text-sm">
          {isThisWeek
            ? "No activity logged yet — head to the dashboard to get started."
            : "No activity logged this week."}
        </p>
      ) : (
        <div className="space-y-5">
          {summary.totalXP > 0 && (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-fredoka font-bold text-[26px] text-[#F5A300]">+{summary.totalXP}</span>
              <span className="font-bold text-[#2C2724]">XP earned</span>
              {[
                summary.taskXP > 0 ? `${summary.taskXP} tasks` : null,
                summary.outcomeXP > 0 ? `${summary.outcomeXP} results` : null,
                summary.gameXP > 0 ? `${summary.gameXP} games` : null,
              ].filter(Boolean).length > 1 && (
                <span className="text-[12px] text-[#A99C8D]">
                  ({[
                    summary.taskXP > 0 ? `${summary.taskXP} tasks` : null,
                    summary.outcomeXP > 0 ? `${summary.outcomeXP} results` : null,
                    summary.gameXP > 0 ? `${summary.gameXP} games` : null,
                  ].filter(Boolean).join(' + ')})
                </span>
              )}
            </div>
          )}

          {summary.applications.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-2">
                Applications submitted · {summary.applications.length}
              </p>
              <div className="space-y-1.5">
                {summary.applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-1 border-b border-[#F3EADD]">
                    <span className="font-bold text-[14px] text-[#2C2724]">
                      {app.company}{app.jobTitle ? <span className="font-normal text-[#97887A]"> — {app.jobTitle}</span> : null}
                    </span>
                    {app.dateApplied && (
                      <span className="text-xs text-[#A99C8D] tabular-nums shrink-0 ml-2">
                        {new Date(app.dateApplied + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.tasks.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-2">
                Tasks completed · {summary.tasks.length}
              </p>
              <div className="space-y-1.5">
                {CAT_ORDER.filter((c) => summary.byCategory[c]).map((cat) => {
                  const count = summary.byCategory[cat]!;
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <div key={cat} className="flex items-center justify-between py-1 border-b border-[#F3EADD]">
                      <span className="font-bold text-[14px] text-[#2C2724]">
                        <span className="mr-2">{cfg.icon}</span>{cfg.label}
                      </span>
                      <span className="font-bold text-[#2C2724] tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {summary.gameRounds > 0 && (
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-2">
                Games · {summary.gameRounds} round{summary.gameRounds !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[14px] text-[#2C2724]"><span className="mr-2">🎮</span>XP earned</span>
                <span className="font-bold text-[#F5A300] tabular-nums">+{summary.gameXP}</span>
              </div>
            </div>
          )}

          {summary.outcomes.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-2">
                Results logged · {summary.outcomes.length}
              </p>
              <div className="space-y-1.5">
                {OUTCOME_ORDER.filter((t) => summary.outcomeCounts[t]).map((type) => {
                  const count = summary.outcomeCounts[type]!;
                  const cfg = OUTCOME_CONFIG[type];
                  return (
                    <div key={type} className="flex items-center justify-between py-1 border-b border-[#F3EADD]">
                      <span className="font-bold text-[14px] text-[#2C2724]">
                        <span className="mr-2">{cfg.icon}</span>{cfg.label}
                      </span>
                      <span className="font-bold text-[#2C2724] tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {summary.badges.length > 0 && (
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-2">
                Badges unlocked
              </p>
              <div className="flex flex-wrap gap-2">
                {summary.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: '#FFF7E8', border: '2px solid #FCE3B0' }}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <span className="text-xs font-bold text-[#B45309]">{badge.name}</span>
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
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [levelHistory, setLevelHistory] = useState<LevelUpEvent[]>([]);
  const [mounted, setMounted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'this' | 'last' | null>(null);

  useEffect(() => {
    async function init() {
      const data = await loadState();
      if (data) {
        setTasks((data.tasks ?? []) as Task[]);
        setOutcomes((data.outcomes ?? []) as Outcome[]);
        setApplications((data.applications ?? []) as Application[]);
        setTotalXP((data.totalXP ?? 0) as number);
        setLevelHistory((data.levelHistory ?? []) as LevelUpEvent[]);
        const merged = getInitialBadges().map((b) => {
          const found = ((data.badges ?? []) as Badge[]).find((sb) => sb.id === b.id);
          return found ?? b;
        });
        setBadges(merged);
        setBadgeCount(merged.filter((b) => b.earned).length);
      }
      setMounted(true);
    }
    init();
  }, []);

  const handleCopy = (text: string, key: 'this' | 'last') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  if (!mounted) return null;

  const levelProgress = getLevelProgress(totalXP);
  const completedNonGameCount = tasks.filter((t) => t.completed && !GAME_ONLY_TASK_NAMES.has(t.name)).length;
  const thisWeek = buildWeekSummary(tasks, outcomes, badges, applications, 0);
  const lastWeek = buildWeekSummary(tasks, outcomes, badges, applications, 1);

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

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

        {/* Level History */}
        <div className="bg-white rounded-[22px] p-[18px]" style={{ border: '2px solid #F1E2CF' }}>
          <h2 className="font-fredoka font-bold text-[18px] text-[#2C2724] mb-4">Level History</h2>
          {levelHistory.length === 0 ? (
            <p className="text-[#97887A] text-sm">Level up events will appear here once you start earning XP.</p>
          ) : (
            <div className="space-y-0">
              {[...levelHistory].reverse().map((event, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[#F3EADD] last:border-0">
                  <span
                    className="font-fredoka font-bold text-xs px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5"
                    style={{ background: '#EEE7FF', color: '#7C5CFC', border: '2px solid #D4C7FF' }}
                  >
                    Lvl {event.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px] text-[#2C2724] leading-tight">{getLevelName(event.level)}</p>
                  </div>
                  <span className="text-xs text-[#A99C8D] flex-shrink-0 tabular-nums mt-0.5">
                    {new Date(event.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
