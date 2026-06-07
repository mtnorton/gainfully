import { Badge } from '@/lib/types';

interface BadgeGridProps {
  badges: Badge[];
}

const GROUPS: { label: string; ids: string[] }[] = [
  {
    label: 'Tasks',
    ids: ['first_task', 'five_tasks', 'ten_tasks', 'twenty_five_tasks', 'fifty_tasks', 'hundred_tasks'],
  },
  {
    label: 'Applications',
    ids: ['five_applications', 'ten_applications', 'twenty_five_applications', 'workday_warrior', 'portal_survivor'],
  },
  {
    label: 'Networking',
    ids: ['five_networking', 'ten_networking'],
  },
  {
    label: 'Interview Prep',
    ids: ['five_prep', 'ten_prep'],
  },
  {
    label: 'Research',
    ids: ['five_research'],
  },
  {
    label: 'Self-Care',
    ids: ['first_selfcare', 'five_selfcare'],
  },
  {
    label: 'Well Rounded',
    ids: ['all_categories', 'power_day'],
  },
  {
    label: 'XP',
    ids: ['xp_500', 'xp_1000', 'xp_2500', 'xp_5000', 'xp_10000'],
  },
  {
    label: 'Levels',
    ids: ['level_3', 'level_5', 'level_7', 'level_10'],
  },
  {
    label: 'Interviews',
    ids: ['first_interview', 'three_interviews', 'ten_interviews', 'first_second_interview'],
  },
  {
    label: 'Results',
    ids: ['first_referral', 'offer_received'],
  },
  {
    label: 'Resilience',
    ids: ['resilient', 'battle_hardened', 'ten_resilience'],
  },
  {
    label: 'Streaks',
    ids: ['streak_3', 'streak_7', 'streak_14', 'streak_30'],
  },
];

function BadgeChip({ badge }: { badge: Badge }) {
  if (badge.earned) {
    return (
      <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
        <span className="text-2xl flex-shrink-0">{badge.icon}</span>
        <div className="min-w-0">
          <div className="text-amber-200 text-xs font-semibold leading-tight truncate">{badge.name}</div>
          <div className="text-amber-400/60 text-xs mt-0.5 truncate">{badge.description}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 opacity-40">
      <span className="text-2xl flex-shrink-0 grayscale">🔒</span>
      <div className="min-w-0">
        <div className="text-slate-400 text-xs font-semibold leading-tight truncate">{badge.name}</div>
        <div className="text-slate-500 text-xs mt-0.5 truncate">{badge.description}</div>
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
        <h2 className="text-slate-100 font-semibold">Badges</h2>
        <span className="text-sm text-slate-400 font-normal">
          {earnedTotal} / {badges.length} earned
        </span>
      </div>

      {GROUPS.map((group) => {
        const groupBadges = group.ids.map((id) => byId[id]).filter(Boolean);
        if (groupBadges.length === 0) return null;
        const earnedCount = groupBadges.filter((b) => b.earned).length;

        return (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              {earnedCount > 0 && (
                <span className="text-xs text-amber-400 font-medium">
                  {earnedCount}/{groupBadges.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
