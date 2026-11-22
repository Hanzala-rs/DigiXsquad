import type { Metadata } from 'next';
import Link from 'next/link';
import { CtaBand } from '@/components/sections/blocks';
import { FeatureGrid, PageHeader, Section } from '@/components/sections/primitives';
import { Button } from '@/components/ui/button';
import { government as g } from '@/content/pages';
import { getSiteContent } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Government',
  description: g.description,
  alternates: { canonical: '/government' },
};

export default async function GovernmentPage() {
  const { compliance } = await getSiteContent();
  return (
    <>
      <PageHeader eyebrow={g.eyebrow} title={g.title} description={g.description}>
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <Button asChild>
            <Link href="/hire?org=GOVT">Submit a requirement</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/contact">Request documents</Link>
          </Button>
        </div>
      </PageHeader>

      <Section tone="formal" eyebrow="Scope" title={g.focusTitle}>
        <FeatureGrid items={g.focus} columns={4} formal />
      </Section>

      <Section
        tone="formal"
        className="border-t border-[#d9d4cc]"
        eyebrow="PPRA"
        title={g.procurementTitle}
        description="Choose the procurement mode in your request and we prepare the documents to match."
      >
        <FeatureGrid items={g.procurement} columns={4} formal />
      </Section>

      <Section
        id="compliance"
        eyebrow="Compliance & trust"
        title="Registered, documented and secure"
      >
        <FeatureGrid items={compliance} columns={4} />
      </Section>

      <CtaBand />
    </>
  );
}
