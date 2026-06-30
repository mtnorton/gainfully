import { Badge } from '@/lib/types';

interface BadgeGridProps {
  badges: Badge[];
}

const GROUPS: { label: string; ids: string[] }[] = [
  {
    label: 'Tasks',
    ids: ['first_task', 'five_tasks', 'ten_tasks', 'twenty_five_tasks', 'fifty_tasks', 'hundred_tasks', 'two_hundred_tasks', 'five_hundred_tasks'],
  },
  {
    label: 'Applications',
    ids: ['five_applications', 'ten_applications', 'twenty_five_applications', 'fifty_applications', 'hundred_applications', 'workday_warrior', 'portal_survivor'],
  },
  {
    label: 'Networking',
    ids: ['five_networking', 'ten_networking', 'twenty_five_networking', 'fifty_networking', 'hundred_networking'],
  },
  {
    label: 'Interview Prep',
    ids: ['five_prep', 'ten_prep', 'twenty_five_prep'],
  },
  {
    label: 'Research',
    ids: ['five_research', 'ten_research', 'twenty_five_research'],
  },
  {
    label: 'Self-Care',
    ids: ['first_selfcare', 'five_selfcare', 'ten_selfcare', 'twenty_five_selfcare'],
  },
  {
    label: 'Well Rounded',
    ids: ['all_categories', 'full_stack_day', 'power_day', 'overdrive'],
  },
  {
    label: 'XP',
    ids: ['xp_500', 'xp_1000', 'xp_2500', 'xp_5000', 'xp_10000', 'xp_15000', 'xp_25000'],
  },
  {
    label: 'Levels',
    ids: ['level_3', 'level_5', 'level_7', 'level_10'],
  },
  {
    label: 'Interviews',
    ids: ['first_interview', 'three_interviews', 'five_interviews', 'ten_interviews', 'twenty_five_interviews', 'first_second_interview', 'three_second_interviews', 'five_second_interviews'],
  },
  {
    label: 'Results',
    ids: ['first_response', 'first_referral', 'three_referrals', 'five_referrals', 'offer_received', 'three_offers'],
  },
  {
    label: 'Resilience',
    ids: ['resilient', 'battle_hardened', 'ten_resilience', 'twenty_five_resilience', 'fifty_resilience'],
  },
  {
    label: 'Streaks',
    ids: ['streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_60', 'streak_100'],
  },
  {
    label: 'Longevity',
    ids: ['one_month', 'three_months', 'six_months', 'year_off'],
  },
];

function BadgeChip({ badge }: { badge: Badge }) {
  if (badge.earned) {
    return (
      <div
        className="flex items-center gap-3 bg-white rounded-[16px] p-[13px]"
        style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #F5A300' }}
      >
        <div className="w-[42px] h-[42px] rounded-[13px] bg-[#FFF2D6] flex items-center justify-center text-[21px] flex-shrink-0">
          {badge.icon}
        </div>
        <div className="min-w-0">
          <div className="font-fredoka font-semibold text-[14px] text-[#2C2724] truncate">{badge.name}</div>
          <div className="text-[11px] text-[#A99C8D] mt-0.5 truncate leading-snug">{badge.description}</div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-3 rounded-[16px] p-[13px] opacity-60"
      style={{ background: '#F6EEE2', border: '2px solid #F0E6D6' }}
    >
      <div className="w-[42px] h-[42px] rounded-[13px] bg-[#EBE2D4] flex items-center justify-center text-[21px] flex-shrink-0">
        🔒
      </div>
      <div className="min-w-0">
        <div className="font-fredoka font-semibold text-[14px] text-[#B6A99A] truncate">{badge.name}</div>
        <div className="text-[11px] text-[#C3B8A9] mt-0.5 truncate leading-snug">{badge.description}</div>
      </div>
    </div>
  );
}

export default function BadgeGrid({ badges }: BadgeGridProps) {
  const byId = Object.fromEntries(badges.map((b) => [b.id, b]));
  const earnedTotal = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-2">
        <h2 className="font-fredoka font-bold text-[22px] text-[#2C2724]">Badges</h2>
        <span className="font-bold text-[#F5A300]">{earnedTotal}</span>
        <span className="text-[13px] text-[#97887A]">/ {badges.length} earned</span>
      </div>

      {GROUPS.map((group) => {
        const groupBadges = group.ids.map((id) => byId[id]).filter(Boolean);
        if (groupBadges.length === 0) return null;
        const earnedCount = groupBadges.filter((b) => b.earned).length;

        return (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#A99C8D]">
                {group.label}
              </p>
              {earnedCount > 0 && (
                <span className="text-xs text-[#F5A300] font-bold">
                  {earnedCount}/{groupBadges.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {groupBadges.map((badge) => (
                <BadgeChip key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
