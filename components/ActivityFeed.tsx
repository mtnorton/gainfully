'use client';

import Link from 'next/link';
import { Task } from '@/lib/types';
import { Outcome, OUTCOME_CONFIG } from '@/lib/outcomes';

const MAX_VISIBLE = 5;

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

  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - MAX_VISIBLE;

  return (
    <div className="space-y-1.5">
      {visible.map((outcome) => {
        const config = OUTCOME_CONFIG[outcome.type];
        const task = outcome.taskId ? taskMap.get(outcome.taskId) : undefined;
        const dateStr = new Date(outcome.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        return (
          <div
            key={outcome.id}
            className="rounded-2xl px-3 py-2.5 bg-white"
            style={{ border: '2px solid #F1E2CF' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#F2E8DB] flex items-center justify-center text-sm flex-shrink-0">
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-fredoka font-semibold text-sm text-[#2C2724] leading-snug">
                      {config.label}
                    </span>
                    {config.xp > 0 && (
                      <span className="text-xs font-bold text-[#F5A300]">{config.xpLabel}</span>
                    )}
                  </div>
                  {(task || outcome.notes) && (
                    <p className="text-[#A99C8D] text-xs truncate leading-tight">
                      {task?.name}{task && outcome.notes ? ' · ' : ''}{outcome.notes ? `"${outcome.notes}"` : ''}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[#A99C8D] text-xs flex-shrink-0">{dateStr}</span>
            </div>
          </div>
        );
      })}

      {overflow > 0 && (
        <p className="text-xs text-[#A99C8D] text-center pt-1">
          and {overflow} more ·{' '}
          <Link href="/pipeline" className="text-[#7C5CFC] hover:underline font-semibold">
            view all
          </Link>
        </p>
      )}
    </div>
  );
}
