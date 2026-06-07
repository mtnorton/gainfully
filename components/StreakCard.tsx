interface StreakCardProps {
  streak: number;
}

function streakMessage(streak: number): string {
  if (streak === 1) return 'Great start! Every day you show up, you get stronger.';
  if (streak < 7) return 'Building real momentum. Keep showing up.';
  if (streak < 14) return 'A full week! Consistency is your secret weapon.';
  if (streak < 30) return 'Two weeks strong. This is what dedication looks like.';
  return "30+ days. You've made this part of who you are.";
}

export default function StreakCard({ streak }: StreakCardProps) {
  if (streak === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700/60 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-slate-400 text-sm font-medium">Start your streak today</p>
          <p className="text-slate-500 text-xs mt-0.5">
            Any task counts — job search or self-care.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3 flex items-center gap-3">
      <span className="text-2xl">🔥</span>
      <div className="flex-1 min-w-0">
        <p className="text-slate-100 text-sm font-semibold">{streak}-day streak</p>
        <p className="text-orange-300/60 text-xs mt-0.5">{streakMessage(streak)}</p>
      </div>
      <span className="text-orange-400 font-black text-2xl flex-shrink-0">{streak}</span>
    </div>
  );
}
