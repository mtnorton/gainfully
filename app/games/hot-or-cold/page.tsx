'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { getLevelProgress } from '@/lib/gameLogic';
import { TaskCategory } from '@/lib/types';
import { getGameDay } from '@/lib/gameDay';
import { loadState, saveState } from '@/lib/supabase/storage';

const HOTCOLD_KEY = 'gainfully-hotcold';

type OutreachType = 'hot' | 'lukewarm' | 'cold';

interface HotColdContact {
  id: string;
  type: OutreachType;
  loggedAt: string;
  gameDay: string;
}

interface HotColdCampaign {
  company: string;
  goal: number;
  contacts: HotColdContact[];
  bonusClaimed: boolean;
}

const TYPE_CONFIG: Record<OutreachType, { label: string; desc: string; xp: number; icon: string; ring: string; text: string; bg: string }> = {
  hot:      { label: 'Hot',      desc: 'Personal referral or direct intro',          xp: 25, icon: '🔥', ring: 'border-orange-500/50', text: 'text-orange-300', bg: 'bg-orange-500/10' },
  lukewarm: { label: 'Lukewarm', desc: 'Alumni network or mutual connection',         xp: 15, icon: '☀️', ring: 'border-yellow-500/50', text: 'text-yellow-300', bg: 'bg-yellow-500/10' },
  cold:     { label: 'Cold',     desc: "Direct outreach to someone you don't know",  xp: 10, icon: '🧊', ring: 'border-blue-500/50',   text: 'text-blue-300',   bg: 'bg-blue-500/10'   },
};

const GOAL_HINTS: Record<number, string> = {
  1: 'tiny startup',
  2: 'small team',
  3: 'mid-size',
  4: 'large org',
  5: 'enterprise',
};

function bonusXP(goal: number) { return goal * 15; }

