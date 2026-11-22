import type { Metadata } from 'next';
import { LegalPage } from '@/components/sections/LegalPage';
import { termsOfUse } from '@/content/legal';

export const metadata: Metadata = {
  title: termsOfUse.title,
  description: termsOfUse.intro,
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <LegalPage doc={termsOfUse} />;
}
