'use client';

import { useState } from 'react';
import { Task, TaskCategory, CATEGORY_CONFIG, CustomActivity, ATS_CONFIG } from '@/lib/types';
import { BUILT_IN_ACTIVITIES } from '@/lib/builtInActivities';

type TaskData = Omit<Task, 'id' | 'completed' | 'createdAt'>;

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: TaskData) => void;
  onLogNow: (task: TaskData) => void;
  customActivities: CustomActivity[];
  xpOverrides: Record<string, number>;
  onManageActivities: () => void;
}

type GroupKey = 'advance' | 'build' | 'sustain';

const GROUPS: {
  key: GroupKey;
  label: string;
  defaultCategory: TaskCategory;
  categories: TaskCategory[];
  activeClass: string;
}[] = [
  { key: 'advance', label: 'Advance', defaultCategory: 'application', categories: ['application', 'networking'], activeClass: 'bg-blue-600 text-white border-blue-500' },
  { key: 'build',   label: 'Build',   defaultCategory: 'preparation', categories: ['preparation', 'research'],  activeClass: 'bg-yellow-500 text-slate-900 border-yellow-400' },
  { key: 'sustain', label: 'Sustain', defaultCategory: 'selfcare',    categories: ['selfcare'],                 activeClass: 'bg-rose-600 text-white border-rose-500' },
];

const CHIP_CLASSES: Partial<Record<TaskCategory, { base: string; selected: string }>> = {
  // Apply = light blue (sky), Network = dark blue
  application: { base: 'bg-sky-400/10 border-sky-400/20 text-sky-300 hover:bg-sky-400/20',       selected: 'bg-sky-400/25 border-sky-300/60 text-sky-100' },
  networking:  { base: 'bg-blue-700/15 border-blue-600/25 text-blue-400 hover:bg-blue-700/25',   selected: 'bg-blue-700/30 border-blue-500/60 text-blue-200' },
  // Prep = light yellow, Research = dark amber
  preparation: { base: 'bg-yellow-300/10 border-yellow-300/20 text-yellow-300 hover:bg-yellow-300/20', selected: 'bg-yellow-300/25 border-yellow-200/60 text-yellow-100' },
  research:    { base: 'bg-amber-600/15 border-amber-500/25 text-amber-400 hover:bg-amber-600/25',     selected: 'bg-amber-600/30 border-amber-400/60 text-amber-200' },
  // Sustain = rose
  selfcare:    { base: 'bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/20',         selected: 'bg-rose-500/25 border-rose-400/60 text-rose-100' },
};

const COMPANY_CONFIG: Record<GroupKey, { label: string; placeholder: string } | null> = {
  advance: { label: 'Company / Person', placeholder: 'Company name or contact' },
  build:   { label: 'Company', placeholder: 'Company (optional)' },
  sustain: null,
};

