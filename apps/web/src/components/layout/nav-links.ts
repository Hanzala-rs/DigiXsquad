import { homeAnchors } from '@/content/home';

export type NavItem = {
  href: string;
  label: string;
  /** Home-page section this link scrolls to (`/#id`). */
  section?: string;
  /** Page that also marks this link active when browsing off the home page. */
  page?: string;
};

const anchor = (id: string) => `/#${id}`;

/** Desktop + mobile main navigation: anchors into the home one-pager (work from any page). */
export const mainNav: readonly NavItem[] = [
  {
    href: anchor(homeAnchors.about),
    label: 'About us',
    section: homeAnchors.about,
    page: '/about',
  },
  {
    href: anchor(homeAnchors.squads),
    label: 'Squads',
    section: homeAnchors.squads,
    page: '/squads',
  },
  { href: anchor(homeAnchors.projects), label: 'Projects', section: homeAnchors.projects },
  {
    href: anchor(homeAnchors.contact),
    label: 'Contact',
    section: homeAnchors.contact,
    page: '/contact',
  },
];

/** Section ids the navbar highlights while scrolling `/`. */
export const mainNavSections = mainNav.flatMap((item) => (item.section ? [item.section] : []));

/** Full page list, shown in the mobile menu under the anchors. */
export const pageNav: readonly NavItem[] = [
  { href: '/squads', label: 'Squads' },
  { href: '/roles', label: 'Roles' },
  { href: '/government', label: 'Government' },
  { href: '/private-sector', label: 'Private sector' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/track', label: 'Track a request' },
];

export const mobileNavTitles = { sections: 'On this page', pages: 'Pages' } as const;

export const footerNav = [
  {
    title: 'About',
    links: [
      { href: anchor(homeAnchors.about), label: 'About us' },
      { href: anchor(homeAnchors.team), label: 'Team' },
      { href: anchor(homeAnchors.vision), label: 'Vision & mission' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/engagement-models', label: 'Engagement models' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/squads', label: 'Squads' },
      { href: '/roles', label: 'Roles' },
      { href: '/government', label: 'Government' },
      { href: '/private-sector', label: 'Private sector' },
      { href: '/contact', label: 'Contact page' },
      { href: '/track', label: 'Track a request' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
] as const;

/** Footer UI copy that isn't a link column. */
export const footerCopy = {
  sponsors: 'Sponsors',
  links: 'Links',
  rights: 'All rights reserved.',
} as const;

/** `/` matches only itself; other links also match their sub-pages (e.g. /squads/x). */
export const isActivePath = (pathname: string, href: string) =>
  pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

/**
 * Whether a main-nav item is current. On `/` it follows the section in view; elsewhere it
 * follows the matching page (Squads on /squads/x).
 */
export const isNavItemActive = (pathname: string, activeSection: string | null, item: NavItem) =>
  pathname === '/'
    ? !!item.section && item.section === activeSection
    : !!item.page && isActivePath(pathname, item.page);
