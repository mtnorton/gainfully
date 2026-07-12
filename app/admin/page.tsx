'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import AppHeader from '@/components/AppHeader';

interface AdminStats {
  users: { total: number; anonymous: number; registered: number };
  tasks: { total: number };
  outcomes: { total: number };
  daily: Array<{ date: string; tasks: number; outcomes: number }>;
  userDaily: Array<{ date: string; anonymous: number; registered: number }>;
  activeUserDaily: Array<{ date: string; active: number }>;
}

// ── SVG line chart ────────────────────────────────────────────────────────────

function LineChart({ data }: { data: AdminStats['daily'] }) {
  const W = 560;
  const H = 180;
  const pad = { top: 16, right: 16, bottom: 36, left: 32 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.tasks, d.outcomes]), 1);
  const n = data.length;

  const x = (i: number) => (i / (n - 1)) * cw;
  const y = (v: number) => ch - (v / maxVal) * ch;

  const line = (key: 'tasks' | 'outcomes') =>
    data.map((d, i) => `${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * maxVal));

  // Show date labels every 7 days
  const dateLabels = data.filter((_, i) => i === 0 || i === n - 1 || i % 7 === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <g transform={`translate(${pad.left},${pad.top})`}>
        {/* Horizontal grid lines */}
        {gridLines.map((v, gi) => (
          <g key={gi}>
            <line
              x1={0} y1={y(v).toFixed(1)}
              x2={cw} y2={y(v).toFixed(1)}
              stroke="#EFE0CC" strokeWidth="1"
            />
            <text x={-6} y={y(v)} dominantBaseline="middle" textAnchor="end"
              fontSize="10" fill="#B8A99A">
              {v}
            </text>
          </g>
        ))}

        {/* Lines */}
        <polyline fill="none" stroke="#7C5CFC" strokeWidth="2.5" strokeLinejoin="round"
          strokeLinecap="round" points={line('tasks')} />
        <polyline fill="none" stroke="#FF6B4A" strokeWidth="2.5" strokeLinejoin="round"
          strokeLinecap="round" points={line('outcomes')} />

        {/* Dots */}
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.tasks)} r={3} fill="#7C5CFC" />
            <circle cx={x(i)} cy={y(d.outcomes)} r={3} fill="#FF6B4A" />
          </g>
        ))}

        {/* X axis date labels */}
        {dateLabels.map((d, idx) => {
          const i = data.indexOf(d);
          const label = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text key={idx} x={x(i)} y={ch + 18} textAnchor="middle"
              fontSize="10" fill="#B8A99A">
              {label}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

// ── SVG user chart ────────────────────────────────────────────────────────────

function UserLineChart({ data }: { data: AdminStats['userDaily'] }) {
  const W = 560;
  const H = 180;
  const pad = { top: 16, right: 16, bottom: 36, left: 32 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.anonymous, d.registered]), 1);
  const n = data.length;

  const x = (i: number) => (i / (n - 1)) * cw;
  const y = (v: number) => ch - (v / maxVal) * ch;

  const line = (key: 'anonymous' | 'registered') =>
    data.map((d, i) => `${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * maxVal));
  const dateLabels = data.filter((_, i) => i === 0 || i === n - 1 || i % 7 === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <g transform={`translate(${pad.left},${pad.top})`}>
        {gridLines.map((v, gi) => (
          <g key={gi}>
            <line x1={0} y1={y(v).toFixed(1)} x2={cw} y2={y(v).toFixed(1)} stroke="#EFE0CC" strokeWidth="1" />
            <text x={-6} y={y(v)} dominantBaseline="middle" textAnchor="end" fontSize="10" fill="#B8A99A">{v}</text>
          </g>
        ))}
        <polyline fill="none" stroke="#B8A99A" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={line('anonymous')} />
        <polyline fill="none" stroke="#7C5CFC" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={line('registered')} />
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.anonymous)} r={3} fill="#B8A99A" />
            <circle cx={x(i)} cy={y(d.registered)} r={3} fill="#7C5CFC" />
          </g>
        ))}
        {dateLabels.map((d, idx) => {
          const i = data.indexOf(d);
          const label = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text key={idx} x={x(i)} y={ch + 18} textAnchor="middle" fontSize="10" fill="#B8A99A">{label}</text>
          );
        })}
      </g>
    </svg>
  );
}

// ── SVG active users chart ────────────────────────────────────────────────────

