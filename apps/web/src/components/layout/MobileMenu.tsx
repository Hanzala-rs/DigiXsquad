'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mainNav } from './nav-links';

export function MobileMenu() {
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
    <div className="min-[820px]:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="chamfer-sm grid size-10 place-items-center bg-surface text-foreground shadow-[inset_0_0_0_1px_rgb(255_106_0/0.4)]"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <ul
          id="mobile-menu"
          className="absolute inset-x-4 top-[72px] chamfer flex flex-col bg-surface/95 p-2 text-base shadow-[inset_0_0_0_1px_rgb(255_106_0/0.35)] backdrop-blur-md"
        >
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block px-4 py-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
