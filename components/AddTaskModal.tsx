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

const SECTION_GROUPS: {
  label: string;
  labelColor: string;
  sections: { category: TaskCategory; emoji: string; label: string }[];
}[] = [
  {
    label: 'Advance',
    labelColor: '#2563EB',
    sections: [
      { category: 'application', emoji: '📋', label: 'Application' },
      { category: 'networking',  emoji: '🤝', label: 'Networking' },
    ],
  },
  {
    label: 'Build',
    labelColor: '#16A34A',
    sections: [
      { category: 'preparation', emoji: '🎯', label: 'Preparation' },
      { category: 'research',    emoji: '🔍', label: 'Research' },
      { category: 'skills',      emoji: '💡', label: 'Skills' },
    ],
  },
  {
    label: 'Sustain',
    labelColor: '#7C5CFC',
    sections: [
      { category: 'selfcare', emoji: '🌿', label: 'Self-Care' },
      { category: 'hustle',   emoji: '💰', label: 'Hustle' },
    ],
  },
];

const CATEGORY_COMPANY: Record<TaskCategory, { label: string; placeholder: string } | null> = {
  application: { label: 'Company / Person', placeholder: 'Company name or contact' },
  networking:  { label: 'Company / Person', placeholder: 'Company name or contact' },
  preparation: { label: 'Company', placeholder: 'Company (optional)' },
  research:    { label: 'Company', placeholder: 'Company (optional)' },
  skills:      null,
  selfcare:    null,
  hustle:      null,
  custom:      null,
};

const inputClass = 'w-full bg-white rounded-xl px-4 py-2.5 text-[#2C2724] placeholder-[#C4B5A5] outline-none transition-colors text-sm';
const inputStyle = { border: '2px solid #F1E2CF' };

