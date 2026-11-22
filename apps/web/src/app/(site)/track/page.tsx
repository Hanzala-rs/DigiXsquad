import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, Container, PageHeader } from '@/components/sections/primitives';
import { TrackForm } from '@/components/track/TrackForm';

export const metadata: Metadata = {
  title: 'Track a request',
  description: 'Check the status of your hire request with your reference number and email.',
  robots: { index: false, follow: true },
};

export default function TrackPage() {
  return (
    <>
      <PageHeader
        eyebrow="Track"
        title="Where is my request?"
        description="Enter the reference number from your confirmation email and the email you used."
      />
      <Container className="max-w-3xl pb-24">
        <Card className="p-5 sm:p-8">
          <Suspense fallback={<div className="h-28 animate-pulse bg-surface" aria-hidden="true" />}>
            <TrackForm />
          </Suspense>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Lost your reference number?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
          .
        </p>
      </Container>
    </>
  );
}
