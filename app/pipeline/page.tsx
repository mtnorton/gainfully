'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Task, CATEGORY_CONFIG, TaskCategory } from '@/lib/types';
import { Outcome, OutcomeType, OUTCOME_CONFIG } from '@/lib/outcomes';
import { getLevelProgress } from '@/lib/gameLogic';
import TaskDetailModal from '@/components/TaskDetailModal';

const STORAGE_KEY = 'gainfully-state';

const PIPELINE_CATEGORIES: TaskCategory[] = ['application', 'networking', 'preparation', 'research'];

type StatusFilter = 'all' | 'active' | 'completed' | 'no-result';
type CategoryFilter = TaskCategory | 'all';
type OutcomeFilter = OutcomeType | 'all' | 'none';

const OUTCOME_FILTER_OPTIONS: { value: OutcomeFilter; label: string }[] = [
  { value: 'all', label: 'All results' },
  { value: 'none', label: 'No result logged' },
  { value: 'interview', label: 'Interview Scheduled' },
  { value: 'second_interview', label: 'Second Interview' },
  { value: 'offer', label: 'Offer Received' },
  { value: 'response', label: 'Got a Response' },
  { value: 'referral', label: 'Got a Referral' },
  { value: 'rejection', label: 'Rejection' },
  { value: 'ghosted', label: 'Ghosted' },
  { value: 'position_closed', label: 'Position Closed' },
  { value: 'standard_nonsense', label: '🙄 Standard Nonsense' },
  { value: 'ridiculous_nonsense', label: '🤦 Ridiculous Nonsense' },
  { value: 'outrageous_nonsense', label: '🤯 Outrageous Nonsense' },
];

