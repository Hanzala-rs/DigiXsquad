'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { isActivePath, mainNav } from './nav-links';

export function Navbar({ ctaLabel }: { ctaLabel: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'ds-intro-nav fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-border/70 bg-background/80 backdrop-blur-md'
          : 'border-transparent bg-gradient-to-b from-background/90 to-transparent',
      )}
    >
      <nav
        aria-label="Main"
        className={cn(
          'flex items-center justify-between gap-4 px-[clamp(16px,4vw,48px)] transition-[padding] duration-300',
          scrolled ? 'py-3' : 'py-[18px]',
        )}
      >
        <Logo />
        <ul className="hidden items-center gap-6 text-sm text-muted-foreground min-[1180px]:flex">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                className="relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100 aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="max-[399px]:hidden">
            <Link href="/hire">{ctaLabel}</Link>
          </Button>
          <MobileMenu ctaLabel={ctaLabel} />
        </div>
      </nav>
    </header>
  );
}
