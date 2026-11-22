export const mainNav = [
  { href: '/squads', label: 'Squads' },
  { href: '/roles', label: 'Roles' },
  { href: '/government', label: 'Government' },
  { href: '/private-sector', label: 'Private Sector' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const footerNav = [
  {
    title: 'Services',
    links: [
      { href: '/squads', label: 'Squads' },
      { href: '/roles', label: 'Roles' },
      { href: '/engagement-models', label: 'Engagement models' },
      { href: '/how-it-works', label: 'How it works' },
    ],
  },
  {
    title: 'Sectors',
    links: [
      { href: '/government', label: 'Government' },
      { href: '/private-sector', label: 'Private sector' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/track', label: 'Track a request' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
] as const;
