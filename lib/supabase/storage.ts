import { createClient } from './client';
import { Application, Task, TaskCategory, CustomActivity, Badge, LevelUpEvent } from '@/lib/types';
import { Outcome, OutcomeType } from '@/lib/outcomes';
import { getInitialBadges } from '@/lib/gameLogic';

// ── session ───────────────────────────────────────────────────────────────────

export async function ensureSession(): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) console.error('[gainfully] ensureSession:', error);
  }
}

// ── loadState ─────────────────────────────────────────────────────────────────

export async function loadState(): Promise<Record<string, unknown> | null> {
  const supabase = createClient();
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data } = await supabase.auth.signInAnonymously();
    session = data.session;
  }
  if (!session) return null;
  const userId = session.user.id;

  const [appsRes, tasksRes, outcomesRes, badgesRes, activitiesRes, settingsRes] = await Promise.all([
    supabase.from('applications').select('*').eq('user_id', userId),
    supabase.from('tasks').select('*').eq('user_id', userId).eq('archived', false),
    supabase.from('outcomes').select('*').eq('user_id', userId).eq('archived', false),
    supabase.from('user_badges').select('*').eq('user_id', userId),
    supabase.from('custom_activities').select('*').eq('user_id', userId),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (appsRes.error)       console.error('[gainfully] loadState applications:', appsRes.error);
  if (tasksRes.error)      console.error('[gainfully] loadState tasks:', tasksRes.error);
  if (outcomesRes.error)   console.error('[gainfully] loadState outcomes:', outcomesRes.error);
  if (badgesRes.error)     console.error('[gainfully] loadState badges:', badgesRes.error);
  if (activitiesRes.error) console.error('[gainfully] loadState activities:', activitiesRes.error);
  if (settingsRes.error)   console.error('[gainfully] loadState settings:', settingsRes.error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applications: Application[] = (appsRes.data ?? []).map((r: any) => ({
    id:          r.id,
    company:     r.company,
    jobTitle:    r.job_title    ?? undefined,
    url:         r.url          ?? undefined,
    platform:    r.platform     ?? undefined,
    dateApplied: r.date_applied ?? undefined,
    notes:       r.notes        ?? undefined,
    createdAt:   r.created_at,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks: Task[] = (tasksRes.data ?? []).map((r: any) => ({
    id:            r.id,
    name:          r.name,
    category:      r.category as TaskCategory,
    xp:            r.xp,
    completed:     r.completed,
    completedAt:   r.completed_at    ?? undefined,
    createdAt:     r.created_at,
    applicationId: r.application_id  ?? undefined,
    company:       r.company         ?? undefined,
    jobTitle:      r.job_title       ?? undefined,
    activityDate:  r.activity_date   ?? undefined,
    ats:           r.ats             ?? undefined,
    platform:      r.platform        ?? undefined,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outcomes: Outcome[] = (outcomesRes.data ?? []).map((r: any) => ({
    id:            r.id,
    taskId:        r.task_id        ?? undefined,
    applicationId: r.application_id ?? undefined,
    type:          r.type as OutcomeType,
    date:          r.date,
    notes:         r.notes          ?? undefined,
    xpAwarded:     r.xp_awarded,
    createdAt:     r.created_at,
  }));

  const earnedMap = new Map<string, string>(
    (badgesRes.data ?? []).map((r: any) => [r.badge_id as string, r.earned_at as string])  // eslint-disable-line @typescript-eslint/no-explicit-any
  );
  const badges: Badge[] = getInitialBadges().map((b) => ({
    ...b,
    earned:   earnedMap.has(b.id),
    earnedAt: earnedMap.get(b.id) as string | undefined,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customActivities: CustomActivity[] = (activitiesRes.data ?? []).map((r: any) => ({
    id:        r.id,
    name:      r.name,
    category:  r.category as TaskCategory,
    xp:        r.xp,
    createdAt: r.created_at,
  }));

  const xpOverrides = (settingsRes.data?.xp_overrides ?? {}) as Record<string, number>;
  const freezeTokens = (settingsRes.data?.freeze_tokens ?? 0) as number;
  const frozenDates = (settingsRes.data?.frozen_dates ?? []) as string[];
  const levelHistory = (settingsRes.data?.level_history ?? []) as LevelUpEvent[];

  const retainedXP = (settingsRes.data?.retained_xp ?? 0) as number;
  const totalXP =
    tasks.filter((t) => t.completed).reduce((s, t) => s + t.xp, 0) +
    outcomes.reduce((s, o) => s + o.xpAwarded, 0) +
    retainedXP;

  return { applications, tasks, outcomes, totalXP, badges, customActivities, xpOverrides, freezeTokens, frozenDates, levelHistory };
}

// ── consent ───────────────────────────────────────────────────────────────────

export async function loadConsentStatus(): Promise<{
  signedIn: boolean;
  isAnonymous: boolean;
  consented: boolean;
  emailReminders: boolean;
  emailHippoJokes: boolean;
} | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { signedIn: false, isAnonymous: false, consented: false, emailReminders: false, emailHippoJokes: false };

  const { data } = await supabase
    .from('user_settings')
    .select('consented_at, email_reminders, email_hippo_jokes')
    .eq('user_id', session.user.id)
    .maybeSingle();

  return {
    signedIn: true,
    isAnonymous: session.user.is_anonymous ?? false,
    consented: !!data?.consented_at,
    emailReminders: data?.email_reminders ?? false,
    emailHippoJokes: data?.email_hippo_jokes ?? false,
  };
}

export async function saveConsent(emailReminders: boolean, emailHippoJokes: boolean): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: session.user.id,
      consented_at: new Date().toISOString(),
      email_reminders: emailReminders,
      email_hippo_jokes: emailHippoJokes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) console.error('[gainfully] saveConsent:', error);
}

export async function saveEmailPrefs(emailReminders: boolean, emailHippoJokes: boolean): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: session.user.id,
      email_reminders: emailReminders,
      email_hippo_jokes: emailHippoJokes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) console.error('[gainfully] saveEmailPrefs:', error);
}

// ── streak freeze ─────────────────────────────────────────────────────────────

export async function awardFreezeToken(): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { data } = await supabase
    .from('user_settings').select('freeze_tokens').eq('user_id', session.user.id).maybeSingle();
  const current = (data?.freeze_tokens ?? 0) as number;
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: session.user.id, freeze_tokens: current + 1, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) console.error('[gainfully] awardFreezeToken:', error);
}

export async function applyStreakFreeze(frozenDate: string): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { data } = await supabase
    .from('user_settings').select('freeze_tokens, frozen_dates').eq('user_id', session.user.id).maybeSingle();
  const tokens = Math.max(0, ((data?.freeze_tokens ?? 0) as number) - 1);
  const dates = [...((data?.frozen_dates ?? []) as string[]), frozenDate];
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: session.user.id, freeze_tokens: tokens, frozen_dates: dates, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) console.error('[gainfully] applyStreakFreeze:', error);
}

// ── saveState ─────────────────────────────────────────────────────────────────

export async function saveState(state: unknown): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const userId = session.user.id;

  const s = state as {
    applications?:     Application[];
    tasks?:            Task[];
    outcomes?:         Outcome[];
    badges?:           Badge[];
    customActivities?: CustomActivity[];
    xpOverrides?:      Record<string, number>;
    levelHistory?:     LevelUpEvent[];
  };

  const applications     = s.applications     ?? [];
  const tasks            = s.tasks            ?? [];
  const outcomes         = s.outcomes         ?? [];
  const badges           = s.badges           ?? [];
  const customActivities = s.customActivities ?? [];
  const xpOverrides      = s.xpOverrides      ?? {};
  const levelHistory     = s.levelHistory     ?? [];

  async function syncTable(
    table: string,
    currentIds: string[],
    rows: object[],
  ) {
    const { data: existing, error } = await supabase
      .from(table).select('id').eq('user_id', userId).eq('archived', false);
    if (error) { console.error(`[gainfully] saveState ${table} fetch:`, error); return; }

    const toDelete = (existing ?? [])
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !currentIds.includes(id));

    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from(table).delete().eq('user_id', userId).in('id', toDelete);
      if (delErr) console.error(`[gainfully] saveState ${table} delete:`, delErr);
    }

    if (rows.length > 0) {
      const { error: upsErr } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
      if (upsErr) console.error(`[gainfully] saveState ${table} upsert:`, upsErr);
    }
  }

  // Save applications first — tasks may FK-reference application IDs
  await (async () => {
    const { data: existing } = await supabase
      .from('applications').select('id').eq('user_id', userId);
    const currentIds = new Set(applications.map((a) => a.id));
    const toDelete = (existing ?? []).map((r: { id: string }) => r.id).filter((id: string) => !currentIds.has(id));
    if (toDelete.length > 0) {
      const { error } = await supabase.from('applications').delete().eq('user_id', userId).in('id', toDelete);
      if (error) console.error('[gainfully] saveState applications delete:', error);
    }
    if (applications.length > 0) {
      const { error } = await supabase.from('applications').upsert(
        applications.map((a) => ({
          id:           a.id,
          user_id:      userId,
          company:      a.company,
          job_title:    a.jobTitle    ?? null,
          url:          a.url         ?? null,
          platform:     a.platform    ?? null,
          date_applied: a.dateApplied ?? null,
          notes:        a.notes       ?? null,
          created_at:   a.createdAt,
        })),
        { onConflict: 'id' },
      );
      if (error) console.error('[gainfully] saveState applications upsert:', error);
    }
  })();

  await Promise.all([
    syncTable(
      'tasks',
      tasks.map((t) => t.id),
      tasks.map((t) => ({
        id:             t.id,
        user_id:        userId,
        name:           t.name,
        category:       t.category,
        xp:             t.xp,
        completed:      t.completed,
        completed_at:   t.completedAt    ?? null,
        created_at:     t.createdAt,
        application_id: t.applicationId  ?? null,
        company:        t.company        ?? null,
        job_title:      t.jobTitle       ?? null,
        activity_date:  t.activityDate   ?? null,
        ats:            t.ats            ?? null,
        platform:       t.platform       ?? null,
      })),
    ),

    syncTable(
      'outcomes',
      outcomes.map((o) => o.id),
      outcomes.map((o) => ({
        id:             o.id,
        user_id:        userId,
        task_id:        o.taskId        ?? null,
        application_id: o.applicationId ?? null,
        type:           o.type,
        date:           o.date,
        notes:          o.notes         ?? null,
        xp_awarded:     o.xpAwarded,
        created_at:     o.createdAt,
      })),
    ),

    syncTable(
      'custom_activities',
      customActivities.map((a) => a.id),
      customActivities.map((a) => ({
        id:         a.id,
        user_id:    userId,
        name:       a.name,
        category:   a.category,
        xp:         a.xp,
        created_at: a.createdAt,
      })),
    ),

    (async () => {
      const earned = badges.filter((b) => b.earned);
      if (earned.length === 0) return;
      const { error: upsertErr } = await supabase.from('user_badges').upsert(
        earned.map((b) => ({
          user_id:   userId,
          badge_id:  b.id,
          earned_at: b.earnedAt ?? new Date().toISOString(),
        })),
        { onConflict: 'user_id,badge_id' }
      );
      if (upsertErr) console.error('[gainfully] saveState badges upsert:', upsertErr);
    })(),

    (async () => {
      const { error } = await supabase.from('user_settings').upsert(
        { user_id: userId, xp_overrides: xpOverrides, level_history: levelHistory, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error) console.error('[gainfully] saveState settings:', error);
    })(),
  ]);
}

