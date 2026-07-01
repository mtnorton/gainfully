import { createClient } from './client';
import { Task, TaskCategory, CustomActivity, Badge } from '@/lib/types';
import { Outcome, OutcomeType } from '@/lib/outcomes';
import { getInitialBadges } from '@/lib/gameLogic';

// ── loadState ─────────────────────────────────────────────────────────────────

export async function loadState(): Promise<Record<string, unknown> | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const userId = session.user.id;

  const [tasksRes, outcomesRes, badgesRes, activitiesRes, settingsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('outcomes').select('*').eq('user_id', userId),
    supabase.from('user_badges').select('*').eq('user_id', userId),
    supabase.from('custom_activities').select('*').eq('user_id', userId),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (tasksRes.error)      console.error('[gainfully] loadState tasks:', tasksRes.error);
  if (outcomesRes.error)   console.error('[gainfully] loadState outcomes:', outcomesRes.error);
  if (badgesRes.error)     console.error('[gainfully] loadState badges:', badgesRes.error);
  if (activitiesRes.error) console.error('[gainfully] loadState activities:', activitiesRes.error);
  if (settingsRes.error)   console.error('[gainfully] loadState settings:', settingsRes.error);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasks: Task[] = (tasksRes.data ?? []).map((r: any) => ({
    id:           r.id,
    name:         r.name,
    category:     r.category as TaskCategory,
    xp:           r.xp,
    completed:    r.completed,
    completedAt:  r.completed_at   ?? undefined,
    createdAt:    r.created_at,
    company:      r.company        ?? undefined,
    jobTitle:     r.job_title      ?? undefined,
    activityDate: r.activity_date  ?? undefined,
    ats:          r.ats            ?? undefined,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outcomes: Outcome[] = (outcomesRes.data ?? []).map((r: any) => ({
    id:         r.id,
    taskId:     r.task_id,
    type:       r.type as OutcomeType,
    date:       r.date,
    notes:      r.notes      ?? undefined,
    xpAwarded:  r.xp_awarded,
    createdAt:  r.created_at,
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

  const totalXP =
    tasks.filter((t) => t.completed).reduce((s, t) => s + t.xp, 0) +
    outcomes.reduce((s, o) => s + o.xpAwarded, 0);

  return { tasks, outcomes, totalXP, badges, customActivities, xpOverrides, freezeTokens, frozenDates };
}

// ── consent ───────────────────────────────────────────────────────────────────

export async function loadConsentStatus(): Promise<{
  signedIn: boolean;
  consented: boolean;
  emailReminders: boolean;
  emailHippoJokes: boolean;
} | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { signedIn: false, consented: false, emailReminders: false, emailHippoJokes: false };

  const { data } = await supabase
    .from('user_settings')
    .select('consented_at, email_reminders, email_hippo_jokes')
    .eq('user_id', session.user.id)
    .maybeSingle();

  return {
    signedIn: true,
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
    tasks?:            Task[];
    outcomes?:         Outcome[];
    badges?:           Badge[];
    customActivities?: CustomActivity[];
    xpOverrides?:      Record<string, number>;
  };

  const tasks            = s.tasks            ?? [];
  const outcomes         = s.outcomes         ?? [];
  const badges           = s.badges           ?? [];
  const customActivities = s.customActivities ?? [];
  const xpOverrides      = s.xpOverrides      ?? {};

  async function syncTable(
    table: string,
    currentIds: string[],
    rows: object[],
  ) {
    const { data: existing, error } = await supabase
      .from(table).select('id').eq('user_id', userId);
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
      const { error: upsErr } = await supabase.from(table).upsert(rows);
      if (upsErr) console.error(`[gainfully] saveState ${table} upsert:`, upsErr);
    }
  }

  await Promise.all([
    syncTable(
      'tasks',
      tasks.map((t) => t.id),
      tasks.map((t) => ({
        id:            t.id,
        user_id:       userId,
        name:          t.name,
        category:      t.category,
        xp:            t.xp,
        completed:     t.completed,
        completed_at:  t.completedAt   ?? null,
        created_at:    t.createdAt,
        company:       t.company       ?? null,
        job_title:     t.jobTitle      ?? null,
        activity_date: t.activityDate  ?? null,
        ats:           t.ats           ?? null,
      })),
    ),

    syncTable(
      'outcomes',
      outcomes.map((o) => o.id),
      outcomes.map((o) => ({
        id:         o.id,
        user_id:    userId,
        task_id:    o.taskId,
        type:       o.type,
        date:       o.date,
        notes:      o.notes      ?? null,
        xp_awarded: o.xpAwarded,
        created_at: o.createdAt,
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
      const { error: delErr } = await supabase
        .from('user_badges').delete().eq('user_id', userId);
      if (delErr) { console.error('[gainfully] saveState badges delete:', delErr); return; }
      if (earned.length > 0) {
        const { error: insErr } = await supabase.from('user_badges').insert(
          earned.map((b) => ({
            user_id:   userId,
            badge_id:  b.id,
            earned_at: b.earnedAt ?? new Date().toISOString(),
          }))
        );
        if (insErr) console.error('[gainfully] saveState badges insert:', insErr);
      }
    })(),

    (async () => {
      const { error } = await supabase.from('user_settings').upsert(
        { user_id: userId, xp_overrides: xpOverrides, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error) console.error('[gainfully] saveState settings:', error);
    })(),
  ]);
}
