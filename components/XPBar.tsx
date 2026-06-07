interface XPBarProps {
  level: number;
  current: number;
  needed: number;
  percentage: number;
  totalXP: number;
}

export default function XPBar({ level, current, needed, percentage, totalXP }: XPBarProps) {
  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-600 text-white font-bold text-sm shadow-lg shadow-violet-900/50">
            {level}
          </div>
          <div>
            <div className="text-slate-100 font-semibold">Level {level}</div>
            <div className="text-slate-400 text-xs">
              {current.toLocaleString()} / {needed.toLocaleString()} XP to next level
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-bold text-lg">{totalXP.toLocaleString()}</div>
          <div className="text-slate-400 text-xs">total XP</div>
        </div>
      </div>

      <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-slate-500 text-xs">Lvl {level}</span>
        <span className="text-violet-400 text-xs font-medium">{Math.round(percentage)}%</span>
        <span className="text-slate-500 text-xs">Lvl {level + 1}</span>
      </div>
    </div>
  );
}
