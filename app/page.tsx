'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Task, Badge, CompletionEvent, CustomActivity } from '@/lib/types';
import { Outcome, OutcomeResult, OutcomeType, OUTCOME_CONFIG, getOutcomeMessage } from '@/lib/outcomes';
import { getLevel, getLevelProgress, getInitialBadges, checkForNewBadges, checkForNewBadgesOnOutcome, calculateStreak, checkForStreakBadges } from '@/lib/gameLogic';
import { getRandomEncouragement } from '@/lib/encouragements';
import XPBar from '@/components/XPBar';
import StatsRow from '@/components/StatsRow';
import TaskCard from '@/components/TaskCard';
import AddTaskModal from '@/components/AddTaskModal';
import EncouragementModal from '@/components/EncouragementModal';
import LogOutcomeModal from '@/components/LogOutcomeModal';
import OutcomeResultModal from '@/components/OutcomeResultModal';
import ActivityFeed from '@/components/ActivityFeed';
import StreakCard from '@/components/StreakCard';
import ManageActivitiesModal from '@/components/ManageActivitiesModal';
import OnboardingModal from '@/components/OnboardingModal';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface AppState {
  tasks: Task[];
  outcomes: Outcome[];
  totalXP: number;
  badges: Badge[];
  customActivities: CustomActivity[];
  xpOverrides: Record<string, number>;
}

const STORAGE_KEY = 'gainfully-state';

function buildDefaultState(): AppState {
  return { tasks: [], outcomes: [], totalXP: 0, badges: getInitialBadges(), customActivities: [], xpOverrides: {} };
}

