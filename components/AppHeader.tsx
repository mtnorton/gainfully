'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import UserModal from './UserModal';
import { loadState } from '@/lib/supabase/storage';
import { getLevel } from '@/lib/gameLogic';
import { getLevelName } from '@/lib/levelNames';

export default function AppHeader() {
  const [badgeCount, setBadgeCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const data = await loadState();
      if (data) {
        setBadgeCount(((data.badges ?? []) as { earned: boolean }[]).filter((b) => b.earned).length);
        setLevel(getLevel((data.totalXP as number) ?? 0));
      } else {
        setBadgeCount(0);
        setLevel(1);
      }
    }

    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      setUser(res.data.session?.user ?? null);
      loadData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (!session) {
        setBadgeCount(0);
        setLevel(1);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white" style={{ borderBottom: '2px solid #F1E2CF' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="font-fredoka font-bold text-xl text-[#2C2724] tracking-wide hover:text-[#7C5CFC] transition-colors">MVUU</Link>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="font-fredoka font-bold text-sm px-2.5 py-0.5 rounded-lg"
                style={{ background: '#EEE7FF', color: '#7C5CFC', border: '2px solid #D4C7FF' }}
              >
                Lvl {level}
              </span>
              <span
                className="font-fredoka font-bold text-sm px-2.5 py-0.5 rounded-lg"
                style={{ background: '#FFF7E8', color: '#B45309', border: '2px solid #FCE3B0' }}
              >
                {getLevelName(level)}
              </span>
            </div>
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
