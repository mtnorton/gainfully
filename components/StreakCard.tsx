interface StreakCardProps {
  streak: number;
}

function streakMessage(streak: number): string {
  if (streak === 1) return 'Great start! Every day you show up, you get stronger.';
  if (streak < 7)  return 'Building real momentum. Keep showing up.';
  if (streak < 14) return 'A full week! Consistency is your secret weapon.';
  if (streak < 30) return 'Two weeks strong. This is what dedication looks like.';
  return "30+ days. You've made this part of who you are.";
}

export default function StreakCard({ streak }: StreakCardProps) {
  if (streak === 0) {
    return (
      <div
        className="rounded-[22px] bg-[#FFF0E0] px-4 py-3 flex items-center gap-3"
        style={{ border: '2px solid #FFD9B8' }}
      >
        <span className="text-2xl">🔥</span>
        <div>
          <p className="font-fredoka font-semibold text-[#C2410C]">Start your streak today</p>
          <p className="text-[13px] text-[#B07A4E]">Any task counts — job search or self-care.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[22px] bg-[#FFF0E0] px-4 py-3 flex items-center gap-3"
      style={{ border: '2px solid #FFD9B8' }}
    >
      <span className="text-2xl animate-wiggle">🔥</span>
      <div className="flex-1 min-w-0">
        <p className="font-fredoka font-bold text-[16px] text-[#C2410C]">{streak}-day streak</p>
        <p className="text-[13px] text-[#B07A4E]">{streakMessage(streak)}</p>
      </div>
      <span className="font-fredoka font-black text-[30px] text-[#EA580C] flex-shrink-0">{streak}</span>
    </div>
  );
}
