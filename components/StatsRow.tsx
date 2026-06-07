interface StatsRowProps {
  level: number;
  tasksCompleted: number;
  badgesEarned: number;
  resultsLogged: number;
}

export default function StatsRow({ level, tasksCompleted, badgesEarned, resultsLogged }: StatsRowProps) {
  const stats = [
    { icon: '🎯', label: 'Level', value: level },
    { icon: '✅', label: 'Done', value: tasksCompleted },
    { icon: '🏅', label: 'Badges', value: badgesEarned },
    { icon: '📋', label: 'Results', value: resultsLogged },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 text-center"
        >
          <div className="text-xl mb-0.5">{stat.icon}</div>
          <div className="text-slate-100 font-bold text-base leading-tight">{stat.value}</div>
          <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
