export type TaskCategory = 'application' | 'networking' | 'preparation' | 'research' | 'skills' | 'selfcare' | 'hustle' | 'custom';

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; icon: string; defaultXP: number; colorClasses: string }
> = {
  application: {
    label: 'Application',
    icon: '📋',
    defaultXP: 50,
    colorClasses: 'bg-[#E4EDFF] text-[#2563EB] border-[#C5D9FF]',
  },
  networking: {
    label: 'Networking',
    icon: '🤝',
    defaultXP: 20,
    colorClasses: 'bg-[#FBEFC9] text-[#B45309] border-[#F3D88E]',
  },
  preparation: {
    label: 'Preparation',
    icon: '🎯',
    defaultXP: 25,
    colorClasses: 'bg-[#FFE6D3] text-[#EA580C] border-[#F9C9A3]',
  },
  research: {
    label: 'Research',
    icon: '🔍',
    defaultXP: 15,
    colorClasses: 'bg-[#CFF5EF] text-[#0D9488] border-[#9FE8E0]',
  },
  skills: {
    label: 'Skills',
    icon: '💡',
    defaultXP: 20,
    colorClasses: 'bg-[#DCFAE7] text-[#16A34A] border-[#B0EFC8]',
  },
  selfcare: {
    label: 'Self-Care',
    icon: '🌿',
    defaultXP: 5,
    colorClasses: 'bg-[#EEE7FF] text-[#7C5CFC] border-[#D4C7FF]',
  },
  hustle: {
    label: 'Hustle',
    icon: '💰',
    defaultXP: 25,
    colorClasses: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]',
  },
  custom: {
    label: 'Custom Task',
    icon: '⭐',
    defaultXP: 10,
    colorClasses: 'bg-[#F3ECFF] text-[#7C5CFC] border-[#E2D4FF]',
  },
};

export const ATS_CONFIG: Record<string, { label: string; bonusXP: number; quip: string; icon: string }> = {
  workday: {
    label: 'Workday',
    bonusXP: 25,
    quip: 'Resume parsing? More like resume guessing.',
    icon: '😤',
  },
  taleo: {
    label: 'Taleo',
    bonusXP: 20,
    quip: 'Still running on Internet Explorer energy.',
    icon: '🥴',
  },
  successfactors: {
    label: 'SAP SuccessFactors',
    bonusXP: 15,
    quip: '"Success" is a strong word for this.',
    icon: '😵',
  },
  icims: {
    label: 'iCIMS',
    bonusXP: 10,
    quip: 'Could be worse. Could be Taleo.',
    icon: '😬',
  },
  other: {
    label: 'Other Portal',
    bonusXP: 10,
    quip: 'Made you re-enter everything anyway.',
    icon: '🙄',
  },
};

export interface Task {
  id: string;
  name: string;
  category: TaskCategory;
  xp: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  // Identifying details
  company?: string;      // Company name or person's name (for networking)
  jobTitle?: string;     // Applications only
  activityDate?: string; // YYYY-MM-DD — when the task was done
  ats?: string;          // ATS system key from ATS_CONFIG, applications only
}

export interface CustomActivity {
  id: string;
  name: string;
  category: TaskCategory;
  xp: number;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface VictoryStats {
  company?: string;
  xpEarned: number;
  totalXP: number;
  weeksSearching: number;
  activitiesCompleted: number;
  outcomesLogged: number;
  interviewsLanded: number;
  badgesEarned: number;
  newBadges: Badge[];
}

export interface CompletionEvent {
  taskName: string;
  xpEarned: number;
  newBadges: Badge[];
  leveledUp: boolean;
  newLevel: number;
  streak: number;
  message: string;
  celebration: string;
}
