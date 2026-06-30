'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import UserModal from './UserModal';
import { loadState } from '@/lib/supabase/storage';
import { getLevel } from '@/lib/gameLogic';

export default function AppHeader() {
  const pathname = usePathname();
  const [badgeCount, setBadgeCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function init() {
      const data = await loadState();
      if (data) {
        setBadgeCount(((data.badges ?? []) as { earned: boolean }[]).filter((b) => b.earned).length);
        setLevel(getLevel((data.totalXP as number) ?? 0));
      }
    }
    init();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => setUser(res.data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const active = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const baseClass = 'text-sm px-3 py-1.5 rounded-xl font-fredoka font-semibold whitespace-nowrap';
  const activeClass = `${baseClass} bg-[#FF6B4A] text-white shadow-[0_3px_0_#DE4F30] cursor-default`;
  const inactiveClass = `${baseClass} text-[#9C8B79] hover:text-[#2C2724] hover:bg-[#F2E8DB] transition-colors`;

  function NavItem({ label, href }: { label: string; href: string }) {
    const isActive = active(href);
    const content = label === 'Badges' && badgeCount > 0
      ? <>{label}<span className={`ml-1.5 font-bold ${isActive ? '' : 'text-[#F5A300]'}`}>{badgeCount}</span></>
      : <>{label}</>;
    return isActive
      ? <span className={activeClass}>{content}</span>
      : <Link href={href} className={inactiveClass}>{content}</Link>;
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: '2px solid #F1E2CF' }}>
        <div className="max-w-2xl mx-auto px-4 flex flex-wrap items-center py-2 gap-y-2 sm:flex-nowrap sm:h-16 sm:py-0">
          <div className="flex items-center order-1">
            <span className="font-fredoka font-bold text-xl text-[#2C2724] tracking-wide">MVUU</span>
          </div>
          <nav className="flex gap-1 w-full overflow-x-auto sm:w-auto sm:ml-4 order-3 sm:order-2 no-scrollbar pb-[3px]">
            <NavItem label="Dashboard" href="/" />
            <NavItem label="Games" href="/games" />
            <NavItem label="Pipeline" href="/pipeline" />
            <NavItem label="Progress" href="/progress" />
            <NavItem label="Badges" href="/badges" />
          </nav>
          <div className="ml-auto order-2 sm:order-3 flex items-center gap-2">
            <span
              className="font-fredoka font-bold text-sm px-2.5 py-0.5 rounded-lg"
              style={{ background: '#EEE7FF', color: '#7C5CFC', border: '2px solid #D4C7FF' }}
            >
              Lvl {level}
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ border: '2px solid #D4C7FF' }}
              aria-label="User profile"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#EEE7FF] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="4.5" r="2.5" fill="#7C5CFC" />
                    <path d="M1 12c0-2.2 2.686-4 6-4s6 1.8 6 4" stroke="#7C5CFC" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>
      </header>
      {modalOpen && (
        <UserModal onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