function csvEscape(v: string | undefined | null): string {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function fmtShortDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

export default function PipelinePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTasks(parsed.tasks ?? []);
        setOutcomes(parsed.outcomes ?? []);
        setTotalXP(parsed.totalXP ?? 0);
        setBadgeCount((parsed.badges ?? []).filter((b: { earned: boolean }) => b.earned).length);
      }
    } catch {}
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const levelProgress = getLevelProgress(totalXP);

  const handleLogOutcome = (taskId: string, type: OutcomeType, date: string, notes: string) => {
    const config = OUTCOME_CONFIG[type];
    const newOutcome: Outcome = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      taskId,
      type,
      date,
      notes: notes || undefined,
      xpAwarded: config.xp,
      createdAt: new Date().toISOString(),
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        state.outcomes = [...(state.outcomes ?? []), newOutcome];
        state.totalXP = (state.totalXP ?? 0) + config.xp;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch {}
    setOutcomes((prev) => [...prev, newOutcome]);
    setTotalXP((prev) => prev + config.xp);
  };

  // Enrich rows with outcome data — self-care excluded from pipeline
  const rows = tasks.filter((t) => t.category !== 'selfcare').map((task) => {
    const taskOutcomes = outcomes
      .filter((o) => o.taskId === task.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = taskOutcomes[0] ?? null;
    const daysSince =
      task.completed && task.completedAt
        ? Math.floor((Date.now() - new Date(task.completedAt).getTime()) / 86_400_000)
        : null;
    const mightBeGhosted =
      task.completed && daysSince !== null && daysSince >= 14 &&
      ['application', 'networking'].includes(task.category) &&
      taskOutcomes.length === 0;
    const outcomesXP = taskOutcomes.reduce((sum, o) => sum + (o.xpAwarded ?? 0), 0);
    return { task, taskOutcomes, latest, daysSince, mightBeGhosted, outcomesXP };
  });

  // Filters
  const filtered = rows.filter(({ task, taskOutcomes, latest }) => {
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    if (statusFilter === 'active' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (statusFilter === 'no-result' && (!task.completed || taskOutcomes.length > 0)) return false;
    if (outcomeFilter === 'none' && taskOutcomes.length > 0) return false;
    if (outcomeFilter !== 'all' && outcomeFilter !== 'none' && latest?.type !== outcomeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!task.name.toLowerCase().includes(q) &&
          !(task.company?.toLowerCase().includes(q)) &&
          !(task.jobTitle?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dA = a.task.activityDate ?? a.task.createdAt;
    const dB = b.task.activityDate ?? b.task.createdAt;
    return new Date(dB).getTime() - new Date(dA).getTime();
  });

  const handleExportCSV = () => {
    const headers = ['Task', 'Category', 'Company / Contact', 'Job Title', 'Date', 'Status', 'XP', 'Latest Result', 'Result Date', 'Notes'];
    const csvRows = sorted.map(({ task, latest }) => [
      csvEscape(task.name),
      csvEscape(CATEGORY_CONFIG[task.category]?.label),
      csvEscape(task.company),
      csvEscape(task.jobTitle),
      csvEscape(task.activityDate ?? task.createdAt.split('T')[0]),
      csvEscape(task.completed ? 'Completed' : 'Active'),
      csvEscape(String(task.xp)),
      csvEscape(latest ? OUTCOME_CONFIG[latest.type]?.label : ''),
      csvEscape(latest?.date),
      csvEscape(latest?.notes),
    ].join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gainfully-pipeline-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;
  const selectedTaskOutcomes = outcomes
    .filter((o) => o.taskId === selectedTaskId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selectClass = 'bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none transition-colors';

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center py-2 gap-y-1 sm:flex-nowrap sm:h-16 sm:py-0">
          <div className="flex items-center gap-2 order-1">
            <span className="text-2xl">💼</span>
            <span className="text-xl font-bold text-slate-100 tracking-tight">Gainfully</span>
          </div>
          <nav className="flex gap-0.5 w-full sm:w-auto sm:ml-4 order-3 sm:order-2 pb-1 sm:pb-0">
            <Link href="/" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Dashboard</Link>
            <span className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium">Pipeline</span>
            <Link href="/progress" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Progress</Link>
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

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Pipeline</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {tasks.length} total tasks · {sorted.length} shown · click any row to view details
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>↓</span> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, companies..."
            className="bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2 text-slate-200 text-sm outline-none transition-colors flex-1 min-w-48 placeholder-slate-500"
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)} className={selectClass}>
            <option value="all">All categories</option>
            {PIPELINE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="no-result">Completed, no result</option>
          </select>
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value as OutcomeFilter)} className={selectClass}>
            {OUTCOME_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700/60 p-12 text-center">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="text-slate-300 font-medium mb-1">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </p>
            <p className="text-slate-500 text-sm">
              {tasks.length === 0 ? 'Head back to the dashboard to add your first task.' : 'Try adjusting the filters above.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden space-y-2">
              {sorted.map(({ task, latest, mightBeGhosted, outcomesXP }) => {
                const catConfig = CATEGORY_CONFIG[task.category] ?? CATEGORY_CONFIG['research'];
                const outcomeConfig = latest ? OUTCOME_CONFIG[latest.type] : null;
                const taskDate = task.activityDate ?? task.createdAt.split('T')[0];

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                      mightBeGhosted
                        ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                        : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-100 leading-snug">{task.name}</p>
                      <span className="text-xs text-yellow-400 font-semibold whitespace-nowrap shrink-0">+{task.xp + outcomesXP} XP</span>
                    </div>
                    {(task.company || task.jobTitle) && (
                      <p className="text-xs text-slate-500 mt-0.5">{[task.company, task.jobTitle].filter(Boolean).join(' · ')}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${catConfig.colorClasses}`}>
                        {catConfig.icon} {catConfig.label}
                      </span>
                      <span className="text-xs text-slate-500">{fmtShortDate(taskDate)}</span>
                      {task.completed ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/40">Done</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
                      )}
                    </div>
                    {latest && outcomeConfig ? (
                      <div className="mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${outcomeConfig.colorClasses}`}>
                          {outcomeConfig.icon} {outcomeConfig.label}
                        </span>
                        <span className="text-xs text-slate-500 ml-1.5">{fmtShortDate(latest.date)}</span>
                      </div>
                    ) : mightBeGhosted ? (
                      <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1">👻 No response in 14d+</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Desktop: condensed 3-column table */}
            <div className="hidden md:block rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/60 border-b border-slate-700/60">
                    <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-4 py-3">Task</th>
                    <th className="text-left text-xs text-slate-400 font-medium uppercase tracking-wider px-4 py-3">Latest Result</th>
                    <th className="text-right text-xs text-slate-400 font-medium uppercase tracking-wider px-4 py-3">XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sorted.map(({ task, latest, mightBeGhosted, outcomesXP }) => {
                    const catConfig = CATEGORY_CONFIG[task.category] ?? CATEGORY_CONFIG['research'];
                    const outcomeConfig = latest ? OUTCOME_CONFIG[latest.type] : null;
                    const taskDate = task.activityDate ?? task.createdAt.split('T')[0];

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`cursor-pointer transition-colors ${
                          mightBeGhosted
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium leading-snug text-slate-100">{task.name}</p>
                          {(task.company || task.jobTitle) && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {[task.company, task.jobTitle].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${catConfig.colorClasses}`}>
                              {catConfig.icon} {catConfig.label}
                            </span>
                            <span className="text-xs text-slate-500">{fmtShortDate(taskDate)}</span>
                            {task.completed ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/40">Done</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {latest && outcomeConfig ? (
                            <div>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${outcomeConfig.colorClasses}`}>
                                {outcomeConfig.icon} {outcomeConfig.label}
                              </span>
                              <p className="text-xs text-slate-500 mt-0.5">{fmtShortDate(latest.date)}</p>
                            </div>
                          ) : mightBeGhosted ? (
                            <span className="text-xs text-amber-400/80 flex items-center gap-1">
                              <span>👻</span> No response in 14d+
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-xs text-yellow-400 font-semibold">
                            +{task.xp + outcomesXP} XP
                          </span>
                          {outcomesXP > 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {task.xp} + {outcomesXP}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {sorted.some((r) => r.mightBeGhosted) && (
          <p className="text-xs text-amber-400/60 mt-3 flex items-center gap-1.5">
            <span>👻</span>
            Amber rows are completed application or networking tasks with no result logged after 14 days.
          </p>
        )}
      </main>

      <TaskDetailModal
        task={selectedTask}
        outcomes={selectedTaskOutcomes}
        onClose={() => setSelectedTaskId(null)}
        onLogOutcome={handleLogOutcome}
      />
    </div>
  );
}
