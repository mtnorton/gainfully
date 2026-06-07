const MESSAGES = [
  "Every action you take is an investment in your future.",
  "The right opportunity is out there — you're getting closer.",
  "You showed up today. That takes real courage.",
  "Your dream job doesn't know what's coming for it!",
  "Each 'no' is just redirecting you toward your 'yes'.",
  "Momentum is building. Keep it going!",
  "You're doing the hard work that most people avoid. That sets you apart.",
  "Progress, not perfection. You're moving forward!",
  "Job searching is a marathon, and you're still running. Amazing.",
  "The effort you're putting in today is building your tomorrow.",
  "You're not just job searching — you're growing into who you're becoming.",
  "Small steps still move you forward. Every one counts.",
  "Persistence is the difference between almost and actually.",
  "Someone out there is about to get very lucky to have you.",
  "You're braver than you believe and more capable than you know.",
  "This chapter is hard, but it's not your whole story.",
  "You're investing in yourself. That always pays off.",
  "Keep going. The view from the other side will be incredible.",
  "Every expert was once uncertain. You're building your expertise right now.",
  "You're not starting over — you're starting wiser.",
];

export function getRandomEncouragement(): string {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}
