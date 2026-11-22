import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HireWizard } from '@/components/hire/HireWizard';
import { Card, Container, PageHeader } from '@/components/sections/primitives';
import { getRoles, getSquads } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Hire a squad',
  description:
    'Request a single IT professional or a complete squad on a monthly contract. Takes about 5 minutes.',
  alternates: { canonical: '/hire' },
};

export default async function HirePage() {
  const [squads, roles] = await Promise.all([getSquads(), getRoles()]);
  return (
    <>
      <PageHeader
        eyebrow="Hire request"
        title="Tell us what you need"
        description="Seven short steps, about five minutes. Your progress is saved in this tab."
      />
      <Container className="max-w-4xl pb-24">
        <Card className="p-5 sm:p-8 md:p-10">
          {/* useSearchParams (CTA prefill) needs a Suspense boundary on a static page */}
          <Suspense fallback={<div className="h-96 animate-pulse bg-surface" aria-hidden="true" />}>
            <HireWizard squads={squads} roles={roles} />
          </Suspense>
        </Card>
      </Container>
    </>
  );
}
