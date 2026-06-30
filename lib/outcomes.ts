import { Badge } from './types';

export type OutcomeType =
  | 'interview'
  | 'technical_screening'
  | 'technical_interview'
  | 'second_interview'
  | 'offer'
  | 'response'
  | 'referral'
  | 'coffee_chat'
  | 'informational_interview'
  | 'intro_made'
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
    colorClasses: 'bg-[#DCFAE7] text-[#16A34A] border-[#B0EFC8]',
  },
  technical_screening: {
    label: 'Technical Screening',
    shortLabel: 'Tech Screen',
    icon: '💻',
    xp: 35,
    xpLabel: '+35 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#DCFAE7] text-[#16A34A] border-[#B0EFC8]',
  },
  technical_interview: {
    label: 'Technical Interview',
    shortLabel: 'Tech Interview',
    icon: '🧑‍💻',
    xp: 45,
    xpLabel: '+45 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#DCFAE7] text-[#16A34A] border-[#B0EFC8]',
  },
  second_interview: {
    label: 'Second Interview',
    shortLabel: '2nd Interview',
    icon: '🔄',
    xp: 50,
    xpLabel: '+50 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#DCFAE7] text-[#16A34A] border-[#B0EFC8]',
  },
  offer: {
    label: 'Offer Received',
    shortLabel: 'Offer!',
    icon: '🎉',
    xp: 100,
    xpLabel: '+100 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]',
  },
  response: {
    label: 'Got a Response',
    shortLabel: 'Response',
    icon: '💬',
    xp: 10,
    xpLabel: '+10 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#E4EDFF] text-[#2563EB] border-[#C5D9FF]',
  },
  referral: {
    label: 'Got a Referral',
    shortLabel: 'Referral',
    icon: '🤝',
    xp: 20,
    xpLabel: '+20 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#CFF5EF] text-[#0D9488] border-[#9FE8E0]',
  },
  coffee_chat: {
    label: 'Coffee Chat Scheduled',
    shortLabel: 'Coffee Chat',
    icon: '☕',
    xp: 20,
    xpLabel: '+20 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#CFF5EF] text-[#0D9488] border-[#9FE8E0]',
  },
  informational_interview: {
    label: 'Informational Interview',
    shortLabel: 'Info Interview',
    icon: '🗣️',
    xp: 25,
    xpLabel: '+25 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#CFF5EF] text-[#0D9488] border-[#9FE8E0]',
  },
  intro_made: {
    label: 'Introduction Made',
    shortLabel: 'Intro Made',
    icon: '👋',
    xp: 15,
    xpLabel: '+15 XP',
    sentiment: 'positive',
    colorClasses: 'bg-[#E4EDFF] text-[#2563EB] border-[#C5D9FF]',
  },
  rejection: {
    label: 'Rejection',
    shortLabel: 'Rejection',
    icon: '💪',
    xp: 5,
    xpLabel: '+5 Resilience XP',
    sentiment: 'resilience',
    colorClasses: 'bg-[#F2E8DB] text-[#97887A] border-[#EFE0CC]',
  },
  ghosted: {
    label: 'Ghosted / No Response',
    shortLabel: 'Ghosted',
    icon: '👻',
    xp: 5,
    xpLabel: '+5 Resilience XP',
    sentiment: 'resilience',
    colorClasses: 'bg-[#F2E8DB] text-[#97887A] border-[#EFE0CC]',
  },
  position_closed: {
    label: 'Position Closed',
    shortLabel: 'Closed',
    icon: '🚪',
    xp: 0,
    xpLabel: '',
    sentiment: 'neutral',
    colorClasses: 'bg-[#F2E8DB] text-[#97887A] border-[#EFE0CC]',
  },
  other: {
    label: 'Other Update',
    shortLabel: 'Update',
    icon: '📝',
    xp: 5,
    xpLabel: '+5 XP',
    sentiment: 'neutral',
    colorClasses: 'bg-[#F2E8DB] text-[#97887A] border-[#EFE0CC]',
  },
  standard_nonsense: {
    label: 'Standard Nonsense',
    shortLabel: 'Nonsense',
    icon: '🙄',
    xp: 25,
    xpLabel: '+25 Nonsense XP',
    sentiment: 'resilience',
    colorClasses: 'bg-[#FFE6D3] text-[#EA580C] border-[#F9C9A3]',
  },
  ridiculous_nonsense: {
    label: 'Ridiculous Nonsense',
    shortLabel: 'Ridiculous',
    icon: '🤦',
    xp: 100,
    xpLabel: '+100 Nonsense XP',
    sentiment: 'resilience',
    colorClasses: 'bg-[#FFD0C5] text-[#C2410C] border-[#FFA591]',
  },
  outrageous_nonsense: {
    label: 'Outrageous Nonsense',
    shortLabel: 'Outrageous',
    icon: '🤯',
    xp: 1000,
    xpLabel: '+1000 Nonsense XP',
    sentiment: 'resilience',
    colorClasses: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
  },
};

const OUTCOME_MESSAGES: Record<OutcomeType, string[]> = {
  interview: [
    "An interview! All that effort is paying off. Go show them what you've got!",
    "This is what you've been working toward. You earned this shot.",
    "They saw something in you. Now let them see even more.",
    "An interview means you cleared a real bar. That's not luck — that's you.",
  ],
  technical_screening: [
    "A tech screen means they liked what they saw. Now show them what you can do.",
    "You cleared the first technical bar. That's real signal — keep going.",
    "Technical screenings separate the prepared from the hopeful. You're prepared.",
    "They want to see your skills. You've been building toward exactly this.",
  ],
  technical_interview: [
    "A full technical interview — they're seriously evaluating you. Trust your prep.",
    "You earned a technical interview. That's a real vote of confidence in your abilities.",
    "Deep into the process now. Every technical round you reach is proof you belong.",
    "This is where preparation meets opportunity. You've done the work — show it.",
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
  coffee_chat: [
    "A coffee chat is how careers actually get built. Go make it count.",
    "You put yourself out there and it worked. Now show up fully.",
    "Face time with someone in your field. This is how doors open.",
    "More valuable than it sounds. One real conversation can change everything.",
  ],
  informational_interview: [
    "They're investing their time in you. Show up prepared and curious.",
    "You asked, they said yes. That takes courage and now it's paying off.",
    "This is how careers get built — one real conversation at a time.",
    "A door is open. Walk through it with genuine curiosity.",
  ],
  intro_made: [
    "An introduction is a multiplier. Your network just got bigger.",
    "Someone connected you to someone. That's trust being passed along — honor it.",
    "A warm intro is worth ten cold messages. Follow up and make it real.",
    "New contact, new possibility. The next step is yours to take.",
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
