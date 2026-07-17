'use client';

import { useState } from 'react';
import { Application, Task, CATEGORY_CONFIG } from '@/lib/types';
import { OutcomeType, OUTCOME_CONFIG } from '@/lib/outcomes';
import { GAME_ONLY_TASK_NAMES } from '@/lib/gameLogic';

interface LogOutcomeModalProps {
  isOpen: boolean;
  preselectedTask: Task | null;
  preselectedApplication: Application | null;
  completedTasks: Task[];
  applications: Application[];
  onClose: () => void;
  onLog: (applicationId: string | null, taskId: string | null, type: OutcomeType, date: string, notes: string) => void;
}

type OutcomeGroup = { label: string; types: OutcomeType[] };

const NETWORKING_GROUPS: OutcomeGroup[] = [
  { label: 'Networking wins', types: ['coffee_chat', 'informational_interview', 'intro_made', 'response', 'referral'] },
  { label: 'No response', types: ['ghosted', 'other'] },
];

const RECRUITER_GROUPS: OutcomeGroup[] = [
  { label: 'Recruiter wins', types: ['right_to_represent', 'interview', 'technical_screening', 'technical_interview', 'second_interview', 'response', 'coffee_chat', 'referral', 'intro_made'] },
  { label: 'No response', types: ['ghosted', 'other'] },
  { label: 'Recruiter nonsense', types: ['standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'] },
];

const APPLICATION_GROUPS: OutcomeGroup[] = [
  { label: 'Positive news', types: ['interview', 'technical_screening', 'technical_interview', 'second_interview', 'reference_check', 'offer', 'accepted_offer'] },
  { label: 'Tough but normal', types: ['rejection', 'ghosted', 'position_closed', 'other'] },
  { label: 'Recruiter nonsense', types: ['standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'] },
];

const DEFAULT_GROUPS: OutcomeGroup[] = [
  { label: 'Positive news', types: ['interview', 'technical_screening', 'technical_interview', 'second_interview', 'offer', 'response', 'referral'] },
  { label: 'Recruiter nonsense', types: ['standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'] },
];

function groupsFor(category?: string): OutcomeGroup[] {
  if (category === 'recruiter')   return RECRUITER_GROUPS;
  if (category === 'networking')  return NETWORKING_GROUPS;
  if (category === 'application') return APPLICATION_GROUPS;
  return DEFAULT_GROUPS;
}

const NOTES_PLACEHOLDERS: Partial<Record<OutcomeType, string>> = {
  rejection: 'Any feedback you received?',
  ghosted:   'How long since your last contact?',
  interview: 'Details about the interview?',
  offer:     'Role, company, any notes?',
};

