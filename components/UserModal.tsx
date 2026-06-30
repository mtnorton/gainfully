'use client';

import { useEffect, useState } from 'react';
import { getLevelProgress, getInitialBadges, GAME_ONLY_TASK_NAMES } from '@/lib/gameLogic';
import { Badge } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { loadState, loadConsentStatus, saveEmailPrefs } from '@/lib/supabase/storage';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface UserModalProps {
  onClose: () => void;
}

export default function UserModal({ onClose }: UserModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [badgesEarned, setBadgesEarned] = useState(0);
  const [resultsLogged, setResultsLogged] = useState(0);
  const [signingIn, setSigningIn] = useState(false);
  const [emailReminders,  setEmailReminders]  = useState(false);
  const [emailHippoJokes, setEmailHippoJokes] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => setUser(res.data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function init() {
      const [data, consent] = await Promise.all([loadState(), loadConsentStatus()]);
      if (consent?.signedIn) {
        setEmailReminders(consent.emailReminders);
        setEmailHippoJokes(consent.emailHippoJokes);
      }
      if (data) {
        setTotalXP((data.totalXP ?? 0) as number);
        const tasks = (data.tasks ?? []) as { completed: boolean; name: string }[];
        setTasksCompleted(
          tasks.filter((t) => t.completed && !GAME_ONLY_TASK_NAMES.has(t.name)).length
        );
        const merged = getInitialBadges().map((b) => {
          const found = ((data.badges ?? []) as Badge[]).find((sb) => sb.id === b.id);
          return found ?? b;
        });
        setBadgesEarned(merged.filter((b) => b.earned).length);
        setResultsLogged(((data.outcomes ?? []) as unknown[]).length);
      }
    }
    init();
  }, []);

  async function handleSignIn() {
    setSigningIn(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  const lp = getLevelProgress(totalXP);

  const stats = [
    { icon: '🎯', label: 'Level',   value: lp.level },
    { icon: '✅', label: 'Done',    value: tasksCompleted },
    { icon: '🏅', label: 'Badges',  value: badgesEarned },
    { icon: '📋', label: 'Results', value: resultsLogged },
  ];

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = user?.user_metadata?.full_name as string | undefined;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative z-10 w-80 bg-white rounded-[20px] mt-[58px] mr-4 p-5 shadow-2xl"
        style={{ border: '2px solid #F1E2CF' }}
      >
        {/* XP Bar */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#7C5CFC] text-white flex items-center justify-center font-fredoka font-bold text-lg shadow-[0_3px_0_#5B3FD6] flex-shrink-0">
              {lp.level}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-fredoka font-bold text-[16px] text-[#2C2724]">Level {lp.level}</div>
              <div className="text-[11px] text-[#97887A] truncate">{lp.current.toLocaleString()} / {lp.needed.toLocaleString()} XP to next</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-fredoka font-bold text-[22px] text-[#F5A300] leading-none">{totalXP.toLocaleString()}</div>
              <div className="text-[10px] text-[#97887A]">total XP</div>
            </div>
          </div>
          <div className="h-[10px] bg-[#F2E8DB] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF8A4A] to-[#FF6B4A] transition-all duration-700"
              style={{ width: `${lp.percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[#97887A] font-bold">
            <span>Lvl {lp.level}</span>
            <span className="text-[#FF6B4A]">{Math.round(lp.percentage)}%</span>
            <span>Lvl {lp.level + 1}</span>
          </div>
        </div>

        <div className="mb-4" style={{ borderTop: '2px solid #F1E2CF' }} />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-[14px] p-2 text-center"
              style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #EFE0CC' }}
            >
              <div className="text-[16px]">{s.icon}</div>
              <div className="font-fredoka font-bold text-[16px] text-[#2C2724]">{s.value}</div>
              <div className="text-[9px] text-[#A99C8D] font-bold uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-4" style={{ borderTop: '2px solid #F1E2CF' }} />

        {/* Email prefs — only shown when signed in */}
        {user && (
          <>
            <div className="mb-3" style={{ borderTop: '2px solid #F1E2CF' }} />
            <p className="font-fredoka font-semibold text-[11px] text-[#97887A] uppercase tracking-wide mb-2">
              Email preferences
            </p>
            {(
              [
                { key: 'reminders',  label: 'Job search reminders', checked: emailReminders,  set: (v: boolean) => { setEmailReminders(v);  saveEmailPrefs(v, emailHippoJokes); } },
                { key: 'hippo',      label: 'Hippo jokes 🦛',       checked: emailHippoJokes, set: (v: boolean) => { setEmailHippoJokes(v); saveEmailPrefs(emailReminders, v);  } },
              ] as const
            ).map(({ key, label, checked, set }) => (
              <label key={key} className="flex items-center justify-between mb-2 cursor-pointer">
                <span className="text-[13px] text-[#2C2724] font-fredoka font-semibold">{label}</span>
                <button
                  role="switch"
                  aria-checked={checked}
                  onClick={() => set(!checked)}
                  className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                  style={{ background: checked ? '#7C5CFC' : '#E5E0DA' }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                    style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
                  />
                </button>
              </label>
            ))}
          </>
        )}

        {/* Contact */}
        <p className="text-[10px] text-[#B8A99A] text-center mb-4">
          Questions? Bugs? Hippo puns?{' '}
          <a href="mailto:mvuuapp@gmail.com" className="underline hover:text-[#7C5CFC] transition-colors">
            Write us at mvuuapp@gmail.com
          </a>
        </p>

        {/* Auth section */}
        {user ? (
          <div className="flex items-center gap-3">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
              : <div className="w-9 h-9 rounded-full bg-[#EEE7FF] flex items-center justify-center flex-shrink-0 font-fredoka font-bold text-[#7C5CFC]">
                  {displayName?.[0] ?? '?'}
                </div>
            }
            <div className="flex-1 min-w-0">
              <div className="font-fredoka font-semibold text-[13px] text-[#2C2724] truncate">{displayName ?? 'Signed in'}</div>
              <div className="text-[11px] text-[#97887A] truncate">{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[11px] font-semibold text-[#97887A] hover:text-[#2C2724] transition-colors whitespace-nowrap"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <p className="text-[#97887A] text-[11px] text-center mb-3">Play away — but you&apos;ll need to sign in to save your progress.</p>
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm text-[#2C2724] hover:bg-[#FBF3E8] transition-colors disabled:opacity-60"
              style={{ border: '2px solid #F1E2CF' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.566 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {signingIn ? 'Redirecting…' : 'Sign in with Google'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
