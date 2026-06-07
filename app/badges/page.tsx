'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/lib/types';
import { getInitialBadges } from '@/lib/gameLogic';
import { getLevelProgress } from '@/lib/gameLogic';
import BadgeGrid from '@/components/BadgeGrid';

const STORAGE_KEY = 'gainfully-state';

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedBadges = getInitialBadges().map((b) => {
          const savedBadge = parsed.badges?.find((sb: Badge) => sb.id === b.id);
          return savedBadge ?? b;
        });
        setBadges(mergedBadges);
        setTotalXP(parsed.totalXP ?? 0);
      } else {
        setBadges(getInitialBadges());
      }
    } catch {}
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const levelProgress = getLevelProgress(totalXP);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-2xl mx-auto px-4 flex flex-wrap items-center py-2 gap-y-1 sm:flex-nowrap sm:h-16 sm:py-0">
          <div className="flex items-center gap-2 order-1">
            <span className="text-2xl">💼</span>
            <span className="text-xl font-bold text-slate-100 tracking-tight">Gainfully</span>
          </div>
          <nav className="flex gap-0.5 w-full sm:w-auto sm:ml-4 order-3 sm:order-2 pb-1 sm:pb-0">
            <Link href="/" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Dashboard</Link>
            <Link href="/pipeline" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Pipeline</Link>
            <Link href="/progress" className="text-sm px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">Progress</Link>
            <span className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 font-medium">
              Badges{earnedCount > 0 && (
                <span className="ml-1.5 text-amber-400 font-bold">{earnedCount}</span>
              )}
            </span>
          </nav>
          <div className="ml-auto flex items-center gap-3 order-2 sm:order-3">
            <div className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 rounded-full px-3 py-1">
              <span className="text-violet-300 font-semibold text-sm">Lvl {levelProgress.level}</span>
            </div>
            <span className="text-yellow-400 font-bold text-sm">{totalXP.toLocaleString()} XP</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <BadgeGrid badges={badges} />
      </main>
    </div>
  );
}
