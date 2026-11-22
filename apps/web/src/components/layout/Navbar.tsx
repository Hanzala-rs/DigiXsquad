import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { mainNav } from './nav-links';

export function Navbar({ ctaLabel }: { ctaLabel: string }) {
  return (
    <header className="ds-intro-nav fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-background/90 to-transparent">
      <nav
        aria-label="Main"
        className="flex items-center justify-between px-[clamp(16px,4vw,48px)] py-[18px]"
      >
        <Logo />
        <ul className="hidden gap-7 text-sm text-muted-foreground min-[820px]:flex">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/hire">{ctaLabel}</Link>
          </Button>
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
