'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Badge, CompletionEvent, CustomActivity } from '@/lib/types';
import { Outcome, OutcomeResult, OutcomeType, OUTCOME_CONFIG, getOutcomeMessage } from '@/lib/outcomes';
import { getLevel, getLevelProgress, getInitialBadges, checkForNewBadges, checkForNewBadgesOnOutcome, calculateStreak, checkForStreakBadges, GAME_ONLY_TASK_NAMES, hadYesterdayGap, localDateStr } from '@/lib/gameLogic';
import { getRandomEncouragement, getRandomCelebration } from '@/lib/encouragements';
import { SLOTS_PICK_KEY, DailyPick } from '@/app/games/slots/page';
import AppHeader from '@/components/AppHeader';
import TaskCard from '@/components/TaskCard';
import AddTaskModal from '@/components/AddTaskModal';
import EncouragementModal from '@/components/EncouragementModal';
import LogOutcomeModal from '@/components/LogOutcomeModal';
import OutcomeResultModal from '@/components/OutcomeResultModal';
import ActivityFeed from '@/components/ActivityFeed';
import StreakCard from '@/components/StreakCard';
import ManageActivitiesModal from '@/components/ManageActivitiesModal';
import OnboardingModal from '@/components/OnboardingModal';
import ConsentModal from '@/components/ConsentModal';
import { loadState, saveState, loadConsentStatus, awardFreezeToken, applyStreakFreeze } from '@/lib/supabase/storage';
import { createClient } from '@/lib/supabase/client';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function trackEvent(name: string, params?: Record<string, string | number>) {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('event', name, params);
}

function getSlotsBonus(taskName: string): number {
  try {
    const raw = localStorage.getItem(SLOTS_PICK_KEY);
    if (!raw) return 0;
    const pick: DailyPick = JSON.parse(raw);
    if (pick.claimed) return 0;
    if (pick.date === new Date().toISOString().split('T')[0] && pick.activityName === taskName) {
      return pick.bonusXP;
    }
  } catch { /* ignore */ }
  return 0;
}