export default function AddTaskModal({
  isOpen,
  onClose,
  onAdd,
  onLogNow,
  customActivities,
  xpOverrides,
  onManageActivities,
}: AddTaskModalProps) {
  const [group, setGroup] = useState<GroupKey>('advance');
  const [category, setCategory] = useState<TaskCategory>('application');
  const [name, setName] = useState('');
  const [xp, setXP] = useState(CATEGORY_CONFIG['application'].defaultXP);
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ats, setAts] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const isAdvance = group === 'advance';
  const groupDef = GROUPS.find((g) => g.key === group)!;

  // Chips from all sub-categories in the group, tagged with their native category
  const allChips: { name: string; xp: number; category: TaskCategory }[] = [
    ...groupDef.categories.flatMap((cat) =>
      (BUILT_IN_ACTIVITIES[cat] ?? []).map((a) => ({
        name: a.name,
        xp: xpOverrides[a.name] ?? a.xp,
        category: cat,
      }))
    ),
    ...customActivities
      .filter((a) => groupDef.categories.includes(a.category))
      .map((a) => ({ name: a.name, xp: a.xp, category: a.category })),
  ];

  const selectedChip = allChips.find((c) => c.name === name);
  const showXPInput = name.trim().length > 0 && !selectedChip;
  const atsBonusXP = ats && ATS_CONFIG[ats] ? ATS_CONFIG[ats].bonusXP : 0;
  const companyConfig = COMPANY_CONFIG[group];

  const handleGroupSelect = (g: GroupKey) => {
    const def = GROUPS.find((gr) => gr.key === g)!;
    setGroup(g);
    setCategory(def.defaultCategory);
    setXP(CATEGORY_CONFIG[def.defaultCategory].defaultXP);
    setName('');
    setJobTitle('');
    setAts('');
    setShowAdvanced(false);
  };

  const selectChip = (chip: { name: string; xp: number; category: TaskCategory }) => {
    setName(chip.name);
    setXP(chip.xp);
    setCategory(chip.category);
  };

  const buildTaskData = (): TaskData => ({
    name: name.trim(),
    category,
    xp: xp + atsBonusXP,
    company: company.trim() || undefined,
    jobTitle: category === 'application' && jobTitle.trim() ? jobTitle.trim() : undefined,
    activityDate: activityDate || undefined,
    ats: ats || undefined,
  });

  const resetForm = () => {
    setGroup('advance');
    setCategory('application');
    setName('');
    setCompany('');
    setJobTitle('');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setXP(CATEGORY_CONFIG['application'].defaultXP);
    setAts('');
    setShowAdvanced(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogNow(buildTaskData());
    resetForm();
  };

  const handlePlanForLater = () => {
    if (!name.trim()) return;
    onAdd(buildTaskData());
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-start sm:pt-16 justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-100">Log Activity</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group picker — 3 buttons, one click */}
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider font-medium mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GROUPS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => handleGroupSelect(g.key)}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    group === g.key
                      ? g.activeClass
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600/60'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity chips */}
          {allChips.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-slate-400 text-xs uppercase tracking-wider font-medium">
                  Activities
                </label>
                <button
                  type="button"
                  onClick={onManageActivities}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Manage →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allChips.map((chip) => {
                  const isSelected = name === chip.name;
                  return (
                    <button
                      key={chip.name}
                      type="button"
                      onClick={() => selectChip(chip)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors text-left ${
                        isSelected
                          ? (CHIP_CLASSES[chip.category]?.selected ?? 'bg-violet-600/20 border-violet-500/40 text-slate-200')
                          : (CHIP_CLASSES[chip.category]?.base ?? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700')
                      }`}
                    >
                      <span>{chip.name}</span>
                      <span className="font-bold text-yellow-400 flex-shrink-0">{chip.xp} XP</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task name */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Task name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                group === 'advance'
                  ? 'e.g. Apply to Stripe, coffee chat with Alex...'
                  : group === 'build'
                    ? 'e.g. Mock interview, research Stripe culture...'
                    : 'e.g. Go for a walk, cook a proper meal...'
              }
              className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* XP input — free-form only */}
          {showXPInput && (
            <div className="flex items-center gap-3">
              <label className="text-slate-300 text-sm font-medium whitespace-nowrap">XP reward</label>
              <input
                type="number"
                min={1}
                max={500}
                value={xp}
                onChange={(e) => setXP(Math.max(1, Number(e.target.value)))}
                className="w-24 bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-2 text-yellow-400 font-bold text-sm outline-none transition-colors"
              />
              <span className="text-slate-500 text-xs">Set your own XP for this custom task</span>
            </div>
          )}

          {/* Company/Person + Date */}
          {companyConfig && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">
                  {companyConfig.label}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={companyConfig.placeholder}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Date</label>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Date only — when no company field (Sustain) */}
          {!companyConfig && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Date</label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 outline-none transition-colors"
              />
            </div>
          )}

          {/* Advanced Logging — Advance only, collapsed by default */}
          {isAdvance && (
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span>{showAdvanced ? '▾' : '▸'}</span>
                Advanced Logging
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">
                      Job title <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Product Designer"
                      className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">
                      Painful portal?{' '}
                      <span className="text-slate-500 font-normal">earns bonus XP for your suffering</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(ATS_CONFIG).map(([key, cfg]) => {
                        const selected = ats === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setAts(selected ? '' : key)}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                              selected
                                ? 'bg-orange-500/20 border-orange-500/40 text-orange-200'
                                : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300'
                            }`}
                          >
                            <span>{cfg.icon}</span>
                            <span>{cfg.label}</span>
                            <span className="text-yellow-400 font-bold">+{cfg.bonusXP}</span>
                          </button>
                        );
                      })}
                    </div>
                    {ats && ATS_CONFIG[ats] && (
                      <p className="text-slate-500 text-xs mt-2 italic">
                        &ldquo;{ATS_CONFIG[ats].quip}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePlanForLater}
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:text-slate-100 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              Plan for later
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors text-sm"
            >
              Log Now (+{(selectedChip ? selectedChip.xp : xp) + atsBonusXP} XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
