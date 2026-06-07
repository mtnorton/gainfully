'use client';

import { useState } from 'react';
import { Task, CATEGORY_CONFIG } from '@/lib/types';
import { Outcome, OutcomeType, OUTCOME_CONFIG } from '@/lib/outcomes';

interface TaskDetailModalProps {
  task: Task | null;
  outcomes: Outcome[]; // sorted oldest → newest (timeline order)
  onClose: () => void;
  onLogOutcome: (taskId: string, type: OutcomeType, date: string, notes: string) => void;
}

const OUTCOME_GROUPS: { label: string; types: OutcomeType[] }[] = [
  { label: 'Positive news', types: ['interview', 'second_interview', 'offer', 'response', 'referral'] },
  { label: 'Tough but normal', types: ['rejection', 'ghosted', 'position_closed', 'other'] },
  { label: 'Recruiter nonsense', types: ['standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'] },
];

const NOTES_PLACEHOLDERS: Partial<Record<OutcomeType, string>> = {
  rejection: 'Any feedback received?',
  ghosted: 'How long since last contact?',
  interview: 'Details about the interview?',
  offer: 'Any notes on the offer?',
};

export default function TaskDetailModal({ task, outcomes, onClose, onLogOutcome }: TaskDetailModalProps) {
  const [selectedType, setSelectedType] = useState<OutcomeType | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!task) return null;

  const catConfig = CATEGORY_CONFIG[task.category] ?? CATEGORY_CONFIG['research'];

  const handleLog = () => {
    if (!selectedType) return;
    onLogOutcome(task.id, selectedType, date, notes.trim());
    setSelectedType(null);
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-modal-in">

        {/* Task header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-100 leading-snug">{task.name}</h2>
              {(task.company || task.jobTitle || task.activityDate) && (
                <p className="text-slate-400 text-sm mt-0.5">
                  {[
                    task.company,
                    task.jobTitle,
                    task.activityDate
                      ? new Date(task.activityDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${catConfig.colorClasses}`}>
                  {catConfig.icon} {catConfig.label}
                </span>
                <span className="text-xs text-yellow-400 font-semibold">+{task.xp} XP</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  task.completed
                    ? 'bg-slate-700/40 text-slate-400 border-slate-600/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {task.completed ? 'Completed' : 'Active'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xl leading-none transition-colors flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>

        {/* Results timeline */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-3">
            Results {outcomes.length > 0 && `(${outcomes.length})`}
          </p>
          {outcomes.length === 0 ? (
            <p className="text-slate-600 text-sm italic">No results logged yet.</p>
          ) : (
            <div className="relative">
              {outcomes.length > 1 && (
                <div className="absolute left-3.5 top-5 bottom-5 w-px bg-slate-700/60" />
              )}
              <div className="space-y-4">
                {outcomes.map((outcome) => {
                  const config = OUTCOME_CONFIG[outcome.type];
                  return (
                    <div key={outcome.id} className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 relative z-10 bg-slate-900 leading-none pt-0.5">
                        {config.icon}
                      </span>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${
                            config.sentiment === 'positive' ? 'text-slate-100' : 'text-slate-300'
                          }`}>
                            {config.label}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {new Date(outcome.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {config.xp > 0 && (
                            <span className={`text-xs ml-auto flex-shrink-0 ${
                              config.sentiment === 'resilience' ? 'text-slate-600' : 'text-yellow-400/60'
                            }`}>
                              +{config.xp} XP
                            </span>
                          )}
                        </div>
                        {outcome.notes && (
                          <p className="text-slate-500 text-xs mt-0.5 italic">&ldquo;{outcome.notes}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add a result */}
        <div className="p-6 pt-4 border-t border-slate-800 flex-shrink-0 space-y-3">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Add a result</p>

          {OUTCOME_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-slate-600 text-xs mb-1.5">{group.label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.types.map((type) => {
                  const config = OUTCOME_CONFIG[type];
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(isSelected ? null : type)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-violet-600/20 border-violet-500/60 ring-1 ring-violet-500/30'
                          : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60'
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{config.icon}</span>
                      <div className="min-w-0">
                        <div className={`text-xs font-medium leading-tight truncate ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                          {config.label}
                        </div>
                        {config.xp > 0 && (
                          <div className="text-yellow-400/60 text-xs">{config.xpLabel}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selectedType && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-slate-400 text-xs mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-2 text-slate-100 text-sm outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLog()}
                  placeholder={NOTES_PLACEHOLDERS[selectedType] ?? 'Any notes...'}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-2 text-slate-100 text-sm placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleLog}
            disabled={!selectedType}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            Log Result
          </button>
        </div>
      </div>
    </div>
  );
}
