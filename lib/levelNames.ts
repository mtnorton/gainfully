// Level titles — edit freely. Level 1 = index 0, Level 2 = index 1, etc.
// Levels beyond the list get the last entry.
export const LEVEL_NAMES: string[] = [
  'Resume Peasant',           // 1
  'LinkedIn Lurker',          // 2
  'Cover Letter Padawan',     // 3
  'Indeed Pilgrim',           // 4
  'Tab Hoarder',              // 5
  'Cold Email Crusader',      // 6
  'Ghost Whisperer',          // 7
  'Rejection Collector',      // 8
  'Application Black Hole',   // 9
  'Networking Novice',        // 10
  'Coffee Chat Initiate',     // 11
  'Follow-Up Enthusiast',     // 12
  'ATS Whisperer',            // 13
  'Phone Screen Veteran',     // 14
  'Recruiter Charmer',        // 15
  'Pipeline Manager',         // 16
  'Interview Contender',      // 17
  'Panel Survivor',           // 18
  'Final Round Regular',         // 19
  'Culture Fit Confirmed',    // 20
  'Hiring Manager\'s Favorite', // 21
  'Top of the Pile',          // 22
  'Runner-Up Royalty',  // 23
  'Rejection Sommelier', // 24
  'Certified Overqualified',     // 25
  'Interview Loop Black Belt', // 26
  'Disappointment Steward', // 27
  'Feedback Withheld Sensei', // 28
  'Legendary Persistence',    // 29
  'Job Search Grandmaster',     // 30
];

export function getLevelName(level: number): string {
  const idx = Math.max(0, level - 1);
  return LEVEL_NAMES[Math.min(idx, LEVEL_NAMES.length - 1)];
}
