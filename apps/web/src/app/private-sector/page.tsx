import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/sections/blocks';
import { FeatureGrid, PageHeader, Section } from '@/components/sections/primitives';
import { Button } from '@/components/ui/button';
import { privateSector as p } from '@/content/pages';

export const metadata: Metadata = {
  title: 'Private Sector',
  description: p.description,
  alternates: { canonical: '/private-sector' },
};

export default function PrivateSectorPage() {
  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} description={p.description}>
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <Button asChild>
            <Link href="/hire?org=PRIVATE">Hire a squad</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/roles">Explore roles</Link>
          </Button>
        </div>
      </PageHeader>
      <Section eyebrow="Use cases" title={p.focusTitle}>
        <FeatureGrid items={p.focus} columns={4} />
      </Section>
      <Section tone="surface" eyebrow="Flexible" title={p.flexTitle}>
        <FeatureGrid items={p.flex} columns={4} />
      </Section>
      <CtaBand />
    </>
  );
}
