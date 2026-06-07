'use client';

import { useState } from 'react';
import { CustomActivity, TaskCategory, CATEGORY_CONFIG } from '@/lib/types';
import { BUILT_IN_ACTIVITIES } from '@/lib/builtInActivities';

interface ManageActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: CustomActivity[];
  xpOverrides: Record<string, number>;
  onAdd: (activity: Omit<CustomActivity, 'id' | 'createdAt'>) => void;
  onDelete: (activityId: string) => void;
  onSetOverride: (name: string, xp: number, defaultXP: number) => void;
}

const GROUPS: {
  key: string;
  label: string;
  labelClass: string;
  defaultCategory: TaskCategory;
  categories: TaskCategory[];
}[] = [
  { key: 'advance', label: 'Advance', labelClass: 'text-blue-400',   defaultCategory: 'application', categories: ['application', 'networking'] },
  { key: 'build',   label: 'Build',   labelClass: 'text-yellow-400', defaultCategory: 'preparation', categories: ['preparation', 'research'] },
  { key: 'sustain', label: 'Sustain', labelClass: 'text-rose-400',   defaultCategory: 'selfcare',    categories: ['selfcare'] },
];

export default function ManageActivitiesModal({
  isOpen,
  onClose,
  activities,
  xpOverrides,
  onAdd,
  onDelete,
  onSetOverride,
}: ManageActivitiesModalProps) {
  const [newGroup, setNewGroup] = useState('advance');
  const [newName, setNewName] = useState('');
  const [newXP, setNewXP] = useState(CATEGORY_CONFIG['application'].defaultXP);

  if (!isOpen) return null;

  const selectedGroup = GROUPS.find((g) => g.key === newGroup)!;

  const handleGroupChange = (key: string) => {
    const group = GROUPS.find((g) => g.key === key)!;
    setNewGroup(key);
    setNewXP(CATEGORY_CONFIG[group.defaultCategory].defaultXP);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({ name: newName.trim(), category: selectedGroup.defaultCategory, xp: newXP });
    setNewName('');
    setNewXP(CATEGORY_CONFIG[selectedGroup.defaultCategory].defaultXP);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Manage Activities</h2>
            <p className="text-slate-500 text-xs mt-0.5">Edit XP for any activity, or add your own.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-xl leading-none transition-colors flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Activity list grouped by Advance / Build / Sustain */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {GROUPS.map((group) => {
            const builtIns = group.categories.flatMap((cat) =>
              (BUILT_IN_ACTIVITIES[cat] ?? []).map((a) => ({ ...a, cat }))
            );
            const custom = activities.filter((a) => group.categories.includes(a.category));
            if (builtIns.length === 0 && custom.length === 0) return null;

            return (
              <div key={group.key}>
                <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${group.labelClass}`}>
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {builtIns.map((activity) => {
                    const currentXP = xpOverrides[activity.name] ?? activity.xp;
                    const isOverridden = currentXP !== activity.xp;
                    return (
                      <div
                        key={activity.name}
                        className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-2.5"
                      >
                        <span className="text-slate-300 text-sm flex-1 min-w-0 truncate">
                          {activity.name}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isOverridden && (
                            <button
                              onClick={() => onSetOverride(activity.name, activity.xp, activity.xp)}
                              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                              title={`Reset to default (${activity.xp} XP)`}
                            >
                              ↩ {activity.xp}
                            </button>
                          )}
                          <input
                            key={`${activity.name}-${currentXP}`}
                            type="number"
                            defaultValue={currentXP}
                            min={1}
                            max={500}
                            onBlur={(e) => {
                              const v = Math.max(1, parseInt(e.target.value) || 1);
                              onSetOverride(activity.name, v, activity.xp);
                            }}
                            className="w-14 bg-slate-700 border border-slate-600 focus:border-violet-500 rounded-lg px-2 py-1 text-yellow-400 font-bold text-xs text-center outline-none"
                          />
                          <span className="text-slate-500 text-xs">XP</span>
                        </div>
                      </div>
                    );
                  })}

                  {custom.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 bg-violet-600/10 border border-violet-500/20 rounded-xl px-4 py-2.5"
                    >
                      <span className="text-slate-200 text-sm flex-1 min-w-0 truncate">{a.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-yellow-400 font-bold text-xs">{a.xp} XP</span>
                        <button
                          onClick={() => onDelete(a.id)}
                          className="w-6 h-6 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center text-base leading-none"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add custom activity */}
        <div className="p-6 pt-4 border-t border-slate-800 space-y-3">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">
            Add a custom activity
          </p>
          <select
            value={newGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-2 text-slate-100 outline-none transition-colors text-sm"
          >
            {GROUPS.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Activity name..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition-colors"
          />
          <div className="flex items-center gap-3">
            <label className="text-slate-300 text-sm font-medium whitespace-nowrap">XP value</label>
            <input
              type="number"
              min={1}
              max={500}
              value={newXP}
              onChange={(e) => setNewXP(Math.max(1, Number(e.target.value)))}
              className="w-20 bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl px-3 py-2 text-yellow-400 font-bold text-sm outline-none transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="ml-auto px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
