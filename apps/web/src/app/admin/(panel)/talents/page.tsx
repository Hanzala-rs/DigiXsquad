import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TalentsView } from '@/components/admin/talents/TalentsView';
import { Skeleton } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Talents' };

export default function AdminTalentsPage() {
  return (
    <Suspense fallback={<Skeleton className="chamfer h-96" />}>
      <TalentsView />
    </Suspense>
  );
}
