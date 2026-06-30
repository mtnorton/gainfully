interface StatsRowProps {
  level: number;
  tasksCompleted: number;
  badgesEarned: number;
  resultsLogged: number;
}

export default function StatsRow({ level, tasksCompleted, badgesEarned, resultsLogged }: StatsRowProps) {
  const stats = [
    { icon: '🎯', label: 'Level',   value: level },
    { icon: '✅', label: 'Done',    value: tasksCompleted },
    { icon: '🏅', label: 'Badges',  value: badgesEarned },
    { icon: '📋', label: 'Results', value: resultsLogged },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-[16px] p-[13px] text-center"
          style={{ border: '2px solid #F1E2CF', borderBottom: '4px solid #EFE0CC' }}
        >
          <div className="text-[21px]">{stat.icon}</div>
          <div className="font-fredoka font-bold text-[21px] text-[#2C2724]">{stat.value}</div>
          <div className="text-[11px] text-[#A99C8D] font-bold uppercase tracking-wide">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
