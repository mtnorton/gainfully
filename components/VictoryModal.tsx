'use client';

import { useEffect, useState } from 'react';
import { VictoryStats } from '@/lib/types';

interface VictoryModalProps {
  stats: VictoryStats | null;
  onClose: () => void;
  onStartFresh: () => void;
}

export default function VictoryModal({ stats, onClose, onStartFresh }: VictoryModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!stats) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stats, onClose]);

  if (!stats) return null;

  const gainfullyBadge = stats.newBadges.find((b) => b.id === 'gainfully_employed');
  const otherBadges = stats.newBadges.filter((b) => b.id !== 'gainfully_employed');

  async function handleShare() {
    const lines = [
      `🎉 I just landed a job${stats!.company ? ` at ${stats!.company}` : ''}!`,
      '',
      `${stats!.weeksSearching} week${stats!.weeksSearching !== 1 ? 's' : ''} • ${stats!.activitiesCompleted} activities • ${stats!.interviewsLanded} interview${stats!.interviewsLanded !== 1 ? 's' : ''}`,
      '',
      'Job searched with Mvuu 🦛 mvuuapp.com',
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statCards = [
    { value: stats.weeksSearching, label: stats.weeksSearching === 1 ? 'week' : 'weeks' },
    { value: stats.activitiesCompleted, label: 'activities' },
    { value: stats.interviewsLanded, label: stats.interviewsLanded === 1 ? 'interview' : 'interviews' },
    { value: stats.badgesEarned, label: 'badges' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-modal-in"
        style={{ border: '3px solid #FCD34D' }}
      >
        {/* Gold header band */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{ background: 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 100%)' }}
        >
          <div className="text-6xl mb-3">🎊</div>
          <h2 className="font-fredoka font-bold text-[28px] text-[#2C2724] leading-tight">
            You got the job!
          </h2>
          {stats.company && (
            <p className="text-[#97887A] text-[15px] mt-1">at {stats.company}</p>
          )}

          {/* XP pill */}
          <div className="inline-flex items-baseline gap-2 rounded-2xl px-6 py-2.5 mt-4" style={{ background: '#FEF3C7', border: '2px solid #FCD34D' }}>
            <span className="font-fredoka font-black text-[#B45309] text-3xl">+{stats.xpEarned}</span>
            <span className="font-fredoka font-bold text-[#D97706] text-lg">XP</span>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-3 text-center"
                style={{ background: '#FFFBEB', border: '2px solid #FEF3C7', borderBottom: '3px solid #FCD34D' }}
              >
                <div className="font-fredoka font-bold text-[22px] text-[#2C2724]">{s.value}</div>
                <div className="text-[10px] text-[#97887A] font-bold uppercase tracking-wide leading-tight mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Gainfully Employed badge */}
          {gainfullyBadge && (
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: '#FFFBEB', border: '2px solid #FCD34D' }}
            >
              <span className="text-3xl">{gainfullyBadge.icon}</span>
              <div>
                <div className="font-fredoka font-bold text-[15px] text-[#B45309]">{gainfullyBadge.name}</div>
                <div className="text-[12px] text-[#97887A]">{gainfullyBadge.description}</div>
              </div>
              <div
                className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap"
                style={{ background: '#FCD34D', color: '#92400E' }}
              >
                NEW
              </div>
            </div>
          )}

          {/* Other new badges */}
          {otherBadges.length > 0 && (
            <div className="rounded-2xl p-3" style={{ background: '#FFF7E8', border: '2px solid #FCE3B0' }}>
              <div className="font-fredoka font-bold text-[11px] text-[#B45309] uppercase tracking-wide mb-2">
                Also unlocked
              </div>
              <div className="flex flex-wrap gap-2">
                {otherBadges.map((b) => (
                  <div key={b.id} className="flex items-center gap-1.5 rounded-xl px-2.5 py-1" style={{ background: '#FFF0CD', border: '1.5px solid #FCE3B0' }}>
                    <span className="text-sm">{b.icon}</span>
                    <span className="text-[#B45309] text-[11px] font-bold">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-2xl font-fredoka font-semibold text-[14px] transition-colors flex items-center justify-center gap-2"
            style={{ background: copied ? '#D1FAE5' : '#FFFBEB', border: `2px solid ${copied ? '#6EE7B7' : '#FCD34D'}`, color: copied ? '#065F46' : '#92400E' }}
          >
            {copied ? '✓ Copied to clipboard!' : '📋 Copy stats to share'}
          </button>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl font-fredoka font-semibold text-[15px] text-[#6f6155] transition-colors hover:bg-[#FEF3C7]"
              style={{ border: '2px solid #FCD34D' }}
            >
              Keep Tracking
            </button>
            <button
              onClick={onStartFresh}
              className="flex-1 py-3 rounded-2xl text-white font-fredoka font-semibold text-[15px] transition-colors"
              style={{ background: '#7C5CFC', boxShadow: '0 4px 0 #5B3FD6' }}
            >
              Start New Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
