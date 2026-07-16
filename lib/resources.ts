export interface Resource {
  name: string;
  url: string;
  description: string;
  category: string;
}

export const RESOURCE_CATEGORIES = [
  'Job Boards',
  'Resume & Applications',
  'Interview Prep',
  'Salary & Negotiation',
  'Networking',
];

export const RESOURCES: Resource[] = [
  // ── Job Boards ────────────────────────────────────────────────────────────
  {
    name: 'LinkedIn Jobs',
    url: 'https://www.linkedin.com/jobs',
    description: 'Still a good place to start, but consider applying on company websites instead.',
    category: 'Job Boards',
  },
  {
    name: 'Wellfound',
    url: 'https://wellfound.com',
    description: 'Formerly AngelList Talent. Best for startup roles — many let you apply without a cover letter.',
    category: 'Job Boards',
  },
  {
    name: 'Built In',
    url: 'https://builtin.com',
    description: 'Focused on tech and startup jobs. Good city-specific hubs (Austin, NYC, Chicago, etc.).',
    category: 'Job Boards',
  },

  // ── Resume & Applications ─────────────────────────────────────────────────
  {
    name: 'Jobscan',
    url: 'https://www.jobscan.co',
    description: 'Paste a job description and your resume — it scores ATS compatibility and flags missing keywords.',
    category: 'Resume & Applications',
  },
  {
    name: 'Resume.io',
    url: 'https://resume.io',
    description: 'Clean, ATS-friendly resume templates. Faster than fighting with Word.',
    category: 'Resume & Applications',
  },
  {
    name: 'Canva Resume Builder',
    url: 'https://www.canva.com/resumes',
    description: 'Good for creative roles where design matters. Less ideal if you\'re targeting ATS-heavy companies.',
    category: 'Resume & Applications',
  },
  {
    name: 'Sure Shortlist',
    url: 'https://sureshortlist.com/',
    description: 'Optimize and tailor your resume to avoid getting flagged by ATS.',
    category: 'Resume & Applications',
  },
  
  // ── Interview Prep ────────────────────────────────────────────────────────
  {
    name: 'Glassdoor Interviews',
    url: 'https://www.glassdoor.com/Interview',
    description: 'Real interview questions submitted by candidates. Search by company and role before every interview.',
    category: 'Interview Prep',
  },
  {
    name: 'The Muse: Interview Prep',
    url: 'https://www.themuse.com/advice/interview-prep',
    description: 'Practical guides on answering common questions, negotiating offers, and reading the room.',
    category: 'Interview Prep',
  },
  {
    name: 'Big Interview',
    url: 'https://biginterview.com',
    description: 'Practice answering interview questions on video with AI feedback. Especially useful for behavioral rounds.',
    category: 'Interview Prep',
  },

  // ── Salary & Negotiation ──────────────────────────────────────────────────
  {
    name: 'Levels.fyi',
    url: 'https://www.levels.fyi',
    description: 'Crowdsourced compensation data, primarily for tech. Know your number before you negotiate.',
    category: 'Salary & Negotiation',
  },
  {
    name: 'Glassdoor Salaries',
    url: 'https://www.glassdoor.com/Salaries',
    description: 'Salary ranges by role and company. Useful for industries outside tech where Levels.fyi has less data.',
    category: 'Salary & Negotiation',
  },
  {
    name: 'Payscale',
    url: 'https://www.payscale.com',
    description: 'Salary research tool with good coverage of non-tech roles and mid-market companies.',
    category: 'Salary & Negotiation',
  },

  // ── Networking ────────────────────────────────────────────────────────────
  {
    name: 'Lunchclub',
    url: 'https://lunchclub.com',
    description: 'AI-matched 1:1 networking meetings. Good for meeting people outside your immediate circle.',
    category: 'Networking',
  },
];