interface AppState {
  tasks: Task[];
  outcomes: Outcome[];
  totalXP: number;
  badges: Badge[];
  customActivities: CustomActivity[];
  xpOverrides: Record<string, number>;
}

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
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [freezeTokens, setFreezeTokens] = useState(0);
  const [frozenDates, setFrozenDates] = useState<string[]>([]);
  const [showFreezeBanner, setShowFreezeBanner] = useState(false);

  const handleOnboardingClose = useCallback(() => {
    localStorage.setItem('gainfully-onboarded', '1');
    setShowOnboarding(false);
  }, []);

  useEffect(() => {
    async function init() {
      const [data, consent] = await Promise.all([loadState(), loadConsentStatus()]);
      setIsSignedIn(consent?.signedIn ?? false);
      if (consent?.signedIn && !consent.consented) setShowConsent(true);
      if (data) {
        const parsed = data as unknown as AppState & { freezeTokens?: number; frozenDates?: string[] };
        const mergedBadges = getInitialBadges().map((b) => {
          const savedBadge = (parsed.badges ?? []).find((sb) => sb.id === b.id);
          return savedBadge ?? b;
        });
        const tasks = parsed.tasks ?? [];
        const outcomes = parsed.outcomes ?? [];
        const tokens = parsed.freezeTokens ?? 0;
        const frozen = parsed.frozenDates ?? [];
        setState({
          tasks,
          outcomes,
          totalXP: parsed.totalXP ?? 0,
          badges: mergedBadges,
          customActivities: parsed.customActivities ?? [],
          xpOverrides: parsed.xpOverrides ?? {},
        });
        setFreezeTokens(tokens);
        setFrozenDates(frozen);
        if (tokens > 0 && hadYesterdayGap(tasks, outcomes, frozen)) {
          setShowFreezeBanner(true);
        }
      }
      if (!localStorage.getItem('gainfully-onboarded')) {
        setShowOnboarding(true);
      }
      setMounted(true);
    }
    init();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: null | { user: unknown }) => {
      if (!session) {
        setState(buildDefaultState());
        setIsSignedIn(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mounted) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveState(state);
    }, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
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
      const slotsBonus = getSlotsBonus(taskData.name);
      const adjustedData = slotsBonus > 0 ? { ...taskData, xp: taskData.xp + slotsBonus } : taskData;
      setState((prev) => {
        const now = new Date().toISOString();
        const newTask: Task = { ...adjustedData, id: generateId(), completed: true, completedAt: now, createdAt: now };

        const newTotalXP = prev.totalXP + newTask.xp;
        const oldLevel = getLevel(prev.totalXP);
        const newLevel = getLevel(newTotalXP);
        const completedTasks = prev.tasks.filter((t) => t.completed);
        const newBadges = checkForNewBadges(completedTasks, newTask, prev.badges, newTotalXP);

        const allTasks = [newTask, ...prev.tasks];
        const newStreak = calculateStreak(allTasks, prev.outcomes, frozenDates);
        const allCompleted = allTasks.filter((t) => t.completed);
        const streakBadges = checkForStreakBadges(newStreak, allCompleted, prev.badges);
        const allNewBadges = [...newBadges, ...streakBadges];
        const updatedBadges = prev.badges.map((b) => {
          const fresh = allNewBadges.find((nb) => nb.id === b.id);
          return fresh ?? b;
        });

        setTimeout(() => {
          trackEvent('task_logged', { category: newTask.category, xp: newTask.xp });
          if (newLevel > oldLevel) {
            trackEvent('level_up', { level: newLevel });
            awardFreezeToken().catch(() => {});
            setFreezeTokens((prev) => prev + 1);
          }
          allNewBadges.forEach((b) => trackEvent('badge_earned', { badge_id: b.id }));
          setCompletionEvent({
            taskName: newTask.name,
            xpEarned: newTask.xp,
            newBadges: allNewBadges,
            leveledUp: newLevel > oldLevel,
            newLevel,
            message: getRandomEncouragement(),
            celebration: getRandomCelebration(),
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

      const slotsBonus = getSlotsBonus(task.name);
      const taskXP = task.xp + slotsBonus;
      const newTotalXP = prev.totalXP + taskXP;
      const oldLevel = getLevel(prev.totalXP);
      const newLevel = getLevel(newTotalXP);
      const completedTasks = prev.tasks.filter((t) => t.completed);
      const taskWithBonus = slotsBonus > 0 ? { ...task, xp: taskXP } : task;
      const newBadges = checkForNewBadges(completedTasks, taskWithBonus, prev.badges, newTotalXP);

      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString(), xp: taskXP } : t
      );
      const newStreak = calculateStreak(updatedTasks, prev.outcomes);
      const allCompleted = updatedTasks.filter((t) => t.completed);
      const streakBadges = checkForStreakBadges(newStreak, allCompleted, prev.badges);
      const allNewBadges = [...newBadges, ...streakBadges];
      const updatedBadges = prev.badges.map((b) => {
        const fresh = allNewBadges.find((nb) => nb.id === b.id);
        return fresh ?? b;
      });

      setTimeout(() => {
        trackEvent('task_completed', { category: task.category, xp: taskXP });
        if (newLevel > oldLevel) {
          trackEvent('level_up', { level: newLevel });
          awardFreezeToken().catch(() => {});
          setFreezeTokens((prev) => prev + 1);
        }
        allNewBadges.forEach((b) => trackEvent('badge_earned', { badge_id: b.id }));
        setCompletionEvent({
          taskName: task.name,
          xpEarned: taskXP,
          newBadges: allNewBadges,
          leveledUp: newLevel > oldLevel,
          newLevel,
          message: getRandomEncouragement(),
          celebration: getRandomCelebration(),
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
        const outcomeBadges = checkForNewBadgesOnOutcome(
          prev.outcomes,
          newOutcome,
          prev.badges,
          newTotalXP
        );

        const allOutcomes = [...prev.outcomes, newOutcome];
        const newStreak = calculateStreak(prev.tasks, allOutcomes, frozenDates);
        const streakBadges = checkForStreakBadges(newStreak, prev.tasks.filter((t) => t.completed), prev.badges);
        const allNewBadges = [...outcomeBadges, ...streakBadges];

        const updatedBadges = prev.badges.map((b) => {
          const fresh = allNewBadges.find((nb) => nb.id === b.id);
          return fresh ?? b;
        });

        setTimeout(() => {
          trackEvent('outcome_logged', { type, xp: config.xp });
          if (newLevel > oldLevel) {
            trackEvent('level_up', { level: newLevel });
            awardFreezeToken().catch(() => {});
            setFreezeTokens((prev) => prev + 1);
          }
          allNewBadges.forEach((b) => trackEvent('badge_earned', { badge_id: b.id }));
          setLogOutcomeTaskId(null);
          setOutcomeResult({
            type,
            xpAwarded: config.xp,
            message: getOutcomeMessage(type),
            newBadges: allNewBadges,
            leveledUp: newLevel > oldLevel,
            newLevel,
          });
        }, 0);

        return {
          ...prev,
          outcomes: allOutcomes,
          totalXP: newTotalXP,
          badges: updatedBadges,
        };
      });
    },
    []
  );

  const handleUseFreeze = useCallback(async () => {
    const now = new Date();
    const yesterday = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    setShowFreezeBanner(false);
    setFrozenDates((prev) => [...prev, yesterday]);
    setFreezeTokens((prev) => Math.max(0, prev - 1));
    await applyStreakFreeze(yesterday);
  }, []);

  const activeTasks = state.tasks.filter((t) => !t.completed);
  const completedTasks = state.tasks.filter((t) => t.completed);
  const GAME_TASK_NAMES = GAME_ONLY_TASK_NAMES;
  const completedNonGameCount = completedTasks.filter((t) => !GAME_TASK_NAMES.has(t.name)).length;
  const levelProgress = getLevelProgress(state.totalXP);
  const streak = calculateStreak(state.tasks, state.outcomes, frozenDates);

  const logOutcomeModalOpen = logOutcomeTaskId !== null;
  const preselectedTask =
    typeof logOutcomeTaskId === 'string'
      ? (state.tasks.find((t) => t.id === logOutcomeTaskId) ?? null)
      : null;

  const taskOutcomes = (taskId: string) => state.outcomes.filter((o) => o.taskId === taskId);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-16">
        <div className="rounded-[22px] bg-[#EEE7FF] px-6 py-5 flex items-center justify-between gap-4" style={{ border: '2px solid #D4C7FF', minHeight: '90px', overflow: 'hidden' }}>
          <p className="font-fredoka font-bold text-[28px] leading-tight text-[#2C2724]">
            Your job search,<br />gamified.
          </p>
          <div className="flex-shrink-0 flex items-end -mr-4 -mb-5 -mt-5">

            <img
              src="/dr_doomscroll.png"
              alt="Dr. Doomscroll"
              className="h-[60px] w-auto relative -ml-12"
              style={{ zIndex: 1 }}
            />
            <img
              src="/mvuu.png"
              alt="Mvuu"
              className="h-[130px] w-auto relative -ml-12"
              style={{ zIndex: 3 }}
            />
            <img
              src="/fulu.png"
              alt="Fulu"
              className="h-[120px] w-auto relative -ml-16"
              style={{ zIndex: 2 }}
            />

          </div>
        </div>

        {!isSignedIn && (
          <div
            className="rounded-[16px] px-4 py-3 text-center text-[13px] text-[#6f6155]"
            style={{ background: '#FFF0E0', border: '2px solid #EFE0CC' }}
          >
            Play away — but you&apos;ll need to{' '}
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="User profile"]')?.click()}
              className="font-semibold text-[#7C5CFC] underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              sign in
            </button>
            {' '}to save your progress.
          </div>
        )}

        {showFreezeBanner && (
          <div
            className="rounded-[16px] px-4 py-3 flex items-center gap-3"
            style={{ background: '#e0f2fe', border: '2px solid #bae6fd' }}
          >
            <span className="text-2xl flex-shrink-0">🧊</span>
            <div className="flex-1 min-w-0">
              <p className="font-fredoka font-bold text-[14px] text-[#0369a1]">Your streak is at risk</p>
              <p className="text-[12px] text-[#0284c7]">Use a freeze to protect yesterday&apos;s gap. ({freezeTokens} remaining)</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowFreezeBanner(false)}
                className="text-[12px] text-[#0369a1] font-semibold px-2 py-1 rounded-lg hover:bg-sky-100 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleUseFreeze}
                className="text-[12px] text-white font-semibold px-3 py-1 rounded-lg transition-colors"
                style={{ background: '#0369a1' }}
              >
                Use Freeze
              </button>
            </div>
          </div>
        )}

        <StreakCard streak={streak} freezeTokens={freezeTokens} />

        {/* Activity log / planned tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-fredoka font-bold text-[17px] text-[#2C2724]">
              Planned{activeTasks.length > 0 && <span className="ml-2 text-[#97887A] font-semibold text-[15px]">{activeTasks.length}</span>}
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl text-white text-sm font-fredoka font-semibold transition-colors"
              style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
            >
              + Log Activity
            </button>
          </div>

          {activeTasks.length === 0 ? (
            <div className="rounded-[18px] p-8 text-center" style={{ border: '2px dashed #EFE0CC' }}>
              <p className="text-[#2C2724] font-fredoka font-semibold mb-0.5">Nothing planned yet.</p>
              <p className="text-[#97887A] text-sm">Log what you just did, or plan something for later.</p>
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
            <h2 className="font-fredoka font-bold text-[17px] text-[#2C2724]">
              Results{state.outcomes.length > 0 && <span className="ml-2 text-[#97887A] font-semibold text-[15px]">{state.outcomes.length}</span>}
            </h2>
            <button
              onClick={() => setLogOutcomeTaskId(undefined)}
              className="px-4 py-2 rounded-xl text-[#6f6155] text-sm font-fredoka font-semibold transition-colors hover:bg-[#F2E8DB]"
              style={{ background: '#fff', border: '2px solid #EFE0CC' }}
            >
              + Log a Result
            </button>
          </div>
          <ActivityFeed outcomes={state.outcomes} tasks={state.tasks} />
        </section>

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
      {showConsent && <ConsentModal onDone={() => setShowConsent(false)} />}
    </div>
  );
}
