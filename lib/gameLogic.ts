import { Badge, Task, TaskCategory, ATS_CONFIG } from './types';
import { Outcome } from './outcomes';

// Cumulative XP needed to reach each level (index = level - 1)
// Gap between consecutive levels increases by 50 each time
export const LEVEL_THRESHOLDS: number[] = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  450,  // Level 4
  700,  // Level 5
  1000, // Level 6
  1350, // Level 7
  1750, // Level 8
  2200, // Level 9
  2700, // Level 10
];

export function getLevel(totalXP: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function getLevelProgress(totalXP: number): {
  level: number;
  current: number;
  needed: number;
  percentage: number;
} {
  const level = getLevel(totalXP);
  const levelStartXP = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const levelEndXP = LEVEL_THRESHOLDS[level] ?? levelStartXP + 600;
  const current = totalXP - levelStartXP;
  const needed = levelEndXP - levelStartXP;
  return { level, current, needed, percentage: Math.min(100, (current / needed) * 100) };
}

export const BADGE_DEFINITIONS: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  // ── Task volume ──────────────────────────────────────────────────
  { id: 'first_task',        name: 'Off the Starting Block', description: 'Complete your first task',    icon: '🚀' },
  { id: 'five_tasks',        name: 'Gathering Momentum',     description: 'Complete 5 tasks',            icon: '⚡' },
  { id: 'ten_tasks',         name: 'Building Steam',         description: 'Complete 10 tasks',           icon: '🚂' },
  { id: 'twenty_five_tasks', name: 'Overachiever',           description: 'Complete 25 tasks',           icon: '🏆' },
  { id: 'fifty_tasks',       name: 'Task Machine',           description: 'Complete 50 tasks',           icon: '🤖' },
  { id: 'hundred_tasks',     name: 'Centurion',              description: 'Complete 100 tasks',          icon: '💯' },

  // ── By category: applications ─────────────────────────────────────
  { id: 'five_applications',         name: 'Application Ace',     description: 'Submit 5 job applications',  icon: '📄' },
  { id: 'ten_applications',          name: 'Application Machine', description: 'Submit 10 job applications', icon: '📬' },
  { id: 'twenty_five_applications',  name: 'Numbers Game',        description: 'Submit 25 job applications', icon: '🎲' },

  // ── By category: networking ───────────────────────────────────────
  { id: 'five_networking', name: 'Network Weaver',  description: 'Complete 5 networking tasks',  icon: '🤝' },
  { id: 'ten_networking',  name: 'Super Connector', description: 'Complete 10 networking tasks', icon: '🌐' },

  // ── By category: interview prep ───────────────────────────────────
  { id: 'five_prep', name: 'Prep Master',  description: 'Complete 5 interview prep tasks',  icon: '📚' },
  { id: 'ten_prep',  name: 'Always Ready', description: 'Complete 10 interview prep tasks', icon: '🎓' },

  // ── By category: research ─────────────────────────────────────────
  { id: 'five_research', name: 'Due Diligence', description: 'Complete 5 research tasks', icon: '🔬' },

  // ── By category: self-care ────────────────────────────────────────
  { id: 'first_selfcare', name: 'Taking Care',         description: 'Complete your first self-care task', icon: '❤️' },
  { id: 'five_selfcare',  name: 'Self-Care Champion',  description: 'Complete 5 self-care tasks',         icon: '🧘' },

  // ── Variety ───────────────────────────────────────────────────────
  { id: 'all_categories', name: 'Well Rounded', description: 'Complete a task in all 5 main categories', icon: '🌈' },

  // ── XP milestones ─────────────────────────────────────────────────
  { id: 'xp_500',   name: 'XP Hunter',    description: 'Earn 500 total XP',    icon: '💎' },
  { id: 'xp_1000',  name: 'Century Club', description: 'Earn 1,000 total XP',  icon: '🌟' },
  { id: 'xp_2500',  name: 'Grinder',      description: 'Earn 2,500 total XP',  icon: '⛏️' },
  { id: 'xp_5000',  name: 'Legend',       description: 'Earn 5,000 total XP',  icon: '🌠' },
  { id: 'xp_10000', name: 'Hall of Fame', description: 'Earn 10,000 total XP', icon: '🏛️' },

  // ── Level milestones ──────────────────────────────────────────────
  { id: 'level_3',  name: 'Finding My Footing', description: 'Reach Level 3',  icon: '👣' },
  { id: 'level_5',  name: 'Level 5 Hero',        description: 'Reach Level 5',  icon: '🦸' },
  { id: 'level_7',  name: 'In the Zone',          description: 'Reach Level 7',  icon: '🔮' },
  { id: 'level_10', name: 'Elite Job Seeker',     description: 'Reach Level 10', icon: '👑' },

  // ── Outcome: interviews ───────────────────────────────────────────
  { id: 'first_interview',       name: 'In the Room',        description: 'Land your first interview',  icon: '🎤' },
  { id: 'three_interviews',      name: 'Interview Circuit',  description: 'Land 3 interviews',          icon: '🎭' },
  { id: 'ten_interviews',        name: 'Interview Veteran',  description: 'Land 10 interviews',         icon: '🎙️' },
  { id: 'first_second_interview',name: 'Called Back',        description: 'Land a second interview',    icon: '🔄' },

  // ── Outcome: other positives ──────────────────────────────────────
  { id: 'first_referral', name: 'Word of Mouth',       description: 'Receive your first referral', icon: '💬' },
  { id: 'offer_received', name: 'Mission Accomplished', description: 'Receive a job offer',         icon: '🏁' },

  // ── Outcome: resilience ───────────────────────────────────────────
  { id: 'resilient',       name: 'Resilient',      description: 'Log your first rejection or ghosting', icon: '🛡️' },
  { id: 'battle_hardened', name: 'Battle Hardened', description: 'Log 5 rejections or ghostings',       icon: '⚔️' },
  { id: 'ten_resilience',  name: 'Titanium',        description: 'Log 10 rejections or ghostings',      icon: '🪙' },

  // ── Streaks ───────────────────────────────────────────────────────
  { id: 'streak_3',  name: 'On a Roll',        description: 'Maintain a 3-day streak',  icon: '🔥' },
  { id: 'streak_7',  name: 'Week Warrior',     description: 'Maintain a 7-day streak',  icon: '💪' },
  { id: 'streak_14', name: 'Fortnight Fighter', description: 'Maintain a 14-day streak', icon: '🗓️' },
  { id: 'streak_30', name: 'Unstoppable',       description: 'Maintain a 30-day streak', icon: '🌊' },

  // ── Painful portals ───────────────────────────────────────────────
  { id: 'workday_warrior', name: 'Workday Warrior',  description: 'Survive your first Workday application',    icon: '😤' },
  { id: 'portal_survivor', name: 'Portal Survivor',  description: 'Complete 5 applications via a painful ATS', icon: '🏅' },

  // ── Special ───────────────────────────────────────────────────────
  { id: 'power_day', name: 'Power Day', description: 'Complete 5 tasks in a single day', icon: '🌪️' },
];