export default function AddTaskModal({
  isOpen,
  onClose,
  onAdd,
  onLogNow,
  customActivities,
  xpOverrides,
  onManageActivities,
}: AddTaskModalProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<TaskCategory>>(
    () => new Set<TaskCategory>()
  );
  const [category, setCategory] = useState<TaskCategory>('application');
  const [name, setName] = useState('');
  const [xp, setXP] = useState(CATEGORY_CONFIG['application'].defaultXP);
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [ats, setAts] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (cat: TaskCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const getChipsForCategory = (cat: TaskCategory): { name: string; xp: number; category: TaskCategory }[] => [
    ...(BUILT_IN_ACTIVITIES[cat] ?? []).map((a) => ({
      name: a.name,
      xp: xpOverrides[a.name] ?? a.xp,
      category: cat,
    })),
    ...customActivities
      .filter((a) => a.category === cat)
      .map((a) => ({ name: a.name, xp: a.xp, category: cat })),
  ];

  const allChipsFlat = SECTION_GROUPS.flatMap((g) =>
    g.sections.flatMap((s) => getChipsForCategory(s.category))
  );
  const selectedChip = allChipsFlat.find((c) => c.name === name);
  const showXPInput = name.trim().length > 0 && !selectedChip;
  const atsBonusXP = ats && ATS_CONFIG[ats] ? ATS_CONFIG[ats].bonusXP : 0;
  const companyConfig = CATEGORY_COMPANY[category];

  const selectChip = (chip: { name: string; xp: number; category: TaskCategory }) => {
    setName(chip.name);
    setXP(chip.xp);
    setCategory(chip.category);
    setAts('');
    setShowAdvanced(false);
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg bg-white rounded-[22px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ border: '2px solid #F1E2CF' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-fredoka font-bold text-[20px] text-[#2C2724]">Log Activity</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xl leading-none text-[#97887A] hover:text-[#2C2724] transition-colors"
            style={{ background: '#F2E8DB' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity sections */}
          <div className="space-y-3">
            {SECTION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: group.labelColor }}>
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.sections.map((section) => {
                    const chips = getChipsForCategory(section.category);
                    const isExpanded = expandedCategories.has(section.category);
                    const cfg = CATEGORY_CONFIG[section.category];
                    return (
                      <div key={section.category}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(section.category)}
                          className="flex items-center gap-2 w-full text-left py-1.5 transition-colors text-[#2C2724] hover:text-[#7C5CFC]"
                        >
                          <span className="text-base leading-none">{section.emoji}</span>
                          <span className="text-sm font-semibold">{section.label}</span>
                          <span className="ml-auto text-[10px] opacity-50">
                            {isExpanded ? '▾' : '▸'}
                          </span>
                        </button>
                        {isExpanded && chips.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 pb-2 pl-1">
                            {chips.map((chip) => {
                              const isSelected = name === chip.name;
                              return (
                                <button
                                  key={chip.name}
                                  type="button"
                                  onClick={() => selectChip(chip)}
                                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left ${cfg.colorClasses} ${isSelected ? 'ring-2 ring-[#7C5CFC] ring-offset-1' : ''}`}
                                >
                                  <span>{chip.name}</span>
                                  <span className="font-bold flex-shrink-0 text-[#F5A300]">{chip.xp} XP</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onManageActivities}
                className="text-xs text-[#7C5CFC] hover:text-[#5B3FD6] transition-colors font-semibold"
              >
                Manage activities →
              </button>
            </div>
          </div>

          {/* Task name */}
          <div>
            <label className="block text-[#6f6155] text-sm font-bold mb-1.5">Task name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Select an activity above, or type your own..."
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* XP + category picker — free-form only */}
          {showXPInput && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <label className="text-[#6f6155] text-sm font-bold whitespace-nowrap">XP reward</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={xp}
                  onChange={(e) => setXP(Math.max(1, Number(e.target.value)))}
                  className="w-24 rounded-xl px-3 py-2 text-[#F5A300] font-bold text-sm outline-none transition-colors bg-white"
                  style={inputStyle}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#A99C8D] text-xs">Category:</span>
                {SECTION_GROUPS.flatMap((g) => g.sections).map((s) => {
                  const isSelected = category === s.category;
                  const cfg = CATEGORY_CONFIG[s.category];
                  return (
                    <button
                      key={s.category}
                      type="button"
                      onClick={() => setCategory(s.category)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all ${cfg.colorClasses} ${isSelected ? 'ring-2 ring-[#7C5CFC] ring-offset-1' : ''}`}
                    >
                      <span>{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Company + Date */}
          {companyConfig ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#6f6155] text-sm font-bold mb-1.5">
                  {companyConfig.label}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={companyConfig.placeholder}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-[#6f6155] text-sm font-bold mb-1.5">Date</label>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[#6f6155] text-sm font-bold mb-1.5">Date</label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          {/* Advanced Logging — application only */}
          {category === 'application' && (
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-[#97887A] hover:text-[#2C2724] transition-colors font-semibold"
              >
                <span>{showAdvanced ? '▾' : '▸'}</span>
                Advanced Logging
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-4">
                  <div>
                    <label className="block text-[#6f6155] text-sm font-bold mb-1.5">
                      Job title <span className="text-[#A99C8D] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Product Designer"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-[#6f6155] text-sm font-bold mb-1.5">
                      Painful portal?{' '}
                      <span className="text-[#A99C8D] font-normal">earns bonus XP for your suffering</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(ATS_CONFIG).map(([key, cfg]) => {
                        const selected = ats === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setAts(selected ? '' : key)}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
                            style={selected
                              ? { background: '#FFE6D3', border: '2px solid #F9C9A3', color: '#EA580C' }
                              : { background: '#F2E8DB', border: '2px solid #EFE0CC', color: '#6f6155' }
                            }
                          >
                            <span>{cfg.icon}</span>
                            <span>{cfg.label}</span>
                            <span className="font-bold text-[#F5A300]">+{cfg.bonusXP}</span>
                          </button>
                        );
                      })}
                    </div>
                    {ats && ATS_CONFIG[ats] && (
                      <p className="text-[#A99C8D] text-xs mt-2 italic">
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
              className="px-4 py-2.5 rounded-xl text-[#97887A] hover:text-[#2C2724] transition-colors font-semibold text-sm"
              style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePlanForLater}
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl text-[#6f6155] hover:text-[#2C2724] disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
              style={{ border: '2px solid #EFE0CC', background: '#FBF3E8' }}
            >
              Plan for later
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-fredoka"
              style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
            >
              Log Now (+{(selectedChip ? selectedChip.xp : xp) + atsBonusXP} XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
