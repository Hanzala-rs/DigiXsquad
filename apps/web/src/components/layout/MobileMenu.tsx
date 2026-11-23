'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { isActivePath, mainNav } from './nav-links';

/** Hamburger menu below 1180px. On very small phones (< 400px) it also holds the CTA. */
export function MobileMenu({ ctaLabel }: { ctaLabel: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation and on Esc.
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
    <div className="min-[1180px]:hidden">
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
          <ul className="flex flex-col text-base">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                  className="block border-l-2 border-transparent px-4 py-3 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-2 min-[400px]:hidden">
            <Button asChild size="sm" className="w-full">
              <Link href="/hire">{ctaLabel}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