export default function LogOutcomeModal({
  isOpen,
  preselectedTask,
  preselectedApplication,
  completedTasks,
  applications,
  onClose,
  onLog,
}: LogOutcomeModalProps) {
  const [pickedApplicationId, setPickedApplicationId] = useState('');
  const [pickedTaskId, setPickedTaskId]               = useState('');
  const [selectedType, setSelectedType]               = useState<OutcomeType | null>(null);
  const [date, setDate]                               = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes]                             = useState('');

  if (!isOpen) return null;

  // Resolve active entity — application takes priority
  const activeApplication: Application | null =
    preselectedApplication ??
    (pickedApplicationId ? applications.find((a) => a.id === pickedApplicationId) ?? null : null);

  const activeTask: Task | null = activeApplication
    ? null
    : (preselectedTask ?? completedTasks.find((t) => t.id === pickedTaskId) ?? null);

  const isActive = !!(activeApplication || activeTask);

  const groups = activeApplication
    ? APPLICATION_GROUPS
    : groupsFor(activeTask?.category);

  const handleLog = () => {
    if (!isActive || !selectedType) return;
    onLog(
      activeApplication?.id ?? null,
      activeTask?.id         ?? null,
      selectedType,
      date,
      notes.trim(),
    );
  };

  const placeholder = selectedType ? (NOTES_PLACEHOLDERS[selectedType] ?? 'Any notes...') : 'Any notes...';

  // Determine what to show as the "subject" header
  const showPreselectedApp  = !!preselectedApplication;
  const showPreselectedTask = !preselectedApplication && !!preselectedTask;
  const showAppPicker       = !preselectedApplication && !preselectedTask && applications.length > 0;
  const showTaskPicker      = !preselectedApplication && !preselectedTask && applications.length === 0;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg bg-white rounded-[22px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ border: '2px solid #F1E2CF' }}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-fredoka font-bold text-[20px] text-[#2C2724]">Log a Result</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xl leading-none text-[#97887A] hover:text-[#2C2724] transition-colors"
            style={{ background: '#F2E8DB' }}
          >
            ×
          </button>
        </div>

        {/* ── Preselected application ── */}
        {showPreselectedApp && (
          <div className="mb-5">
            <p className="text-[#6f6155] text-sm font-semibold truncate">
              {preselectedApplication!.company}
              {preselectedApplication!.jobTitle && ` — ${preselectedApplication!.jobTitle}`}
            </p>
            {preselectedApplication!.dateApplied && (
              <p className="text-[#A99C8D] text-xs mt-0.5">
                Applied{' '}
                {new Date(preselectedApplication!.dateApplied + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        )}

        {/* ── Preselected task (legacy / non-application) ── */}
        {showPreselectedTask && (
          <div className="mb-5">
            <p className="text-[#6f6155] text-sm truncate font-semibold">{preselectedTask!.name}</p>
            {(preselectedTask!.company || preselectedTask!.jobTitle || preselectedTask!.activityDate) && (
              <p className="text-[#A99C8D] text-xs mt-0.5">
                {[
                  preselectedTask!.company,
                  preselectedTask!.jobTitle,
                  preselectedTask!.activityDate
                    ? new Date(preselectedTask!.activityDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* ── Application picker ── */}
        {showAppPicker && (
          <div className="mb-5">
            <label className="block text-[#A99C8D] text-xs uppercase tracking-wider font-bold mb-2">
              Which application?
            </label>
            <select
              value={pickedApplicationId}
              onChange={(e) => { setPickedApplicationId(e.target.value); setPickedTaskId(''); }}
              className="w-full bg-white rounded-xl px-4 py-2.5 text-[#2C2724] outline-none transition-colors text-sm"
              style={{ border: '2px solid #F1E2CF' }}
            >
              <option value="">Select an application...</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.company}{a.jobTitle ? ` — ${a.jobTitle}` : ''}{a.dateApplied ? ` (${a.dateApplied})` : ''}
                </option>
              ))}
            </select>
            {/* Task fallback for non-application results */}
            {completedTasks.filter((t) => !GAME_ONLY_TASK_NAMES.has(t.name)).length > 0 && !pickedApplicationId && (
              <div className="mt-3">
                <label className="block text-[#A99C8D] text-xs uppercase tracking-wider font-bold mb-2">
                  Or link to a specific task
                </label>
                <select
                  value={pickedTaskId}
                  onChange={(e) => setPickedTaskId(e.target.value)}
                  className="w-full bg-white rounded-xl px-4 py-2.5 text-[#2C2724] outline-none transition-colors text-sm"
                  style={{ border: '2px solid #F1E2CF' }}
                >
                  <option value="">Select a task...</option>
                  {completedTasks.filter((t) => !GAME_ONLY_TASK_NAMES.has(t.name)).map((t) => {
                    const detail = [t.company, t.jobTitle, t.activityDate
                      ? new Date(t.activityDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : null].filter(Boolean).join(', ');
                    return (
                      <option key={t.id} value={t.id}>
                        {CATEGORY_CONFIG[t.category].icon} {t.name}{detail ? ` — ${detail}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ── Task-only picker (no applications yet) ── */}
        {showTaskPicker && (
          <div className="mb-5">
            <label className="block text-[#A99C8D] text-xs uppercase tracking-wider font-bold mb-2">
              Which task had a result?
            </label>
            {completedTasks.filter((t) => !GAME_ONLY_TASK_NAMES.has(t.name)).length === 0 ? (
              <p className="text-[#97887A] text-sm italic py-2">
                No completed tasks yet — complete a task first, then log what happened.
              </p>
            ) : (
              <select
                value={pickedTaskId}
                onChange={(e) => setPickedTaskId(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-2.5 text-[#2C2724] outline-none transition-colors text-sm"
                style={{ border: '2px solid #F1E2CF' }}
              >
                <option value="">Select a task...</option>
                {completedTasks.filter((t) => !GAME_ONLY_TASK_NAMES.has(t.name)).map((t) => {
                  const detail = [t.company, t.jobTitle, t.activityDate
                    ? new Date(t.activityDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : null].filter(Boolean).join(', ');
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

        {/* ── Outcome type picker ── */}
        <div className={isActive ? '' : 'opacity-40 pointer-events-none'}>
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {group.types.map((type) => {
                  const config     = OUTCOME_CONFIG[type];
                  const isSelected = selectedType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? `${config.colorClasses} ring-2 ring-[#7C5CFC] ring-offset-1`
                          : 'bg-white hover:bg-[#FBF3E8]'
                      }`}
                      style={!isSelected ? { border: '2px solid #F1E2CF' } : undefined}
                    >
                      <span className="text-xl flex-shrink-0">{config.icon}</span>
                      <div>
                        <div className="font-fredoka font-semibold text-sm leading-tight text-[#2C2724]">
                          {config.label}
                        </div>
                        {config.xp > 0 && (
                          <div className="text-[#F5A300] text-xs font-bold mt-0.5">{config.xpLabel}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selectedType && (
            <div className="space-y-3 mt-2 pt-4" style={{ borderTop: '2px solid #F1E2CF' }}>
              <div>
                <label className="block text-[#6f6155] text-sm font-bold mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white rounded-xl px-4 py-2.5 text-[#2C2724] outline-none transition-colors text-sm"
                  style={{ border: '2px solid #F1E2CF' }}
                />
              </div>
              <div>
                <label className="block text-[#6f6155] text-sm font-bold mb-1.5">
                  Notes <span className="text-[#A99C8D] font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  maxLength={300}
                  className="w-full bg-white rounded-xl px-4 py-2.5 text-[#2C2724] placeholder-[#C4B5A5] outline-none transition-colors resize-none text-sm"
                  style={{ border: '2px solid #F1E2CF' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[#97887A] hover:text-[#2C2724] transition-colors font-semibold text-sm"
            style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}
          >
            Cancel
          </button>
          <button
            onClick={handleLog}
            disabled={!isActive || !selectedType}
            className="flex-1 py-2.5 rounded-xl text-white font-fredoka font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
          >
            Log It
          </button>
        </div>
      </div>
    </div>
  );
}
