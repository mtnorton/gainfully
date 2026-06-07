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
      <div className="rounded-2xl border border-dashed border-slate-700/60 p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-slate-300 font-medium mb-1">No results logged yet</p>
        <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
          Log what happened after a task — an interview, a rejection, a response, getting ghosted. It all counts.
        </p>
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
            className={`rounded-xl border p-4 ${
              config.sentiment === 'positive'
                ? 'bg-slate-800/50 border-slate-700/50'
                : config.sentiment === 'resilience'
                ? 'bg-slate-800/20 border-slate-700/20'
                : 'bg-slate-800/30 border-slate-700/30'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-semibold ${
                        config.sentiment === 'positive' ? 'text-slate-100' : 'text-slate-300'
                      }`}
                    >
                      {config.label}
                    </span>
                    {config.xp > 0 && (
                      <span
                        className={`text-xs font-medium ${
                          config.sentiment === 'resilience'
                            ? 'text-slate-500'
                            : 'text-yellow-400/80'
                        }`}
                      >
                        {config.xpLabel}
                      </span>
                    )}
                  </div>
                  {task && (
                    <p className="text-slate-400 text-xs mt-0.5 truncate">{task.name}</p>
                  )}
                  {outcome.notes && (
                    <p className="text-slate-500 text-xs mt-1.5 italic leading-relaxed">
                      &ldquo;{outcome.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>
              <span className="text-slate-500 text-xs flex-shrink-0 mt-0.5">{dateStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
