import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <section className="relative grid min-h-[80svh] place-items-center px-4 pt-24 text-center">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
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
    </section>
  );
}