// ── archiveSearch ─────────────────────────────────────────────────────────────

export async function archiveSearch(keepXP: boolean): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const userId = session.user.id;

  let retainedXP = 0;
  if (keepXP) {
    const [tasksRes, outcomesRes, settingsRes] = await Promise.all([
      supabase.from('tasks').select('xp, completed').eq('user_id', userId).eq('archived', false),
      supabase.from('outcomes').select('xp_awarded').eq('user_id', userId).eq('archived', false),
      supabase.from('user_settings').select('retained_xp').eq('user_id', userId).maybeSingle(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskXP = (tasksRes.data ?? []).reduce((s: number, t: any) => s + (t.completed ? t.xp : 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outcomeXP = (outcomesRes.data ?? []).reduce((s: number, o: any) => s + o.xp_awarded, 0);
    retainedXP = ((settingsRes.data?.retained_xp ?? 0) as number) + taskXP + outcomeXP;
  }

  await supabase.from('applications').update({ archived: true }).eq('user_id', userId).eq('archived', false);
  await supabase.from('tasks').update({ archived: true }).eq('user_id', userId).eq('archived', false);
  await supabase.from('outcomes').update({ archived: true }).eq('user_id', userId).eq('archived', false);
  if (!keepXP) {
    await supabase.from('user_badges').update({ archived: true }).eq('user_id', userId).eq('archived', false);
  }
  const { error } = await supabase.from('user_settings').upsert(
    { user_id: userId, retained_xp: retainedXP, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) console.error('[gainfully] archiveSearch settings:', error);
}
