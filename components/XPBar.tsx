interface XPBarProps {
  level: number;
  current: number;
  needed: number;
  percentage: number;
  totalXP: number;
}

export default function XPBar({ level, current, needed, percentage, totalXP }: XPBarProps) {
  return (
    <div
      className="bg-white rounded-[22px] p-[18px] relative overflow-hidden"
      style={{ border: '2px solid #F1E2CF', borderBottom: '5px solid #EFE0CC' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-[42px] h-[42px] rounded-full bg-[#7C5CFC] text-white flex items-center justify-center font-fredoka font-bold text-[19px] shadow-[0_3px_0_#5B3FD6] flex-shrink-0">
          {level}
        </div>
        <div className="flex-1">
          <div className="font-fredoka font-bold text-[19px] text-[#2C2724]">Level {level}</div>
          <div className="text-[13px] text-[#97887A]">
            {current.toLocaleString()} / {needed.toLocaleString()} XP to next level
          </div>
        </div>
        <div className="text-right">
          <div className="font-fredoka font-bold text-[24px] text-[#F5A300] leading-none">
            {totalXP.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#97887A]">total XP</div>
        </div>
      </div>

      <div className="h-[14px] bg-[#F2E8DB] rounded-full mt-[14px] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF8A4A] to-[#FF6B4A] transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between mt-[6px] text-[12px] text-[#97887A] font-bold">
        <span>Lvl {level}</span>
        <span className="text-[#FF6B4A]">{Math.round(percentage)}%</span>
        <span>Lvl {level + 1}</span>
      </div>
    </div>
  );
}
