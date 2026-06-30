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
  labelColor: string;
  defaultCategory: TaskCategory;
  categories: TaskCategory[];
}[] = [
  { key: 'advance', label: 'Advance', labelColor: '#2563EB', defaultCategory: 'application', categories: ['application', 'networking'] },
  { key: 'build',   label: 'Build',   labelColor: '#16A34A', defaultCategory: 'preparation', categories: ['preparation', 'research'] },
  { key: 'sustain', label: 'Sustain', labelColor: '#7C5CFC', defaultCategory: 'selfcare',    categories: ['selfcare'] },
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

  const inputStyle = { border: '2px solid #F1E2CF' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-lg bg-white rounded-[22px] shadow-2xl max-h-[90vh] flex flex-col"
        style={{ border: '2px solid #F1E2CF' }}
      >

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0" style={{ borderBottom: '2px solid #F1E2CF' }}>
          <div>
            <h2 className="font-fredoka font-bold text-[20px] text-[#2C2724]">Manage Activities</h2>
            <p className="text-[#97887A] text-xs mt-0.5">Edit XP for any activity, or add your own.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xl leading-none text-[#97887A] hover:text-[#2C2724] transition-colors flex-shrink-0"
            style={{ background: '#F2E8DB' }}
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
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: group.labelColor }}>
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {builtIns.map((activity) => {
                    const currentXP = xpOverrides[activity.name] ?? activity.xp;
                    const isOverridden = currentXP !== activity.xp;
                    return (
                      <div
                        key={activity.name}
                        className="flex items-center gap-3 bg-[#FBF3E8] rounded-xl px-4 py-2.5"
                        style={{ border: '2px solid #F1E2CF' }}
                      >
                        <span className="text-[#2C2724] text-sm flex-1 min-w-0 truncate font-semibold">
                          {activity.name}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isOverridden && (
                            <button
                              onClick={() => onSetOverride(activity.name, activity.xp, activity.xp)}
                              className="text-xs text-[#97887A] hover:text-[#2C2724] transition-colors"
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
                            className="w-14 bg-white rounded-lg px-2 py-1 text-[#F5A300] font-bold text-xs text-center outline-none"
                            style={{ border: '2px solid #EFE0CC' }}
                          />
                          <span className="text-[#A99C8D] text-xs font-bold">XP</span>
                        </div>
                      </div>
                    );
                  })}

                  {custom.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                      style={{ background: '#EEE7FF', border: '2px solid #D4C7FF' }}
                    >
                      <span className="text-[#5B3FD6] font-semibold text-sm flex-1 min-w-0 truncate">{a.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[#F5A300] font-bold text-xs">{a.xp} XP</span>
                        <button
                          onClick={() => onDelete(a.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-base leading-none transition-colors text-[#97887A] hover:text-red-500"
                          style={{ background: '#F2E8DB' }}
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
        <div className="p-6 pt-4 flex-shrink-0 space-y-3" style={{ borderTop: '2px solid #F1E2CF' }}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#A99C8D]">
            Add a custom activity
          </p>
          <select
            value={newGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full bg-white rounded-xl px-3 py-2 text-[#2C2724] outline-none transition-colors text-sm font-semibold"
            style={inputStyle}
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
            className="w-full bg-white rounded-xl px-4 py-2.5 text-[#2C2724] placeholder-[#C4B5A5] outline-none transition-colors text-sm"
            style={inputStyle}
          />
          <div className="flex items-center gap-3">
            <label className="text-[#6f6155] text-sm font-bold whitespace-nowrap">XP value</label>
            <input
              type="number"
              min={1}
              max={500}
              value={newXP}
              onChange={(e) => setNewXP(Math.max(1, Number(e.target.value)))}
              className="w-20 bg-white rounded-xl px-3 py-2 text-[#F5A300] font-bold text-sm outline-none transition-colors"
              style={inputStyle}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="ml-auto px-5 py-2 rounded-xl text-white font-fredoka font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ background: '#7C5CFC', boxShadow: '0 3px 0 #5B3FD6' }}
            >
              Add
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-[#97887A] hover:text-[#2C2724] transition-colors font-semibold text-sm"
            style={{ background: '#F2E8DB', border: '2px solid #EFE0CC' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
