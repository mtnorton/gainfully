'use client';

import { useState } from 'react';
import { Task, CATEGORY_CONFIG } from '@/lib/types';
import { OutcomeType, OUTCOME_CONFIG } from '@/lib/outcomes';

interface LogOutcomeModalProps {
  isOpen: boolean;
  preselectedTask: Task | null;
  completedTasks: Task[];
  onClose: () => void;
  onLog: (taskId: string, type: OutcomeType, date: string, notes: string) => void;
}

const OUTCOME_GROUPS: { label: string; types: OutcomeType[] }[] = [
  {
    label: 'Positive news',
    types: ['interview', 'second_interview', 'offer', 'response', 'referral'],
  },
  {
    label: 'Tough but normal',
    types: ['rejection', 'ghosted', 'position_closed', 'other'],
  },
  {
    label: 'Recruiter nonsense',
    types: ['standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'],
  },
];

const NOTES_PLACEHOLDERS: Partial<Record<OutcomeType, string>> = {
  rejection: 'Any feedback you received?',
  ghosted: 'How long since your last contact?',
  interview: 'Details about the interview?',
  offer: 'Role, company, any notes?',
};

export default function LogOutcomeModal({
  isOpen,
  preselectedTask,
  completedTasks,
  onClose,
  onLog,
}: LogOutcomeModalProps) {
  const [pickedTaskId, setPickedTaskId] = useState('');
  const [selectedType, setSelectedType] = useState<OutcomeType | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const activeTask =
    preselectedTask ?? completedTasks.find((t) => t.id === pickedTaskId) ?? null;

  const handleLog = () => {
    if (!activeTask || !selectedType) return;
    onLog(activeTask.id, selectedType, date, notes.trim());
  };

  const placeholder =
    selectedType ? (NOTES_PLACEHOLDERS[selectedType] ?? 'Any notes...') : 'Any notes...';

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-slate-100">Log a Result</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Task — either shown as a label (preselected) or a picker */}
        {preselectedTask ? (
          <div className="mb-5">
            <p className="text-slate-400 text-sm truncate">{preselectedTask.name}</p>
            {(preselectedTask.company || preselectedTask.jobTitle || preselectedTask.activityDate) && (
              <p className="text-slate-500 text-xs mt-0.5">
                {[
                  preselectedTask.company,
                  preselectedTask.jobTitle,
                  preselectedTask.activityDate
                    ? new Date(preselectedTask.activityDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-5">
            <label className="block text-slate-400 text-xs uppercase tracking-wider font-medium mb-2">
              Which task had a result?
            </label>
            {completedTasks.length === 0 ? (
              <p className="text-slate-500 text-sm italic py-2">
                No completed tasks yet — complete a task first, then log what happened.
              </p>
            ) : (
              <select
                value={pickedTaskId}
                onChange={(e) => setPickedTaskId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 outline-none transition-colors"
              >
                <option value="">Select a task...</option>
                {completedTasks.map((t) => {
                  const detail = [
                    t.company,
                    t.jobTitle,
                    t.activityDate
                      ? new Date(t.activityDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <option key={t.id} value={t.id}>
                      {CATEGORY_CONFIG[t.category].icon} {t.name}{detail ? ` — ${detail}` : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        )}

        {/* Outcome type picker — dimmed until a task is selected */}
        <div className={activeTask ? '' : 'opacity-40 pointer-events-none'}>
          {OUTCOME_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.types.map((type) => {
                  const config = OUTCOME_CONFIG[type];
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-violet-600/20 border-violet-500/60 ring-1 ring-violet-500/30'
                          : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600/60'
                      }`}
                    >
                      <span className="text-xl flex-shrink-0">{config.icon}</span>
                      <div>
                        <div
                          className={`text-sm font-medium leading-tight ${
                            isSelected ? 'text-slate-100' : 'text-slate-300'
                          }`}
                        >
                          {config.label}
                        </div>
                        {config.xp > 0 && (
                          <div className="text-yellow-400/70 text-xs mt-0.5">{config.xpLabel}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selectedType && (
            <div className="space-y-3 mt-2 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">
                  Notes{' '}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  maxLength={300}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-colors resize-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleLog}
            disabled={!activeTask || !selectedType}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            Log It
          </button>
        </div>
      </div>
    </div>
  );
}
