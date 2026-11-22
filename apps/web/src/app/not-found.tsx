import Link from 'next/link';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';

/** Root 404 (renders without the site chrome, so it carries its own logo link). */
export default function NotFound() {
  return (
    <main id="main" className="relative grid min-h-svh place-items-center px-4 text-center">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <Logo />
      </div>
      <div className="relative space-y-5">
        <p className="font-heading text-sm font-semibold tracking-[0.3em] text-primary uppercase">
          404
        </p>
        <h1 className="text-4xl font-bold uppercase md:text-5xl">Page not found</h1>
        <p className="text-muted-foreground">This page doesn&apos;t exist yet, or it has moved.</p>
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
