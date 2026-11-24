import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EngagementsView } from '@/components/admin/engagements/EngagementsView';
import { Skeleton } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Engagements' };

export default function AdminEngagementsPage() {
  return (
    <Suspense fallback={<Skeleton className="chamfer h-96" />}>
      <EngagementsView />
    </Suspense>
  );
}
