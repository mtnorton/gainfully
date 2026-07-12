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
      className="rounded-[18px] p-4 transition-all duration-200"
      style={{ background: '#fff', border: '2px solid #F1E2CF', borderBottom: '4px solid #EFE0CC' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-[38px] h-[38px] rounded-[11px] bg-[#F2E8DB] flex items-center justify-center text-[19px] flex-shrink-0"
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-fredoka font-semibold text-[15px] leading-snug text-[#2C2724]">
              {task.name}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${config.colorClasses}`}>
                {config.label}
              </span>
              <span className="text-xs text-[#F5A300] font-bold">+{task.xp} XP</span>
              {task.ats && ATS_CONFIG[task.ats] && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFE6D3] border border-[#F9C9A3] text-[#EA580C] font-bold">
                  {ATS_CONFIG[task.ats].icon} {ATS_CONFIG[task.ats].label}
                </span>
              )}
            </div>
            {(task.company || task.jobTitle || task.activityDate) && (
              <p className="text-xs text-[#A99C8D] mt-1.5">
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
              className="px-3 py-1.5 rounded-[11px] text-white text-sm font-fredoka font-semibold transition-colors whitespace-nowrap"
              style={{ background: '#16A34A', boxShadow: '0 3px 0 #0F7A37' }}
            >
              Complete ✓
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="w-7 h-7 rounded-lg bg-[#F2E8DB] hover:bg-[#FECACA] text-[#A99C8D] hover:text-[#DC2626] transition-colors flex items-center justify-center text-lg leading-none"
            aria-label="Delete task"
          >
            ×
          </button>
        </div>
      </div>

      {task.completed && (
        <div className="mt-3 pt-3 border-t border-[#EFE0CC] flex flex-wrap items-center gap-1.5">
          {outcomes.map((o) => (
            <OutcomeChip key={o.id} outcome={o} />
          ))}
          <button
            onClick={() => onLogOutcome(task.id)}
            className="text-xs px-2.5 py-1 rounded-full border border-dashed border-[#D4C7C0] text-[#A99C8D] hover:text-[#6f6155] hover:border-[#B8A898] transition-colors"
          >
            + Log outcome
          </button>
        </div>
      )}
    </div>
  );
}
