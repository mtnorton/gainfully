'use client';

import { Task } from '@/lib/types';
import { Outcome, OUTCOME_CONFIG } from '@/lib/outcomes';

interface ActivityFeedProps {
  outcomes: Outcome[];
  tasks: Task[];
}

export default function ActivityFeed({ outcomes, tasks }: ActivityFeedProps) {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const sorted = [...outcomes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div
        className="rounded-[18px] p-8 text-center"
        style={{ border: '2px dashed #EFE0CC' }}
      >
        <p className="text-[#2C2724] font-fredoka font-semibold mb-0.5">No recent results.</p>
        <p className="text-[#97887A] text-sm">No news is… no news.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((outcome) => {
        const config = OUTCOME_CONFIG[outcome.type];
        const task = taskMap.get(outcome.taskId);
        const dateStr = new Date(outcome.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        return (
          <div
            key={outcome.id}
            className="rounded-[18px] p-4 bg-white"
            style={{ border: '2px solid #F1E2CF' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-[38px] h-[38px] rounded-[11px] bg-[#F2E8DB] flex items-center justify-center text-[19px] flex-shrink-0">
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-fredoka font-semibold text-[15px] text-[#2C2724]">
                      {config.label}
                    </span>
                    {config.xp > 0 && (
                      <span className="text-xs font-bold text-[#F5A300]">{config.xpLabel}</span>
                    )}
                  </div>
                  {task && (
                    <p className="text-[#A99C8D] text-xs mt-0.5 truncate">{task.name}</p>
                  )}
                  {outcome.notes && (
                    <p className="text-[#97887A] text-xs mt-1.5 italic leading-relaxed">
                      &ldquo;{outcome.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[#A99C8D] text-xs flex-shrink-0 mt-0.5">{dateStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
