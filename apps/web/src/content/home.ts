/**
 * Home page UI copy: section labels and hero decoration words. Business content (story,
 * team, counters, sponsors, founder) comes from getSiteContent(), not from here.
 */
export const homeHeroExtras = {
  wordLeft: 'Digital',
  wordRight: 'Squad',
  accentLeft: 'IT talent · on demand',
  accentRight: 'Monthly · Managed · Ready',
  introLoading: 'Assembling your squad',
  enter: 'Enter',
  /** Used only if site content has no founder.portrait_alt. */
  founderAlt: 'DigixSquad founder',
} as const;

/** Anchor ids, in page order. The navbar links to these on `/`. */
export const homeAnchors = {
  top: 'top',
  about: 'about',
  team: 'team',
  squads: 'squads',
  vision: 'vision',
  projects: 'projects',
  contact: 'contact',
} as const;

export const homeSections = {
  about: { eyebrow: 'About the company', title: 'What we do' },
  team: { eyebrow: 'Leadership', title: 'Team members' },
  squads: {
    eyebrow: 'Our squads',
    title: 'Ready-to-deploy teams',
    description: 'Pick a squad built for your kind of project, or hire individual roles.',
    viewSquad: 'View squad',
    allSquads: 'All squads',
    units: { people: 'people', roles: 'Roles in this squad' },
    /** Last grid cell: fills the 3×2 grid and points to a custom hire request. */
    custom: {
      eyebrow: 'Custom squad',
      title: 'Need a different mix?',
      description:
        'Pick the exact roles, team size and duration. We build the squad around your project.',
      steps: ['Choose roles', 'Set duration', 'Get a quote'],
      cta: 'Build your squad',
      href: '/hire',
    },
  },
  vision: { eyebrow: 'Where we are going', visionTitle: 'Our vision', missionTitle: 'Our mission' },
  projects: {
    eyebrow: 'Track record',
    title: 'Our projects',
    cta: 'Start a request',
    track: 'Track a request',
  },
} as const;
