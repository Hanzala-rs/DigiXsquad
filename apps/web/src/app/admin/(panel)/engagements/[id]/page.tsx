import type { Metadata } from 'next';
import { EngagementDetail } from '@/components/admin/engagements/EngagementDetail';

export const metadata: Metadata = { title: 'Engagement' };

export default async function AdminEngagementPage({ params }: { params: Promise<{ id: string }> }) {
  return <EngagementDetail id={(await params).id} />;
}
