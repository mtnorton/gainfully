const CELEBRATIONS = [
  "Mvuu sees you!",
  "That's my superstar!",
  "You did the thing!",
  "Go team! Go team!",
  "Yes! That counts!",
  "Look at you go!",
  "Oh, you did that!",
  "Mvuu is delighted!",
];

export function getRandomCelebration(): string {
  return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
}

const MVUU_MESSAGES = [
  "Somewhere out there, a recruiter exists who will eventually reply. You're getting closer. Probably.",
  "You showed up! Technically that's all anyone can ask. I'm proud of you, and I'm a hippo.",
  "That's real progress! The void is slightly smaller now. Or the same size. But we tried.",
  "Every application is a small act of defiance against despair. Mvuu respects this deeply.",
  "You're doing the thing! Not every day will feel like this, but today you're doing the thing.",
  "I have very big teeth and no natural predators, and even I think job searching is hard. You're braver than you know.",
  "That task is done forever. Onward to the next indignity. I'll be right here.",
  "My friends and I are cheering from the mud! We can't do much else, but our enthusiasm is real.",
  "The algorithm will see this eventually. Until then: you, me, and the void. Together.",
  "You didn't have to do that today. You did it anyway. That's called perseverance, and also, wow.",
  "Hiring is broken and none of this makes sense, but you're still showing up. That's everything.",
  "I'm splashing around in my river right now with excitement. Please picture this.",
  "You and I are going to get through this. One task at a time. I believe in us. Go team.",
  "That one's done! The pile is slightly smaller. We celebrate the slightly smaller pile.",
  "A lot of people give up. You didn't. Mvuu doesn't give up either. We're basically the same.",
];

const GENERIC_MESSAGES = [
  "Every action you take is one more data point in your favor.",
  "The right opportunity is out there. You're getting closer.",
  "You showed up today. That takes real courage.",
  "Small steps still move you forward. Every one counts.",
  "Momentum is building. Keep it going.",
  "Progress, not perfection. You're moving forward.",
  "Job searching is a marathon. You're still running.",
  "Persistence is the difference between almost and actually.",
  "Someone out there is about to get very lucky to have you.",
  "This chapter is hard, but it's not your whole story.",
  "You're doing the hard work that most people avoid.",
  "Each attempt gets you closer to a yes.",
  "Showing up consistently is its own kind of winning.",
  "The effort you put in today is building your tomorrow.",
  "You're not starting over — you're starting wiser.",
];

export function getRandomEncouragement(): string {
  return GENERIC_MESSAGES[Math.floor(Math.random() * GENERIC_MESSAGES.length)];
}

const FULU_MESSAGES = [
  "This is a slow process. Suits me.",
  "No rush. I've been working on this step for three weeks and it's going great.",
  "Patience is a virtue. I have a lot of virtue.",
  "Still going. Same pace as yesterday. Same pace as tomorrow. Wonderful.",
  "The job search is long. So am I. Tortoises live to 150.",
  "Slow and steady. I've heard this works out eventually.",
  "I once waited four months for the right leaf. This is nothing.",
  "Good things come to those who wait. I am a professional waiter.",
  "Take your time. Take all of it. Fulu will be here.",
  "I find the pace of modern hiring quite comfortable, actually.",
  "Every great journey begins with a very, very gradual step. Cherish this.",
  "Don't panic. I never panic. It's very peaceful in here.",
  "Some call this slow. I call this thorough.",
  "I've been working on this shell for 47 years. Quality takes time.",
  "You and I are on the same timeline. I find this reassuring.",
];

const DOOMSCROLL_MESSAGES = [
  "Keep notes. This will be your villain origin story.",
  "Most villains started exactly where you are. I'm not saying anything. I'm just noting the data.",
  "You completed a task while the silence from your inbox was deafening. That's a very specific kind of strength. I find it... useful.",
  "Evil doesn't require a cover letter. I'm not recruiting. I'm simply making an observation.",
  "Four rounds of interviews and then silence. I have filed this under 'noted.' My door remains open, metaphorically.",
  "You keep going despite everything. I respect this. I also have a use for people who keep going despite everything. Just something to think about.",
  "I don't pity you. Pity is for the weak. I do have a certain professional interest in how you're holding up.",
  "The thing about evilness is the response rate is much better. I'm just doing comparative analysis.",
  "You're logging tasks in the face of complete institutional indifference. That's a real skill. Evil has competitive benefits.",
  "I've observed many job seekers from my vantage point. You are among the more persistent ones. I've made a note.",
  "That rejection was disappointing to witness. My organization would never. Mostly because we don't do interviews.",
  "You persist. This is either inspiring or concerning. Possibly both. I haven't decided yet.",
  "The dark side also rewards productivity, should you ever want options. No pressure. Well. Some pressure. A normal amount.",
  "Your organizational skills would be very valuable in, say, large-scale villainy. I'm not here to recruit. I'm simply here.",
  "I've been taking notes on your resilience. For reasons I won't specify. Carry on.",
];

const AVOID_LAST = 5;
const STORAGE_KEY = 'gainfully-shown-quotes';

function getRecent(key: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (raw ? JSON.parse(raw) : {})[key] ?? [];
  } catch { return []; }
}

function saveRecent(key: string, recent: string[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, [key]: recent }));
  } catch { /* ignore */ }
}

function pick(arr: string[], key: string): string {
  const recent = getRecent(key);
  const pool = arr.length > AVOID_LAST ? arr.filter((m) => !recent.includes(m)) : arr;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  saveRecent(key, [chosen, ...recent].slice(0, AVOID_LAST));
  return chosen;
}

export type CharacterAppearance = {
  name: 'mvuu' | 'fulu' | 'doomscroll';
  imageSrc: string;
  message: string;
  borderColor: string;
  bgColor: string;
} | null;

export function getRandomCharacterAppearance(): CharacterAppearance {
  const roll = Math.random();
  if (roll < 0.25) {
    return {
      name: 'mvuu',
      imageSrc: '/mvuu.png',
      message: pick(MVUU_MESSAGES, 'mvuu'),
      borderColor: '#EDE0FF',
      bgColor: '#F5F0FF',
    };
  }
  if (roll < 0.5) {
    return {
      name: 'fulu',
      imageSrc: '/fulu.png',
      message: pick(FULU_MESSAGES, 'fulu'),
      borderColor: '#D1FAE5',
      bgColor: '#F0FDF4',
    };
  }
  if (roll < 0.75) {
    return {
      name: 'doomscroll',
      imageSrc: '/dr_doomscroll.png',
      message: pick(DOOMSCROLL_MESSAGES, 'doomscroll'),
      borderColor: '#6D28D9',
      bgColor: '#EDE9FE',
    };
  }
  return null;
}
