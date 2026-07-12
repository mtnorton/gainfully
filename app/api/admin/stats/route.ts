import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function dateKey(iso: string, offsetMinutes: number) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  return d.toISOString().slice(0, 10);
}

function localToday(offsetMinutes: number) {
  return dateKey(new Date().toISOString(), offsetMinutes);
}

function buildSeriesSlots(offsetMinutes: number, count: number): string[] {
  const todayStr = localToday(offsetMinutes);
  const slots: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(todayStr + 'T12:00:00Z');
    d.setDate(d.getDate() - i);
    slots.push(d.toISOString().slice(0, 10));
  }
  return slots;
}

function buildDailySeries(
  taskDates: string[],
  outcomeDates: string[],
  offsetMinutes: number,
): Array<{ date: string; tasks: number; outcomes: number }> {
  const slots = buildSeriesSlots(offsetMinutes, 30);
  const series = slots.map((date) => ({ date, tasks: 0, outcomes: 0 }));
  for (const iso of taskDates) {
    const entry = series.find((s) => s.date === dateKey(iso, offsetMinutes));
    if (entry) entry.tasks++;
  }
  for (const iso of outcomeDates) {
    const entry = series.find((s) => s.date === dateKey(iso, offsetMinutes));
    if (entry) entry.outcomes++;
  }
  return series;
}

function buildActiveUsersDailySeries(
  tasks: Array<{ created_at: string; user_id: string }>,
  outcomes: Array<{ created_at: string; user_id: string }>,
  offsetMinutes: number,
): Array<{ date: string; active: number }> {
  const slots = buildSeriesSlots(offsetMinutes, 30);
  const series = slots.map((date) => ({ date, active: 0 }));
  const byDate = new Map<string, Set<string>>();
  for (const row of [...tasks, ...outcomes]) {
    const day = dateKey(row.created_at, offsetMinutes);
    if (!byDate.has(day)) byDate.set(day, new Set());
    byDate.get(day)!.add(row.user_id);
  }
  for (const entry of series) {
    entry.active = byDate.get(entry.date)?.size ?? 0;
  }
  return series;
}

function buildUserDailySeries(
  users: Array<{ created_at: string; is_anonymous: boolean }>,
  offsetMinutes: number,
): Array<{ date: string; anonymous: number; registered: number }> {
  const slots = buildSeriesSlots(offsetMinutes, 30);
  const series = slots.map((date) => ({ date, anonymous: 0, registered: 0 }));
  for (const u of users) {
    const entry = series.find((s) => s.date === dateKey(u.created_at, offsetMinutes));
    if (entry) {
      if (u.is_anonymous) entry.anonymous++;
      else entry.registered++;
    }
  }
  return series;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // Verify the caller's identity using the anon key
  const verifier = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error: authError } = await verifier.auth.getUser(token);
  if (authError || !user || user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[admin] SUPABASE_SERVICE_ROLE_KEY is not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Service-role client for admin queries — never leaves the server
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Client sends its local UTC offset (e.g. -240 for EDT) so dates align with user's timezone
  const utcOffset = parseInt(request.nextUrl.searchParams.get('utcOffset') ?? '0', 10);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [usersRes, allTasksRes, allOutcomesRes] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000, page: 1 }),
      admin.from('tasks').select('created_at, user_id'),
      admin.from('outcomes').select('created_at, user_id'),
    ]);

  if (allTasksRes.error) {
    console.error('[admin] tasks query error:', allTasksRes.error);
    return NextResponse.json({ error: 'tasks query failed', detail: allTasksRes.error.message }, { status: 500 });
  }
  if (allOutcomesRes.error) {
    console.error('[admin] outcomes query error:', allOutcomesRes.error);
    return NextResponse.json({ error: 'outcomes query failed', detail: allOutcomesRes.error.message }, { status: 500 });
  }

  const allUsers = usersRes.data?.users ?? [];
  const anonymous = allUsers.filter((u) => u.is_anonymous).length;
  const registered = allUsers.filter((u) => !u.is_anonymous).length;

  const allTaskDates = (allTasksRes.data ?? []).map((r) => r.created_at as string);
  const allOutcomeDates = (allOutcomesRes.data ?? []).map((r) => r.created_at as string);

  const recentTaskDates = allTaskDates.filter((d) => d >= thirtyDaysAgo.toISOString());
  const recentOutcomeDates = allOutcomeDates.filter((d) => d >= thirtyDaysAgo.toISOString());

  const allTaskRows = (allTasksRes.data ?? []) as Array<{ created_at: string; user_id: string }>;
  const allOutcomeRows = (allOutcomesRes.data ?? []) as Array<{ created_at: string; user_id: string }>;

  const daily = buildDailySeries(recentTaskDates, recentOutcomeDates, utcOffset);
  const userDaily = buildUserDailySeries(
    allUsers.map((u) => ({ created_at: u.created_at, is_anonymous: u.is_anonymous ?? false })),
    utcOffset,
  );
  const activeUserDaily = buildActiveUsersDailySeries(
    allTaskRows.filter((r) => r.created_at >= thirtyDaysAgo.toISOString()),
    allOutcomeRows.filter((r) => r.created_at >= thirtyDaysAgo.toISOString()),
    utcOffset,
  );

  return NextResponse.json({
    users: { total: allUsers.length, anonymous, registered },
    tasks: { total: allTaskDates.length },
    outcomes: { total: allOutcomeDates.length },
    daily,
    userDaily,
    activeUserDaily,
  });
}