async function logToMainState(xp: number, name: string): Promise<number | null> {
  try {
    const data = await loadState();
    const s: Record<string, unknown> = data ?? { tasks: [], totalXP: 0, badges: [], customActivities: [], xpOverrides: {} };
    const now = new Date().toISOString();
    s.tasks = [{
      id: `hotcold-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      category: 'networking' as TaskCategory,
      xp,
      completed: true,
      completedAt: now,
      createdAt: now,
    }, ...((s.tasks as unknown[]) ?? [])];
    s.totalXP = ((s.totalXP as number) ?? 0) + xp;
    await saveState(s);
    return s.totalXP as number;
  } catch { return null; }
}

export default function HotOrColdPage() {
  const [levelProgress, setLevelProgress] = useState(getLevelProgress(0));
  const [totalXP, setTotalXP] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [campaign, setCampaign] = useState<HotColdCampaign | null>(null);

  // Setup form state
  const [company, setCompany] = useState('');
  const [goal, setGoal] = useState(3);

  // Log outreach form state
  const [showLog, setShowLog] = useState(false);
  const [selectedType, setSelectedType] = useState<OutreachType>('cold');

  useEffect(() => {
    const hc = localStorage.getItem(HOTCOLD_KEY);
    if (hc) {
      try { setCampaign(JSON.parse(hc)); } catch { /* ignore */ }
    }
    setMounted(true);
  }, []);

  function saveCampaign(c: HotColdCampaign) {
    localStorage.setItem(HOTCOLD_KEY, JSON.stringify(c));
    setCampaign(c);
  }

  async function awardXP(xp: number, name: string) {
    const newTotal = await logToMainState(xp, name);
    if (newTotal !== null) {
      setTotalXP(newTotal);
      setLevelProgress(getLevelProgress(newTotal));
    }
  }

  function handleSetTarget() {
    if (!company.trim()) return;
    saveCampaign({ company: company.trim(), goal, contacts: [], bonusClaimed: false });
  }

  async function handleLogOutreach() {
    if (!campaign) return;
    const cfg = TYPE_CONFIG[selectedType];
    const contact: HotColdContact = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: selectedType,
      loggedAt: new Date().toISOString(),
      gameDay: getGameDay(),
    };
    await awardXP(cfg.xp, `Hot or Cold: ${cfg.label} Outreach — ${campaign.company}`);
    saveCampaign({ ...campaign, contacts: [...campaign.contacts, contact] });
    setShowLog(false);
  }

  async function handleClaimBonus() {
    if (!campaign || campaign.bonusClaimed) return;
    const xp = bonusXP(campaign.goal);
    await awardXP(xp, `Hot or Cold: Bonus — ${campaign.company}`);
    saveCampaign({ ...campaign, bonusClaimed: true });
  }

  function handleReset() {
    localStorage.removeItem(HOTCOLD_KEY);
    setCampaign(null);
    setCompany('');
    setGoal(3);
    setShowLog(false);
  }

  if (!mounted) return null;

  const goalMet = !!campaign && campaign.contacts.length >= campaign.goal;
  const firstDay = campaign?.contacts[0]?.gameDay;
  const completedInOneDay = goalMet && !!firstDay &&
    campaign!.contacts.slice(0, campaign!.goal).every(c => c.gameDay === firstDay);
  const bonusEligible = completedInOneDay && !campaign?.bonusClaimed;

  return (
    <div className="min-h-screen bg-[#FFF6EC]">
      <AppHeader />

      <main className="max-w-sm mx-auto px-4 py-8">
        <Link href="/games" className="inline-flex items-center gap-1.5 text-sm text-[#97887A] hover:text-[#2C2724] transition-colors mb-8">
          ← Back to Games
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-fredoka font-bold text-[24px] text-[#2C2724] mb-2">🌡️ Hot or Cold</h1>
          <p className="text-[#97887A] text-sm leading-relaxed">
            {campaign
              ? goalMet
                ? campaign.bonusClaimed ? 'Campaign complete. Time for a new target.' : 'Goal reached — claim your bonus.'
                : `${campaign.contacts.length} of ${campaign.goal} outreaches logged.`
              : 'Pick a company. Set a goal. Make contact.'}
          </p>
        </div>

        {!campaign ? (
          /* ── Setup screen ── */
          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-2">
                Target Company
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSetTarget(); }}
                placeholder="e.g. Acme Corp"
                className="w-full bg-white rounded-xl px-4 py-3 text-[#2C2724] placeholder-[#C4B5A5] text-sm focus:outline-none"
                style={{ border: '2px solid #F1E2CF' }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-1">
                Outreach Goal
              </label>
              <p className="text-[#A99C8D] text-xs mb-3">Smaller companies deserve less — don&apos;t spam a 10-person team.</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setGoal(n)}
                    className="flex-1 py-3 rounded-xl border text-sm font-bold transition-colors"
                    style={goal === n
                      ? { background: '#FFE6D3', border: '2px solid #F9C9A3', color: '#EA580C' }
                      : { background: '#FBF3E8', border: '2px solid #EFE0CC', color: '#97887A' }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-center text-[#A99C8D] text-xs mt-2">{GOAL_HINTS[goal]}</p>
            </div>

            <div className="bg-white rounded-xl p-4 space-y-2" style={{ border: '2px solid #F1E2CF' }}>
              {(['hot', 'lukewarm', 'cold'] as OutreachType[]).map(type => {
                const cfg = TYPE_CONFIG[type];
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-[#6f6155] text-sm font-semibold">{cfg.icon} {cfg.label} — {cfg.desc}</span>
                    <span className={`text-xs font-bold ${cfg.text} ml-3 shrink-0`}>+{cfg.xp} XP</span>
                  </div>
                );
              })}
              <div className="pt-2 mt-2 flex items-center justify-between" style={{ borderTop: '2px solid #F1E2CF' }}>
                <span className="text-[#A99C8D] text-xs">Same-day bonus ({GOAL_HINTS[goal]})</span>
                <span className="text-[#F4543C] text-xs font-bold">+{bonusXP(goal)} XP</span>
              </div>
            </div>

            <button
              onClick={handleSetTarget}
              disabled={!company.trim()}
              className="w-full py-3 rounded-xl text-white font-fredoka font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#F4543C', boxShadow: '0 3px 0 #C73828' }}
            >
              Set Target →
            </button>
          </div>
        ) : (
          /* ── Active / done screen ── */
          <div className="space-y-5">
            {/* Campaign header */}
            <div className="bg-white rounded-xl p-4" style={{ border: '2px solid #F1E2CF' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-0.5">Target</p>
                  <p className="font-fredoka font-bold text-lg text-[#2C2724] leading-tight">{campaign.company}</p>
                  <p className="text-[#97887A] text-xs mt-0.5">Goal: {campaign.goal} outreach{campaign.goal !== 1 ? 'es' : ''} · {GOAL_HINTS[campaign.goal]}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#97887A] hover:text-[#2C2724] transition-colors shrink-0 mt-0.5 font-semibold"
                >
                  New target
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[#A99C8D] mb-1.5">
                  <span>{campaign.contacts.length} logged</span>
                  <span>{campaign.goal} goal</span>
                </div>
                <div className="h-2 bg-[#F2E8DB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F4543C] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (campaign.contacts.length / campaign.goal) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Contact log */}
            {campaign.contacts.length > 0 && (
              <div className="space-y-2">
                {campaign.contacts.map((contact, i) => {
                  const cfg = TYPE_CONFIG[contact.type];
                  return (
                    <div key={contact.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.ring} ${cfg.bg}`}>
                      <span className="text-lg">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
                        <span className="text-[#A99C8D] text-xs ml-2">outreach #{i + 1}</span>
                      </div>
                      <span className={`text-xs font-semibold ${cfg.text}`}>+{cfg.xp} XP</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bonus claim */}
            {bonusEligible && (
              <button
                onClick={handleClaimBonus}
                className="w-full py-3 rounded-xl text-white font-fredoka font-bold text-sm transition-all"
                style={{ background: 'linear-gradient(to right, #F4543C, #FF8A4A)', boxShadow: '0 3px 0 #C73828' }}
              >
                🎉 Claim {bonusXP(campaign.goal)} XP Same-Day Bonus
              </button>
            )}

            {campaign.bonusClaimed && (
              <div className="w-full py-3 rounded-xl text-[#7C6F63] text-sm font-semibold text-center" style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}>
                ✓ Bonus claimed
              </div>
            )}

            {goalMet && !bonusEligible && !campaign.bonusClaimed && (
              <div className="bg-white rounded-xl px-4 py-3 text-center" style={{ border: '2px solid #F1E2CF' }}>
                <p className="text-[#6f6155] text-sm font-semibold">Goal reached — but contacts were spread across multiple days.</p>
                <p className="text-[#A99C8D] text-xs mt-1">No same-day bonus this time.</p>
              </div>
            )}

            {/* Log outreach form */}
            {!goalMet && (
              <div>
                {!showLog ? (
                  <button
                    onClick={() => setShowLog(true)}
                    className="w-full py-3 rounded-xl font-fredoka font-semibold text-sm transition-colors text-[#6f6155] hover:text-[#2C2724]"
                    style={{ background: '#FBF3E8', border: '2px solid #EFE0CC' }}
                  >
                    + Log an Outreach
                  </button>
                ) : (
                  <div className="bg-white rounded-xl p-4 space-y-4" style={{ border: '2px solid #F1E2CF' }}>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D]">Outreach type</p>
                    <div className="space-y-2">
                      {(['hot', 'lukewarm', 'cold'] as OutreachType[]).map(type => {
                        const cfg = TYPE_CONFIG[type];
                        const active = selectedType === type;
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                              active ? `${cfg.ring} ${cfg.bg}` : 'hover:bg-[#FBF3E8]'
                            }`}
                            style={!active ? { border: '2px solid #F1E2CF' } : undefined}
                          >
                            <span className="text-xl">{cfg.icon}</span>
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${active ? cfg.text : 'text-[#2C2724]'}`}>{cfg.label}</p>
                              <p className="text-[#97887A] text-xs">{cfg.desc}</p>
                            </div>
                            <span className={`text-xs font-bold shrink-0 ${active ? cfg.text : 'text-[#A99C8D]'}`}>+{cfg.xp} XP</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setShowLog(false)}
                        className="flex-1 py-2.5 rounded-xl text-[#97887A] text-sm font-semibold transition-colors hover:text-[#2C2724]"
                        style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLogOutreach}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-fredoka font-semibold transition-colors"
                        style={{ background: '#F4543C', boxShadow: '0 3px 0 #C73828' }}
                      >
                        Log Outreach
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reset after campaign fully done */}
            {goalMet && (campaign.bonusClaimed || !completedInOneDay) && (
              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl text-[#97887A] hover:text-[#2C2724] text-sm font-semibold transition-colors"
                style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}
              >
                Start a New Campaign
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
