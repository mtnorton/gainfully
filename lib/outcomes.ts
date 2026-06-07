import { Badge } from './types';

export type OutcomeType =
  | 'interview'
  | 'second_interview'
  | 'offer'
  | 'response'
  | 'referral'
  | 'rejection'
  | 'ghosted'
  | 'position_closed'
  | 'other'
  | 'standard_nonsense'
  | 'ridiculous_nonsense'
  | 'outrageous_nonsense';

export type OutcomeSentiment = 'positive' | 'resilience' | 'neutral';

export interface OutcomeConfig {
  label: string;
  shortLabel: string;
  icon: string;
  xp: number;
  xpLabel: string;
  sentiment: OutcomeSentiment;
  colorClasses: string;
}

export interface Outcome {
  id: string;
  taskId: string;
  type: OutcomeType;
  date: string;
  notes?: string;
  xpAwarded: number;
  createdAt: string;
}

export interface OutcomeResult {
  type: OutcomeType;
  xpAwarded: number;
  message: string;
  newBadges: Badge[];
  leveledUp: boolean;
  newLevel: number;
}

export const OUTCOME_CONFIG: Record<OutcomeType, OutcomeConfig> = {
  interview: {
    label: 'Interview Scheduled',
    shortLabel: 'Interview',
    icon: '📅',
    xp: 30,
    xpLabel: '+30 XP',
    sentiment: 'positive',
    colorClasses: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  second_interview: {
    label: 'Second Interview',
    shortLabel: '2nd Interview',
    icon: '🔄',
    xp: 50,
    xpLabel: '+50 XP',
    sentiment: 'positive',
    colorClasses: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  offer: {
    label: 'Offer Received',
    shortLabel: 'Offer!',
    icon: '🎉',
    xp: 100,
    xpLabel: '+100 XP',
    sentiment: 'positive',
    colorClasses: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  response: {
    label: 'Got a Response',
    shortLabel: 'Response',
    icon: '💬',
    xp: 10,
    xpLabel: '+10 XP',
    sentiment: 'positive',
    colorClasses: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  referral: {
    label: 'Got a Referral',
    shortLabel: 'Referral',
    icon: '🤝',
    xp: 20,
    xpLabel: '+20 XP',
    sentiment: 'positive',
    colorClasses: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  rejection: {
    label: 'Rejection',
    shortLabel: 'Rejection',
    icon: '💪',
    xp: 5,
    xpLabel: '+5 Resilience XP',
    sentiment: 'resilience',
    colorClasses: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
  },
  ghosted: {
    label: 'Ghosted / No Response',
    shortLabel: 'Ghosted',
    icon: '👻',
    xp: 5,
    xpLabel: '+5 Resilience XP',
    sentiment: 'resilience',
    colorClasses: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
  },
  position_closed: {
    label: 'Position Closed',
    shortLabel: 'Closed',
    icon: '🚪',
    xp: 0,
    xpLabel: '',
    sentiment: 'neutral',
    colorClasses: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
  },
  other: {
    label: 'Other Update',
    shortLabel: 'Update',
    icon: '📝',
    xp: 5,
    xpLabel: '+5 XP',
    sentiment: 'neutral',
    colorClasses: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
  },
  standard_nonsense: {
    label: 'Standard Nonsense',
    shortLabel: 'Nonsense',
    icon: '🙄',
    xp: 25,
    xpLabel: '+25 Nonsense XP',
    sentiment: 'resilience',
    colorClasses: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  },
  ridiculous_nonsense: {
    label: 'Ridiculous Nonsense',
    shortLabel: 'Ridiculous',
    icon: '🤦',
    xp: 100,
    xpLabel: '+100 Nonsense XP',
    sentiment: 'resilience',
    colorClasses: 'bg-orange-600/20 text-orange-200 border-orange-600/30',
  },
  outrageous_nonsense: {
    label: 'Outrageous Nonsense',
    shortLabel: 'Outrageous',
    icon: '🤯',
    xp: 1000,
    xpLabel: '+1000 Nonsense XP',
    sentiment: 'resilience',
    colorClasses: 'bg-red-600/20 text-red-200 border-red-600/30',
  },
};

const OUTCOME_MESSAGES: Record<OutcomeType, string[]> = {
  interview: [
    "An interview! All that effort is paying off. Go show them what you've got!",
    "This is what you've been working toward. You earned this shot.",
    "They saw something in you. Now let them see even more.",
    "An interview means you cleared a real bar. That's not luck — that's you.",
  ],
  second_interview: [
    "Second interview — they're seriously interested. Keep that momentum going!",
    "You made a strong enough impression to be invited back. That's no small thing.",
    "You're through to the next round. Go show them the full picture.",
  ],
  offer: [
    "You did it! An offer is proof that your persistence absolutely paid off.",
    "OFFER RECEIVED. All those tasks, all that XP — it led right here.",
    "This is the moment. You earned every bit of it.",
    "An offer! Take a moment to feel how far you've come.",
  ],
  response: [
    "A response! Your outreach is working — doors are opening.",
    "They wrote back. That connection is real now. Keep nurturing it.",
    "Progress! Every response is the start of something.",
  ],
  referral: [
    "Someone believed in you enough to put their name behind yours. That's huge.",
    "A referral is one of the most valuable things in a job search. You've earned someone's trust.",
    "Your network is working for you. Honor that relationship.",
  ],
  rejection: [
    "Being rejected stings — and it's okay to feel that. Then remember: every no redirects you toward your yes.",
    "This one wasn't the right fit, for either of you. Something better is out there.",
    "Every person you admire has been rejected. A lot. You're in good company.",
    "Logging a rejection takes honesty and guts. That's resilience in action.",
    "That door closed. You're still standing. Keep walking.",
    "Rejection isn't failure — it's part of the search. You're still in it.",
  ],
  ghosted: [
    "Being ghosted is genuinely frustrating, and their silence says nothing about your worth.",
    "Ghosted. It happens to everyone, and it never gets less annoying. You're handling it.",
    "Their silence isn't a verdict on you — it's them being unprofessional. Move forward.",
    "Being ignored stings. Acknowledging it here is healthy. On to better opportunities.",
  ],
  position_closed: [
    "Positions close, budgets shift, plans change — none of that is about you.",
    "Sometimes the timing just isn't right. Your opportunity is still out there.",
    "This one wasn't meant to be, but it prepared you for the one that is.",
  ],
  other: [
    "Every update moves you forward. Keep logging, keep going.",
    "You're staying on top of things. That's exactly what this process requires.",
    "Tracking every development keeps you in the driver's seat.",
  ],
  standard_nonsense: [
    "Annoying? Absolutely. Surprising in this market? Unfortunately not. Log it and let it go.",
    "Par for the course in a broken process. Document it and keep moving.",
    "This is them, not you. On to somewhere that has its act together.",
    "The process is often chaos wrapped in a calendar invite. You handled it.",
  ],
  ridiculous_nonsense: [
    "That's genuinely unreasonable, and you're right to be frustrated.",
    "Some hiring processes have no business calling themselves professional. You handled it better than they deserved.",
    "Absurd. Your patience and persistence through that are real, underrated skills.",
    "You cleared every bar they set. The problem was clearly the bar-setter.",
  ],
  outrageous_nonsense: [
    "This is genuinely unacceptable behavior. You deserved better at every single step.",
    "Outrageous is an understatement. Take a breath — this reflects entirely on them, not you.",
    "The audacity is breathtaking. That you stayed composed through it is a testament to your professionalism.",
    "Some companies reveal exactly who they are in how they treat candidates. You just got important information.",
  ],
};

export function getOutcomeMessage(type: OutcomeType): string {
  const messages = OUTCOME_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}
