import type { Metadata } from 'next';
import { TalentEditor } from '@/components/admin/talents/TalentEditor';

export const metadata: Metadata = { title: 'Talent' };

export default async function AdminTalentPage({ params }: { params: Promise<{ id: string }> }) {
  return <TalentEditor id={(await params).id} />;
}
