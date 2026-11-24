import type { Metadata } from 'next';
import { HomepageEditor } from '@/components/admin/site-content/HomepageEditor';

export const metadata: Metadata = { title: 'Homepage' };

export default function AdminSiteContentPage() {
  return <HomepageEditor />;
}
