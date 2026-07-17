'use client';

import { useState } from 'react';
import { Task, CATEGORY_CONFIG } from '@/lib/types';
import { Outcome, OutcomeType, OUTCOME_CONFIG } from '@/lib/outcomes';

interface TaskDetailModalProps {
  task: Task | null;
  outcomes: Outcome[]; // sorted oldest → newest (timeline order)
  onClose: () => void;
  onLogOutcome: (taskId: string, type: OutcomeType, date: string, notes: string) => void;
  onDelete?: (taskId: string) => void;
  onDeleteOutcome?: (outcomeId: string) => void;
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
  { label: 'Positive news', types: ['interview', 'technical_screening', 'technical_interview', 'second_interview', 'offer', 'response', 'referral'] },
  { label: 'Tough but normal', types: ['rejection', 'ghosted', 'position_closed', 'other'] },
  { label: 'Recruiter nonsense', types: ['standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'] },
];

const DEFAULT_GROUPS: OutcomeGroup[] = [
  { label: 'Positive news', types: ['interview', 'technical_screening', 'technical_interview', 'second_interview', 'offer', 'response', 'referral'] },
  { label: 'Recruiter nonsense', types: ['standard_nonsense', 'ridiculous_nonsense', 'outrageous_nonsense'] },
];

function groupsFor(category: string): OutcomeGroup[] {
  if (category === 'recruiter')   return RECRUITER_GROUPS;
  if (category === 'networking')  return NETWORKING_GROUPS;
  if (category === 'application') return APPLICATION_GROUPS;
  return DEFAULT_GROUPS;
}

const NOTES_PLACEHOLDERS: Partial<Record<OutcomeType, string>> = {
  rejection: 'Any feedback received?',
  ghosted: 'How long since last contact?',
  interview: 'Details about the interview?',
  offer: 'Any notes on the offer?',
};

export default function TaskDetailModal({ task, outcomes, onClose, onLogOutcome, onDelete, onDeleteOutcome }: TaskDetailModalProps) {
  const [selectedType, setSelectedType] = useState<OutcomeType | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      <div
        className="relative z-10 w-full max-w-lg bg-white rounded-[22px] shadow-2xl max-h-[90vh] flex flex-col animate-modal-in"
        style={{ border: '2px solid #F1E2CF' }}
      >

        {/* Task header */}
        <div className="p-6 pb-4 flex-shrink-0" style={{ borderBottom: '2px solid #F1E2CF' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-fredoka font-bold text-lg text-[#2C2724] leading-snug">{task.name}</h2>
              {(task.company || task.jobTitle || task.activityDate) && (
                <p className="text-[#97887A] text-sm mt-0.5">
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
                <span className="text-xs text-[#F5A300] font-bold">+{task.xp} XP</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  task.completed
                    ? 'bg-[#F2E8DB] text-[#7C6F63] border-[#EFE0CC]'
                    : 'bg-[#DCFAE7] text-[#16A34A] border-[#B0EFC8]'
                }`}>
                  {task.completed ? 'Completed' : 'Active'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onDelete && !confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-[#97887A] hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xl leading-none text-[#97887A] hover:text-[#2C2724] transition-colors"
                style={{ background: '#F2E8DB' }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0" style={{ background: '#FEF2F2', borderBottom: '2px solid #FECACA' }}>
            <p className="text-sm text-red-700 font-semibold">Delete this task and all its outcomes?</p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-[#97887A] font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onDelete?.(task.id)}
                className="text-xs text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#DC2626' }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}

        {/* Results timeline */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D] mb-3">
            Results {outcomes.length > 0 && `(${outcomes.length})`}
          </p>
          {outcomes.length === 0 ? (
            <p className="text-[#97887A] text-sm italic">No results logged yet.</p>
          ) : (
            <div className="relative">
              {outcomes.length > 1 && (
                <div className="absolute left-3.5 top-5 bottom-5 w-px bg-[#EFE0CC]" />
              )}
              <div className="space-y-4">
                {outcomes.map((outcome) => {
                  const config = OUTCOME_CONFIG[outcome.type];
                  return (
                    <div key={outcome.id} className="flex items-start gap-3 group">
                      <span className="text-lg flex-shrink-0 relative z-10 bg-white leading-none pt-0.5">
                        {config.icon}
                      </span>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-fredoka font-semibold text-sm text-[#2C2724]">
                            {config.label}
                          </span>
                          <span className="text-[#A99C8D] text-xs">
                            {new Date(outcome.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {config.xp > 0 && (
                            <span className="text-xs ml-auto flex-shrink-0 text-[#F5A300] font-bold">
                              +{config.xp} XP
                            </span>
                          )}
                        </div>
                        {outcome.notes && (
                          <p className="text-[#97887A] text-xs mt-0.5 italic">&ldquo;{outcome.notes}&rdquo;</p>
                        )}
                      </div>
                      {onDeleteOutcome && (
                        <button
                          onClick={() => onDeleteOutcome(outcome.id)}
                          className="flex-shrink-0 text-[#C4B5A5] hover:text-red-400 transition-colors text-base leading-none pt-0.5 opacity-0 group-hover:opacity-100"
                          title="Delete outcome"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add a result */}
        <div className="p-6 pt-4 flex-shrink-0 space-y-3" style={{ borderTop: '2px solid #F1E2CF' }}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D]">Add a result</p>

          {groupsFor(task.category).map((group) => (
            <div key={group.label}>
              <p className="text-[#A99C8D] text-xs mb-1.5 font-semibold">{group.label}</p>
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
                          ? `${config.colorClasses} ring-2 ring-[#7C5CFC] ring-offset-1`
                          : 'bg-white hover:bg-[#FBF3E8]'
                      }`}
                      style={!isSelected ? { border: '2px solid #F1E2CF' } : undefined}
                    >
                      <span className="text-base flex-shrink-0">{config.icon}</span>
                      <div className="min-w-0">
                        <div className="font-fredoka font-semibold text-xs leading-tight truncate text-[#2C2724]">
                          {config.label}
                        </div>
                        {config.xp > 0 && (
                          <div className="text-[#F5A300] text-xs font-bold">{config.xpLabel}</div>
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
                <label className="block text-[#6f6155] text-xs font-bold mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white rounded-xl px-3 py-2 text-[#2C2724] text-sm outline-none transition-colors"
                  style={{ border: '2px solid #F1E2CF' }}
                />
              </div>
              <div>
                <label className="block text-[#6f6155] text-xs font-bold mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLog()}
                  placeholder={NOTES_PLACEHOLDERS[selectedType] ?? 'Any notes...'}
                  className="w-full bg-white rounded-xl px-3 py-2 text-[#2C2724] text-sm placeholder-[#C4B5A5] outline-none transition-colors"
                  style={{ border: '2px solid #F1E2CF' }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleLog}
            disabled={!selectedType}
            className="w-full py-2.5 rounded-xl text-white font-fredoka font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
          >
            Log Result
          </button>
        </div>
      </div>
    </div>
  );
}
