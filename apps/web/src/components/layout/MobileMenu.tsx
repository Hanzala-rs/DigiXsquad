'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { isActivePath, mainNav, mobileNavTitles, pageNav } from './nav-links';
import { NavItemLink } from './SectionNav';

const itemClass =
  'block border-l-2 border-transparent px-4 py-3 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground [&[aria-current]]:border-primary [&[aria-current]]:text-foreground';
const titleClass =
  'px-4 pt-3 pb-1 font-heading text-[11px] font-semibold tracking-[0.2em] text-muted-foreground/80 uppercase';

/** Hamburger menu below 900px: home-section anchors, then the full page list. */
export function MobileMenu({
  ctaLabel,
  activeSection,
}: {
  ctaLabel: string;
  activeSection: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  // Close on navigation and on Esc (anchor clicks on `/` don't change the path: see onClick).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-[900px]:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="chamfer-sm grid size-10 place-items-center bg-surface text-foreground shadow-[inset_0_0_0_1px_rgb(255_106_0/0.4)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--glow)]"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div
          id="mobile-menu"
          className="chamfer absolute inset-x-4 top-[calc(100%+8px)] max-h-[calc(100dvh-96px)] overflow-y-auto bg-surface/95 p-2 shadow-[inset_0_0_0_1px_rgb(255_106_0/0.35)] backdrop-blur-md sm:left-auto sm:w-80"
        >
          <p id="mobile-menu-sections" className={titleClass}>
            {mobileNavTitles.sections}
          </p>
          <ul aria-labelledby="mobile-menu-sections" className="flex flex-col text-base">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavItemLink
                  item={item}
                  pathname={pathname}
                  activeSection={activeSection}
                  onClick={close}
                  className={itemClass}
                />
              </li>
            ))}
          </ul>
          <p id="mobile-menu-pages" className={titleClass}>
            {mobileNavTitles.pages}
          </p>
          <ul aria-labelledby="mobile-menu-pages" className="flex flex-col text-sm">
            {pageNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                  className={itemClass}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-2 min-[400px]:hidden">
            <Button asChild size="sm" className="w-full">
              <Link href="/hire" onClick={close}>
                {ctaLabel}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
