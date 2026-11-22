import type { Metadata } from 'next';
import { RequestDetail } from '@/components/admin/requests/RequestDetail';

export const metadata: Metadata = { title: 'Request' };

export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RequestDetail id={id} />;
}
