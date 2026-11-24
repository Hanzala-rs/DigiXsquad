'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { isNavItemActive, mainNavSections, type NavItem } from './nav-links';
import { useActiveSection } from './useActiveSection';

/** Active main-nav section on `/` (null elsewhere). */
export function useMainNavSection(pathname: string) {
  return useActiveSection(mainNavSections, pathname === '/');
}

/**
 * A `/#id` link. On `/` it is a plain anchor, so the browser does a same-document smooth scroll
 * (CSS `scroll-behavior` + `scroll-margin-top`) with no router work; on other pages it is a
 * `next/link` that navigates home and lands on the section.
 */
export function NavItemLink({
  item,
  pathname,
  activeSection,
  ...props
}: {
  item: NavItem;
  pathname: string;
  activeSection: string | null;
} & Omit<ComponentProps<'a'>, 'href'>) {
  const active = isNavItemActive(pathname, activeSection, item);
  const current = active ? (pathname === '/' ? 'location' : 'page') : undefined;
  if (pathname === '/' && item.section) {
    return (
      <a href={`#${item.section}`} aria-current={current} {...props}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} aria-current={current} {...props}>
      {item.label}
    </Link>
  );
}
