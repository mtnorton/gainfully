'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import PageIntroModal from '@/components/PageIntroModal';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface InsightCard {
  href: string;
  icon: string;
  title: string;
  description: string;
}

const CARDS: InsightCard[] = [
  {
    href: '/insights/funnel',
    icon: '🌊',
    title: 'Application Funnel',
    description: 'See how your applications are converting at each stage.',
  },
];

export default function InsightsPage() {
  const [user, setUser] = useState<User | null | 'loading'>('loading');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    check();
  }, []);

  async function handleSignIn() {
    setSigningIn(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error('[gainfully] insights signIn:', error);
      setSigningIn(false);
    }
  }

  const isAnonymous = user !== 'loading' && user !== null && (user as User & { is_anonymous?: boolean }).is_anonymous === true;
  const isRegistered = user !== 'loading' && user !== null && !isAnonymous;

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-fredoka font-bold text-[22px] text-[#2C2724] mb-6">Insights</h1>

        {user === 'loading' && (
          <div className="h-40 flex items-center justify-center text-[#97887A] text-sm">Loading…</div>
        )}

        {!isRegistered && user !== 'loading' && (
          <div
            className="rounded-[22px] p-8 flex flex-col items-center text-center gap-4"
            style={{ background: '#fff', border: '2px solid #F1E2CF' }}
          >
            <div className="text-5xl">📊</div>
            <div>
              <p className="font-fredoka font-bold text-[18px] text-[#2C2724] mb-1">Unlock Insights</p>
              <p className="text-[#97887A] text-[13px] leading-relaxed max-w-xs">
                Connect your Google account to access your application funnel and other insights. Your data stays yours.
              </p>
            </div>
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="flex items-center gap-2.5 py-2.5 px-5 rounded-xl font-semibold text-sm text-[#2C2724] hover:bg-[#FBF3E8] transition-colors disabled:opacity-60"
              style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {signingIn ? 'Redirecting…' : 'Connect Google account'}
            </button>
          </div>
        )}

        {isRegistered && (
          <div className="grid grid-cols-2 gap-3">
            {CARDS.map((card) => (
              <Link key={card.href} href={card.href}>
                <div
                  className="rounded-[18px] bg-white p-5 flex flex-col gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer h-full"
                  style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #EFE0CC' }}
                >
                  <div className="text-3xl">{card.icon}</div>
                  <div className="font-fredoka font-bold text-[15px] text-[#2C2724] leading-snug">{card.title}</div>
                  <div className="text-[12px] text-[#97887A] leading-snug">{card.description}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <PageIntroModal
        storageKey="gainfully-intro-insights"
        image="/dr_doomscroll.png"
        imageAlt="Dr. Doomscroll"
        bubbleStyle={{ background: '#FFF0E0', border: '2px solid #F9C9A3' }}
        bubbleArrowStyle={{ background: '#FFF0E0', border: '2px solid #F9C9A3' }}
        text={<>Turns out staring at a chart of your <span style={{ color: '#FF6B4A', fontWeight: 700 }}>rejections</span> is weirdly satisfying. Data won&apos;t get you the job, but at least it gives the <span style={{ color: '#EA580C', fontWeight: 700 }}>suffering a shape</span>.</>}
      />
    </div>
  );
}
