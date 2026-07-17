'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/AppHeader';
import { Badge } from '@/lib/types';
import { getInitialBadges } from '@/lib/gameLogic';
import { getLevelProgress } from '@/lib/gameLogic';
import BadgeGrid from '@/components/BadgeGrid';
import PageIntroModal from '@/components/PageIntroModal';
import { loadState } from '@/lib/supabase/storage';

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function init() {
      const data = await loadState();
      if (data) {
        const mergedBadges = getInitialBadges().map((b) => {
          const savedBadge = ((data.badges ?? []) as Badge[]).find((sb) => sb.id === b.id);
          return savedBadge ?? b;
        });
        setBadges(mergedBadges);
        setTotalXP((data.totalXP ?? 0) as number);
      } else {
        setBadges(getInitialBadges());
      }
      setMounted(true);
    }
    init();
  }, []);

  if (!mounted) return null;

  const levelProgress = getLevelProgress(totalXP);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <BadgeGrid badges={badges} />
      </main>
      <PageIntroModal
        storageKey="gainfully-intro-badges"
        image="/fulu.png"
        imageAlt="Fulu"
        bubbleStyle={{ background: '#DCFAE7', border: '2px solid #B0EFC8' }}
        bubbleArrowStyle={{ background: '#DCFAE7', border: '2px solid #B0EFC8' }}
        text={<>Proof that you <span style={{ color: '#16A34A', fontWeight: 700 }}>did the thing</span>. Some badges are earned through volume, some through persistence, and at least one just for <span style={{ color: '#B45309', fontWeight: 700 }}>showing up</span>. Which already puts you ahead of most people.</>}
      />
    </div>
  );
}