function ActiveUsersChart({ data }: { data: AdminStats['activeUserDaily'] }) {
  const W = 560;
  const H = 180;
  const pad = { top: 16, right: 16, bottom: 36, left: 32 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map((d) => d.active), 1);
  const n = data.length;

  const x = (i: number) => (i / (n - 1)) * cw;
  const y = (v: number) => ch - (v / maxVal) * ch;

  const points = data.map((d, i) => `${x(i).toFixed(1)},${y(d.active).toFixed(1)}`).join(' ');
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * maxVal));
  const dateLabels = data.filter((_, i) => i === 0 || i === n - 1 || i % 7 === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <g transform={`translate(${pad.left},${pad.top})`}>
        {gridLines.map((v, gi) => (
          <g key={gi}>
            <line x1={0} y1={y(v).toFixed(1)} x2={cw} y2={y(v).toFixed(1)} stroke="#EFE0CC" strokeWidth="1" />
            <text x={-6} y={y(v)} dominantBaseline="middle" textAnchor="end" fontSize="10" fill="#B8A99A">{v}</text>
          </g>
        ))}
        <polyline fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points} />
        {data.map((d, i) => (
          <circle key={d.date} cx={x(i)} cy={y(d.active)} r={3} fill="#16A34A" />
        ))}
        {dateLabels.map((d, idx) => {
          const i = data.indexOf(d);
          const label = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text key={idx} x={x(i)} y={ch + 18} textAnchor="middle" fontSize="10" fill="#B8A99A">{label}</text>
          );
        })}
      </g>
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-[18px] bg-white p-4 text-center" style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #EFE0CC' }}>
      <div className="font-fredoka font-bold text-[28px] text-[#2C2724] leading-none">{value.toLocaleString()}</div>
      <div className="font-fredoka font-semibold text-[12px] text-[#97887A] mt-1">{label}</div>
      {sub && <div className="text-[10px] text-[#C4B5A5] mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [status, setStatus] = useState<'loading' | 'unauthorized' | 'error' | 'ok'>('loading');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus('unauthorized'); return; }

      // getTimezoneOffset() returns positive for west-of-UTC zones, so negate it
      const utcOffset = -new Date().getTimezoneOffset();
      const res = await fetch(`/api/admin/stats?utcOffset=${utcOffset}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 401) { setStatus('unauthorized'); return; }
      if (!res.ok) { setStatus('error'); return; }

      setStats(await res.json());
      setStatus('ok');
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-6">
        {status === 'loading' && (
          <p className="text-[#97887A] text-sm mt-8 text-center">Loading…</p>
        )}
        {status === 'unauthorized' && (
          <p className="text-[#97887A] text-sm mt-8 text-center">Nothing to see here.</p>
        )}
        {status === 'error' && (
          <p className="text-[#97887A] text-sm mt-8 text-center">Something went wrong.</p>
        )}

        {status === 'ok' && stats && (
          <div className="space-y-6">
            <h1 className="font-fredoka font-bold text-[22px] text-[#2C2724]">Admin</h1>

            {/* Users */}
            <section>
              <p className="font-fredoka font-bold text-[11px] text-[#97887A] uppercase tracking-widest mb-3">Users</p>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total" value={stats.users.total} />
                <StatCard label="Registered" value={stats.users.registered} />
                <StatCard label="Anonymous" value={stats.users.anonymous} />
              </div>
            </section>

            {/* Activity */}
            <section>
              <p className="font-fredoka font-bold text-[11px] text-[#97887A] uppercase tracking-widest mb-3">Activity</p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Tasks Logged" value={stats.tasks.total} />
                <StatCard label="Outcomes Logged" value={stats.outcomes.total} />
              </div>
            </section>

            {/* Activity chart */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="font-fredoka font-bold text-[11px] text-[#97887A] uppercase tracking-widest">Daily Activity — Last 30 Days</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#97887A]">
                    <span className="w-3 h-0.5 bg-[#7C5CFC] inline-block rounded" />
                    Tasks
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#97887A]">
                    <span className="w-3 h-0.5 bg-[#FF6B4A] inline-block rounded" />
                    Outcomes
                  </span>
                </div>
              </div>
              <div className="rounded-[18px] bg-white p-4" style={{ border: '2px solid #F1E2CF' }}>
                <LineChart data={stats.daily} />
              </div>
            </section>

            {/* Active users chart */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="font-fredoka font-bold text-[11px] text-[#97887A] uppercase tracking-widest">Daily Active Users — Last 30 Days</p>
                <span className="flex items-center gap-1.5 text-[11px] text-[#97887A]">
                  <span className="w-3 h-0.5 bg-[#16A34A] inline-block rounded" />
                  Unique users
                </span>
              </div>
              <div className="rounded-[18px] bg-white p-4" style={{ border: '2px solid #F1E2CF' }}>
                <ActiveUsersChart data={stats.activeUserDaily} />
              </div>
            </section>

            {/* User growth chart */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="font-fredoka font-bold text-[11px] text-[#97887A] uppercase tracking-widest">New Users — Last 30 Days</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#97887A]">
                    <span className="w-3 h-0.5 bg-[#7C5CFC] inline-block rounded" />
                    Registered
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#97887A]">
                    <span className="w-3 h-0.5 bg-[#B8A99A] inline-block rounded" />
                    Anonymous
                  </span>
                </div>
              </div>
              <div className="rounded-[18px] bg-white p-4" style={{ border: '2px solid #F1E2CF' }}>
                <UserLineChart data={stats.userDaily} />
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
