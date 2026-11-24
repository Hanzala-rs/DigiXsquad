import type { Metadata } from 'next';
import { TalentEditor } from '@/components/admin/talents/TalentEditor';

export const metadata: Metadata = { title: 'Add talent' };

export default function AdminNewTalentPage() {
  return <TalentEditor id={null} />;
}
