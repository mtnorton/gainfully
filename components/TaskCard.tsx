'use client';

import { Task, CATEGORY_CONFIG, ATS_CONFIG } from '@/lib/types';
import { Outcome } from '@/lib/outcomes';
import OutcomeChip from './OutcomeChip';

interface TaskCardProps {
  task: Task;
  outcomes: Outcome[];
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onLogOutcome: (taskId: string) => void;
}

export default function TaskCard({ task, outcomes, onComplete, onDelete, onLogOutcome }: TaskCardProps) {
  const config = CATEGORY_CONFIG[task.category] ?? CATEGORY_CONFIG['research'];

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 ${
        task.completed
          ? 'bg-slate-800/20 border-slate-700/30 opacity-60'
          : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl mt-0.5 flex-shrink-0">
            {task.completed ? '✅' : config.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium leading-snug ${
                task.completed ? 'line-through text-slate-400' : 'text-slate-100'
              }`}
            >
              {task.name}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${config.colorClasses}`}>
                {config.label}
              </span>
              <span className="text-xs text-yellow-400 font-semibold">+{task.xp} XP</span>
              {task.ats && ATS_CONFIG[task.ats] && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300">
                  {ATS_CONFIG[task.ats].icon} {ATS_CONFIG[task.ats].label}
                </span>
              )}
            </div>
            {(task.company || task.jobTitle || task.activityDate) && (
              <p className="text-xs text-slate-400 mt-1.5">
                {[
                  task.company,
                  task.jobTitle,
                  task.activityDate
                    ? new Date(task.activityDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!task.completed && (
            <button
              onClick={() => onComplete(task.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              Complete ✓
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center text-lg leading-none"
            aria-label="Delete task"
          >
            ×
          </button>
        </div>
      </div>

      {task.completed && (
        <div className="mt-3 pt-3 border-t border-slate-700/30 flex flex-wrap items-center gap-1.5">
          {outcomes.map((o) => (
            <OutcomeChip key={o.id} outcome={o} />
          ))}
          <button
            onClick={() => onLogOutcome(task.id)}
            className="text-xs px-2.5 py-1 rounded-full border border-dashed border-slate-600/60 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
          >
            + Log outcome
          </button>
        </div>
      )}
    </div>
  );
}