export function getInitialBadges(): Badge[] {
  return BADGE_DEFINITIONS.map((b) => ({ ...b, earned: false }));
}

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function calculateStreak(tasks: Task[]): number {
  const completedDates = new Set<string>();
  for (const task of tasks) {
    if (task.completed && task.completedAt) {
      completedDates.add(localDateStr(new Date(task.completedAt)));
    }
  }
  if (completedDates.size === 0) return 0;

  const now = new Date();
  const today = localDateStr(now);
  const yesterday = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  // Streak is alive if something was done today OR yesterday (grace period for end-of-day)
  const startStr = completedDates.has(today) ? today : completedDates.has(yesterday) ? yesterday : null;
  if (!startStr) return 0;

  let streak = 0;
  const cursor = new Date(startStr + 'T12:00:00');
  while (completedDates.has(localDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function checkForStreakBadges(
  streak: number,
  allCompletedTasks: Task[],
  currentBadges: Badge[]
): Badge[] {
  const shouldEarn = new Set<string>();
  if (streak >= 3)  shouldEarn.add('streak_3');
  if (streak >= 7)  shouldEarn.add('streak_7');
  if (streak >= 14) shouldEarn.add('streak_14');
  if (streak >= 30) shouldEarn.add('streak_30');
  if (allCompletedTasks.some((t) => t.category === 'selfcare')) shouldEarn.add('first_selfcare');

  const alreadyEarned = new Set(currentBadges.filter((b) => b.earned).map((b) => b.id));
  return currentBadges
    .filter((b) => shouldEarn.has(b.id) && !alreadyEarned.has(b.id))
    .map((b) => ({ ...b, earned: true, earnedAt: new Date().toISOString() }));
}

export function checkForNewBadgesOnOutcome(
  allOutcomes: Outcome[],
  newOutcome: Outcome,
  currentBadges: Badge[],
  newTotalXP: number
): Badge[] {
  const all = [...allOutcomes, newOutcome];
  const interviewCount   = all.filter((o) => o.type === 'interview' || o.type === 'second_interview').length;
  const secondCount      = all.filter((o) => o.type === 'second_interview').length;
  const resilienceCount  = all.filter((o) => o.type === 'rejection' || o.type === 'ghosted').length;
  const referralCount    = all.filter((o) => o.type === 'referral').length;
  const hasOffer         = all.some((o) => o.type === 'offer');
  const newLevel         = getLevel(newTotalXP);

  const shouldEarn = new Set<string>();
  if (interviewCount >= 1)  shouldEarn.add('first_interview');
  if (interviewCount >= 3)  shouldEarn.add('three_interviews');
  if (interviewCount >= 10) shouldEarn.add('ten_interviews');
  if (secondCount >= 1)     shouldEarn.add('first_second_interview');
  if (referralCount >= 1)   shouldEarn.add('first_referral');
  if (resilienceCount >= 1)  shouldEarn.add('resilient');
  if (resilienceCount >= 5)  shouldEarn.add('battle_hardened');
  if (resilienceCount >= 10) shouldEarn.add('ten_resilience');
  if (hasOffer) shouldEarn.add('offer_received');
  if (newTotalXP >= 500)   shouldEarn.add('xp_500');
  if (newTotalXP >= 1000)  shouldEarn.add('xp_1000');
  if (newTotalXP >= 2500)  shouldEarn.add('xp_2500');
  if (newTotalXP >= 5000)  shouldEarn.add('xp_5000');
  if (newTotalXP >= 10000) shouldEarn.add('xp_10000');
  if (newLevel >= 3)  shouldEarn.add('level_3');
  if (newLevel >= 5)  shouldEarn.add('level_5');
  if (newLevel >= 7)  shouldEarn.add('level_7');
  if (newLevel >= 10) shouldEarn.add('level_10');

  const alreadyEarned = new Set(currentBadges.filter((b) => b.earned).map((b) => b.id));
  return currentBadges
    .filter((b) => shouldEarn.has(b.id) && !alreadyEarned.has(b.id))
    .map((b) => ({ ...b, earned: true, earnedAt: new Date().toISOString() }));
}

const MAIN_CATEGORIES: TaskCategory[] = ['application', 'networking', 'preparation', 'research', 'selfcare'];

export function checkForNewBadges(
  previouslyCompletedTasks: Task[],
  taskBeingCompleted: Task,
  currentBadges: Badge[],
  newTotalXP: number
): Badge[] {
  const allCompleted    = [...previouslyCompletedTasks, taskBeingCompleted];
  const totalCount      = allCompleted.length;
  const applicationCount = allCompleted.filter((t) => t.category === 'application').length;
  const networkingCount  = allCompleted.filter((t) => t.category === 'networking').length;
  const prepCount        = allCompleted.filter((t) => t.category === 'preparation').length;
  const researchCount    = allCompleted.filter((t) => t.category === 'research').length;
  const selfcareCount    = allCompleted.filter((t) => t.category === 'selfcare').length;
  const newLevel         = getLevel(newTotalXP);

  const categoriesUsed = new Set(allCompleted.map((t) => t.category));
  const hasAllCategories = MAIN_CATEGORIES.every((c) => categoriesUsed.has(c));

  const today = localDateStr(new Date());
  const completedTodayCount = previouslyCompletedTasks.filter(
    (t) => t.completedAt && t.completedAt.startsWith(today)
  ).length + 1; // +1 for taskBeingCompleted

  const shouldEarn = new Set<string>();

  // Task volume
  if (totalCount >= 1)   shouldEarn.add('first_task');
  if (totalCount >= 5)   shouldEarn.add('five_tasks');
  if (totalCount >= 10)  shouldEarn.add('ten_tasks');
  if (totalCount >= 25)  shouldEarn.add('twenty_five_tasks');
  if (totalCount >= 50)  shouldEarn.add('fifty_tasks');
  if (totalCount >= 100) shouldEarn.add('hundred_tasks');

  // Applications
  if (applicationCount >= 5)  shouldEarn.add('five_applications');
  if (applicationCount >= 10) shouldEarn.add('ten_applications');
  if (applicationCount >= 25) shouldEarn.add('twenty_five_applications');

  // Networking
  if (networkingCount >= 5)  shouldEarn.add('five_networking');
  if (networkingCount >= 10) shouldEarn.add('ten_networking');

  // Prep
  if (prepCount >= 5)  shouldEarn.add('five_prep');
  if (prepCount >= 10) shouldEarn.add('ten_prep');

  // Research
  if (researchCount >= 5) shouldEarn.add('five_research');

  // Self-care
  if (selfcareCount >= 5) shouldEarn.add('five_selfcare');

  // Variety
  if (hasAllCategories) shouldEarn.add('all_categories');

  // XP
  if (newTotalXP >= 500)   shouldEarn.add('xp_500');
  if (newTotalXP >= 1000)  shouldEarn.add('xp_1000');
  if (newTotalXP >= 2500)  shouldEarn.add('xp_2500');
  if (newTotalXP >= 5000)  shouldEarn.add('xp_5000');
  if (newTotalXP >= 10000) shouldEarn.add('xp_10000');

  // Levels
  if (newLevel >= 3)  shouldEarn.add('level_3');
  if (newLevel >= 5)  shouldEarn.add('level_5');
  if (newLevel >= 7)  shouldEarn.add('level_7');
  if (newLevel >= 10) shouldEarn.add('level_10');

  // Painful portals
  if (allCompleted.some((t) => t.ats === 'workday')) shouldEarn.add('workday_warrior');
  const painfulAtsCount = allCompleted.filter((t) => t.ats && ATS_CONFIG[t.ats]).length;
  if (painfulAtsCount >= 5) shouldEarn.add('portal_survivor');

  // Special
  if (completedTodayCount >= 5) shouldEarn.add('power_day');

  const alreadyEarned = new Set(currentBadges.filter((b) => b.earned).map((b) => b.id));

  return currentBadges
    .filter((b) => shouldEarn.has(b.id) && !alreadyEarned.has(b.id))
    .map((b) => ({ ...b, earned: true, earnedAt: new Date().toISOString() }));
}
