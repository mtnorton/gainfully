'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { Task, CATEGORY_CONFIG, TaskCategory } from '@/lib/types';
import { Outcome, OutcomeType, OUTCOME_CONFIG } from '@/lib/outcomes';
import { getLevelProgress } from '@/lib/gameLogic';
import TaskDetailModal from '@/components/TaskDetailModal';
import { loadState, saveState } from '@/lib/supabase/storage';

const PIPELINE_CATEGORIES: TaskCategory[] = ['application', 'networking', 'preparation', 'research'];

type StatusFilter = 'all' | 'active' | 'completed' | 'no-result';
type CategoryFilter = TaskCategory | 'all';
type OutcomeFilter = OutcomeType | 'all' | 'none';

const OUTCOME_FILTER_OPTIONS: { value: OutcomeFilter; label: string }[] = [
  { value: 'all', label: 'All results' },
  { value: 'none', label: 'No result logged' },
  { value: 'coffee_chat', label: '☕ Coffee Chat' },
  { value: 'informational_interview', label: '🗣️ Informational Interview' },
  { value: 'intro_made', label: '👋 Introduction Made' },
  { value: 'response', label: 'Got a Response' },
  { value: 'referral', label: 'Got a Referral' },
  { value: 'interview', label: 'Interview Scheduled' },
  { value: 'technical_screening', label: 'Technical Screening' },
  { value: 'technical_interview', label: 'Technical Interview' },
  { value: 'second_interview', label: 'Second Interview' },
  { value: 'offer', label: 'Offer Received' },
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
    async function init() {
      const data = await loadState();
      if (data) {
        setTasks((data.tasks ?? []) as Task[]);
        setOutcomes((data.outcomes ?? []) as Outcome[]);
        setTotalXP((data.totalXP ?? 0) as number);
        setBadgeCount(((data.badges ?? []) as { earned: boolean }[]).filter((b) => b.earned).length);
      }
      setMounted(true);
    }
    init();
  }, []);

  if (!mounted) return null;

  const levelProgress = getLevelProgress(totalXP);

  const handleLogOutcome = async (taskId: string, type: OutcomeType, date: string, notes: string) => {
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
      const data = await loadState();
      const state: Record<string, unknown> = data ?? { tasks: [], outcomes: [], totalXP: 0, badges: [], customActivities: [], xpOverrides: {} };
      state.outcomes = [...((state.outcomes as Outcome[]) ?? []), newOutcome];
      state.totalXP = ((state.totalXP as number) ?? 0) + config.xp;
      await saveState(state);
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

  const handleDeleteTask = async (taskId: string) => {
    try {
      const data = await loadState();
      const state: Record<string, unknown> = data ?? { tasks: [], outcomes: [], totalXP: 0, badges: [], customActivities: [], xpOverrides: {} };
      const deletedTask = (state.tasks as Task[])?.find((t) => t.id === taskId);
      const deletedOutcomesXP = (state.outcomes as Outcome[])
        ?.filter((o) => o.taskId === taskId)
        .reduce((sum, o) => sum + (o.xpAwarded ?? 0), 0) ?? 0;
      state.tasks = ((state.tasks as Task[]) ?? []).filter((t) => t.id !== taskId);
      state.outcomes = ((state.outcomes as Outcome[]) ?? []).filter((o) => o.taskId !== taskId);
      state.totalXP = ((state.totalXP as number) ?? 0) - (deletedTask?.xp ?? 0) - deletedOutcomesXP;
      await saveState(state);
    } catch {}
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setOutcomes((prev) => prev.filter((o) => o.taskId !== taskId));
    setSelectedTaskId(null);
  };

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;
  const selectedTaskOutcomes = outcomes
    .filter((o) => o.taskId === selectedTaskId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selectClass = 'rounded-xl px-3 py-2 text-[#6f6155] text-sm outline-none' +
    ' border-2 border-[#F1E2CF] bg-white focus:border-[#7C5CFC] transition-colors';

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-fredoka font-bold text-[22px] text-[#2C2724]">Track</h1>
            <p className="text-[12px] text-[#97887A] mt-0.5">
              {tasks.length} total tasks · {sorted.length} shown · click any row to view details
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#6f6155] text-sm font-fredoka font-semibold transition-colors hover:bg-[#F2E8DB] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#fff', border: '2px solid #EFE0CC' }}
          >
            ↓ Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, companies…"
            className="flex-1 min-w-48 rounded-xl px-4 py-2 text-[#2C2724] text-sm outline-none"
            style={{ background: '#fff', border: '2px solid #F1E2CF' }}
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
          <div className="rounded-[22px] p-12 text-center" style={{ border: '2px dashed #EFE0CC' }}>
            <div className="text-4xl mb-3">🗂️</div>
            <p className="font-fredoka font-semibold text-[#2C2724] mb-1">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </p>
            <p className="text-[#97887A] text-sm">
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
                    className="bg-white rounded-[16px] p-3 cursor-pointer transition-colors hover:bg-[#FBF3E8]"
                    style={{ border: mightBeGhosted ? '2px solid #FCD34D' : '2px solid #F1E2CF' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-[#2C2724] leading-snug">{task.name}</p>
                      <span className="text-xs text-[#F5A300] font-bold whitespace-nowrap shrink-0">+{task.xp + outcomesXP} XP</span>
                    </div>
                    {(task.company || task.jobTitle) && (
                      <p className="text-xs text-[#97887A] mt-0.5">{[task.company, task.jobTitle].filter(Boolean).join(' · ')}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${catConfig.colorClasses}`}>
                        {catConfig.icon} {catConfig.label}
                      </span>
                      <span className="text-xs text-[#A99C8D]">{fmtShortDate(taskDate)}</span>
                      {task.completed ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#F2E8DB] text-[#7C6F63] border border-[#EFE0CC]">Done</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#DCFAE7] text-[#16A34A] border border-[#B0EFC8]">Active</span>
                      )}
                    </div>
                    {latest && outcomeConfig ? (
                      <div className="mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${outcomeConfig.colorClasses}`}>
                          {outcomeConfig.icon} {outcomeConfig.label}
                        </span>
                        <span className="text-xs text-[#A99C8D] ml-1.5">{fmtShortDate(latest.date)}</span>
                      </div>
                    ) : mightBeGhosted ? (
                      <p className="text-xs text-[#D97706] mt-1.5 flex items-center gap-1">👻 No response in 14d+</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Desktop: condensed 3-column table */}
            <div className="hidden md:block rounded-[18px] overflow-hidden" style={{ border: '2px solid #F1E2CF' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#FBF3E8', borderBottom: '1px solid #F3EADD' }}>
                    <th className="text-left text-xs text-[#A99C8D] font-extrabold uppercase tracking-wider px-4 py-3">Task</th>
                    <th className="text-left text-xs text-[#A99C8D] font-extrabold uppercase tracking-wider px-4 py-3">Latest Result</th>
                    <th className="text-right text-xs text-[#A99C8D] font-extrabold uppercase tracking-wider px-4 py-3">XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EADD]">
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
                            ? 'hover:bg-amber-50'
                            : 'hover:bg-[#FBF3E8]'
                        }`}
                        style={mightBeGhosted ? { background: '#FFFBEB' } : {}}
                      >
                        <td className="px-4 py-3">
                          <p className="font-fredoka font-semibold text-[14px] leading-snug text-[#2C2724]">{task.name}</p>
                          {(task.company || task.jobTitle) && (
                            <p className="text-xs text-[#A99C8D] mt-0.5">
                              {[task.company, task.jobTitle].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${catConfig.colorClasses}`}>
                              {catConfig.icon} {catConfig.label}
                            </span>
                            <span className="text-xs text-[#A99C8D]">{fmtShortDate(taskDate)}</span>
                            {task.completed ? (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#F2E8DB', color: '#7C6F63' }}>Done</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#DCFAE7', color: '#16A34A' }}>Active</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {latest && outcomeConfig ? (
                            <div>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${outcomeConfig.colorClasses}`}>
                                {outcomeConfig.icon} {outcomeConfig.label}
                              </span>
                              <p className="text-xs text-[#A99C8D] mt-0.5">{fmtShortDate(latest.date)}</p>
                            </div>
                          ) : mightBeGhosted ? (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <span>👻</span> No response in 14d+
                            </span>
                          ) : (
                            <span className="text-xs text-[#C3B8A9]">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="text-xs text-[#F5A300] font-bold">
                            +{task.xp + outcomesXP} XP
                          </span>
                          {outcomesXP > 0 && (
                            <p className="text-xs text-[#A99C8D] mt-0.5">
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
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