export default function Home() {
  const [state, setState] = useState<AppState>(buildDefaultState);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageActivitiesOpen, setIsManageActivitiesOpen] = useState(false);
  const [completionEvent, setCompletionEvent] = useState<CompletionEvent | null>(null);
  // null = closed, undefined = open with no preselection, string = open for specific task
  const [logOutcomeTaskId, setLogOutcomeTaskId] = useState<string | null | undefined>(null);
  const [outcomeResult, setOutcomeResult] = useState<OutcomeResult | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleOnboardingClose = useCallback(() => {
    localStorage.setItem('gainfully-onboarded', '1');
    setShowOnboarding(false);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppState;
        const mergedBadges = getInitialBadges().map((b) => {
          const savedBadge = parsed.badges?.find((sb) => sb.id === b.id);
          return savedBadge ?? b;
        });
        setState({
          tasks: parsed.tasks ?? [],
          outcomes: parsed.outcomes ?? [],
          totalXP: parsed.totalXP ?? 0,
          badges: mergedBadges,
          customActivities: parsed.customActivities ?? [],
          xpOverrides: parsed.xpOverrides ?? {},
        });
      } catch {
        // Ignore corrupted storage
      }
    }
    if (!localStorage.getItem('gainfully-onboarded')) {
      setShowOnboarding(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, mounted]);

  const handleAddTask = useCallback(
    (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
      const newTask: Task = {
        ...taskData,
        id: generateId(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    },
    []
  );

  const handleLogNow = useCallback(
    (taskData: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const newTask: Task = { ...taskData, id: generateId(), completed: true, completedAt: now, createdAt: now };

        const newTotalXP = prev.totalXP + newTask.xp;
        const oldLevel = getLevel(prev.totalXP);
        const newLevel = getLevel(newTotalXP);
        const completedTasks = prev.tasks.filter((t) => t.completed);
        const newBadges = checkForNewBadges(completedTasks, newTask, prev.badges, newTotalXP);

        const allTasks = [newTask, ...prev.tasks];
        const newStreak = calculateStreak(allTasks);
        const allCompleted = allTasks.filter((t) => t.completed);
        const streakBadges = checkForStreakBadges(newStreak, allCompleted, prev.badges);
        const allNewBadges = [...newBadges, ...streakBadges];
        const updatedBadges = prev.badges.map((b) => {
          const fresh = allNewBadges.find((nb) => nb.id === b.id);
          return fresh ?? b;
        });

        setTimeout(() => {
          setCompletionEvent({
            taskName: newTask.name,
            xpEarned: newTask.xp,
            newBadges: allNewBadges,
            leveledUp: newLevel > oldLevel,
            newLevel,
            message: getRandomEncouragement(),
          });
        }, 0);

        return { ...prev, tasks: allTasks, totalXP: newTotalXP, badges: updatedBadges };
      });
    },
    []
  );

  const handleCompleteTask = useCallback((taskId: string) => {
    setState((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task || task.completed) return prev;

      const newTotalXP = prev.totalXP + task.xp;
      const oldLevel = getLevel(prev.totalXP);
      const newLevel = getLevel(newTotalXP);
      const completedTasks = prev.tasks.filter((t) => t.completed);
      const newBadges = checkForNewBadges(completedTasks, task, prev.badges, newTotalXP);

      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
      );
      const newStreak = calculateStreak(updatedTasks);
      const allCompleted = updatedTasks.filter((t) => t.completed);
      const streakBadges = checkForStreakBadges(newStreak, allCompleted, prev.badges);
      const allNewBadges = [...newBadges, ...streakBadges];
      const updatedBadges = prev.badges.map((b) => {
        const fresh = allNewBadges.find((nb) => nb.id === b.id);
        return fresh ?? b;
      });

      setTimeout(() => {
        setCompletionEvent({
          taskName: task.name,
          xpEarned: task.xp,
          newBadges: allNewBadges,
          leveledUp: newLevel > oldLevel,
          newLevel,
          message: getRandomEncouragement(),
        });
      }, 0);

      return { ...prev, tasks: updatedTasks, totalXP: newTotalXP, badges: updatedBadges };
    });
  }, []);

  const handleAddCustomActivity = useCallback(
    (activity: Omit<CustomActivity, 'id' | 'createdAt'>) => {
      const newActivity: CustomActivity = {
        ...activity,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, customActivities: [...prev.customActivities, newActivity] }));
    },
    []
  );

  const handleSetXPOverride = useCallback((name: string, xp: number, defaultXP: number) => {
    setState((prev) => {
      const overrides = { ...prev.xpOverrides };
      if (xp === defaultXP) {
        delete overrides[name];
      } else {
        overrides[name] = xp;
      }
      return { ...prev, xpOverrides: overrides };
    });
  }, []);

  const handleDeleteCustomActivity = useCallback((activityId: string) => {
    setState((prev) => ({
      ...prev,
      customActivities: prev.customActivities.filter((a) => a.id !== activityId),
    }));
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      outcomes: prev.outcomes.filter((o) => o.taskId !== taskId),
    }));
  }, []);

  const handleLogOutcome = useCallback(
    (taskId: string, type: OutcomeType, date: string, notes: string) => {
      setState((prev) => {
        const config = OUTCOME_CONFIG[type];
        const newOutcome: Outcome = {
          id: generateId(),
          taskId,
          type,
          date,
          notes: notes || undefined,
          xpAwarded: config.xp,
          createdAt: new Date().toISOString(),
        };

        const newTotalXP = prev.totalXP + config.xp;
        const oldLevel = getLevel(prev.totalXP);
        const newLevel = getLevel(newTotalXP);
        const newBadges = checkForNewBadgesOnOutcome(
          prev.outcomes,
          newOutcome,
          prev.badges,
          newTotalXP
        );

        const updatedBadges = prev.badges.map((b) => {
          const fresh = newBadges.find((nb) => nb.id === b.id);
          return fresh ?? b;
        });

        setTimeout(() => {
          setLogOutcomeTaskId(null);
          setOutcomeResult({
            type,
            xpAwarded: config.xp,
            message: getOutcomeMessage(type),
            newBadges,
            leveledUp: newLevel > oldLevel,
            newLevel,
          });
        }, 0);

        return {
          ...prev,
          outcomes: [...prev.outcomes, newOutcome],
          totalXP: newTotalXP,
          badges: updatedBadges,
        };
      });
    },
    []
  );

  const activeTasks = state.tasks.filter((t) => !t.completed);
  const completedTasks = state.tasks.filter((t) => t.completed);
  const levelProgress = getLevelProgress(state.totalXP);
  const streak = calculateStreak(state.tasks);

  const logOutcomeModalOpen = logOutcomeTaskId !== null;
  const preselectedTask =
    typeof logOutcomeTaskId === 'string'
      ? (state.tasks.find((t) => t.id === logOutcomeTaskId) ?? null)
      : null;

  const taskOutcomes = (taskId: string) => state.outcomes.filter((o) => o.taskId === taskId);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-2xl mx-auto px-4 flex flex-wrap items-center py-2 gap-y-1 sm:flex-nowrap sm:h-16 sm:py-0">
          <div className="flex items-center gap-2 order-1">
            <span className="text-2xl">💼</span>
            <span className="text-xl font-bold text-slate-100 tracking-tight">Gainfully</span>
          </div>
          <nav className="flex gap-0.5 w-full sm:w-auto sm:ml-4 order-3 sm:order-2 pb-1 sm:pb-0">
            <span className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium">Dashboard</span>
            <Link href="/pipeline" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Pipeline</Link>
            <Link href="/progress" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Progress</Link>
            <Link href="/badges" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
              Badges{state.badges.filter((b) => b.earned).length > 0 && (
                <span className="ml-1.5 text-amber-400 font-bold">{state.badges.filter((b) => b.earned).length}</span>
              )}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 order-2 sm:order-3">
            <div className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full px-3 py-1">
              <span className="text-violet-300 font-semibold text-sm">Lvl {levelProgress.level}</span>
            </div>
            <span className="text-yellow-400 font-bold text-sm">{state.totalXP.toLocaleString()} XP</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-16">
        <p className="text-slate-500 text-sm text-center">
          Your job search, gamified — complete tasks, earn XP, and keep moving forward.
        </p>

        <XPBar
          level={levelProgress.level}
          current={levelProgress.current}
          needed={levelProgress.needed}
          percentage={levelProgress.percentage}
          totalXP={state.totalXP}
        />

        <StreakCard streak={streak} />

        <StatsRow
          level={levelProgress.level}
          tasksCompleted={completedTasks.length}
          badgesEarned={state.badges.filter((b) => b.earned).length}
          resultsLogged={state.outcomes.length}
        />

        {/* Activity log / planned tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-100 font-semibold">
              Planned
              {activeTasks.length > 0 && (
                <span className="ml-2 text-sm text-slate-400 font-normal">
                  {activeTasks.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              + Log Activity
            </button>
          </div>

          {activeTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700/60 p-8 text-center">
              <p className="text-slate-400 text-sm font-medium mb-0.5">Nothing planned yet.</p>
              <p className="text-slate-500 text-sm">Log what you just did, or plan something for later.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  outcomes={taskOutcomes(task.id)}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onLogOutcome={(taskId) => setLogOutcomeTaskId(taskId)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Results / activity feed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-100 font-semibold">
              Results
              {state.outcomes.length > 0 && (
                <span className="ml-2 text-sm text-slate-400 font-normal">
                  {state.outcomes.length}
                </span>
              )}
            </h2>
            <button
              onClick={() => setLogOutcomeTaskId(undefined)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors"
            >
              + Log a Result
            </button>
          </div>
          <ActivityFeed outcomes={state.outcomes} tasks={state.tasks} />
        </section>

        {/* Completed tasks (collapsible) */}
        {completedTasks.length > 0 && (
          <section>
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors mb-3"
            >
              <span className="text-xs">{showCompleted ? '▾' : '▸'}</span>
              Completed tasks ({completedTasks.length})
            </button>
            {showCompleted && (
              <div className="space-y-2.5">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    outcomes={taskOutcomes(task.id)}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                    onLogOutcome={(taskId) => setLogOutcomeTaskId(taskId)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTask}
        onLogNow={handleLogNow}
        customActivities={state.customActivities}
        xpOverrides={state.xpOverrides}
        onManageActivities={() => { setIsAddModalOpen(false); setIsManageActivitiesOpen(true); }}
      />
      <ManageActivitiesModal
        isOpen={isManageActivitiesOpen}
        onClose={() => setIsManageActivitiesOpen(false)}
        activities={state.customActivities}
        xpOverrides={state.xpOverrides}
        onAdd={handleAddCustomActivity}
        onDelete={handleDeleteCustomActivity}
        onSetOverride={handleSetXPOverride}
      />
      <EncouragementModal
        completionEvent={completionEvent}
        onClose={() => setCompletionEvent(null)}
      />
      <LogOutcomeModal
        isOpen={logOutcomeModalOpen}
        preselectedTask={preselectedTask}
        completedTasks={completedTasks}
        onClose={() => setLogOutcomeTaskId(null)}
        onLog={handleLogOutcome}
      />
      <OutcomeResultModal
        result={outcomeResult}
        onClose={() => setOutcomeResult(null)}
      />
      {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
    </div>
  );
}
