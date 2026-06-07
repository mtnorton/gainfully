export type TaskCategory = 'application' | 'networking' | 'preparation' | 'research' | 'selfcare' | 'custom';

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; icon: string; defaultXP: number; colorClasses: string }
> = {
  application: {
    label: 'Job Application',
    icon: '📄',
    defaultXP: 50,
    colorClasses: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  networking: {
    label: 'Networking',
    icon: '🤝',
    defaultXP: 20,
    colorClasses: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  preparation: {
    label: 'Interview Prep',
    icon: '📚',
    defaultXP: 25,
    colorClasses: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  research: {
    label: 'Research',
    icon: '🔍',
    defaultXP: 15,
    colorClasses: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  selfcare: {
    label: 'Self-Care',
    icon: '❤️',
    defaultXP: 5,
    colorClasses: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  custom: {
    label: 'Custom Task',
    icon: '⭐',
    defaultXP: 10,
    colorClasses: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
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

export interface CompletionEvent {
  taskName: string;
  xpEarned: number;
  newBadges: Badge[];
  leveledUp: boolean;
  newLevel: number;
  message: string;
}
