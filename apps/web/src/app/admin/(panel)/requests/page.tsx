import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RequestsView } from '@/components/admin/requests/RequestsView';
import { Skeleton } from '@/components/admin/ui';

export const metadata: Metadata = { title: 'Requests' };

export default function AdminRequestsPage() {
  return (
    <Suspense fallback={<Skeleton className="chamfer h-96" />}>
      <RequestsView />
    </Suspense>
  );
}
