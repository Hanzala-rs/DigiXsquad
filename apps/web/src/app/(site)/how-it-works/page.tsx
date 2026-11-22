import type { Metadata } from 'next';
import { CtaBand, FaqList, ProcessSteps } from '@/components/sections/blocks';
import { FeatureGrid, PageHeader, Section } from '@/components/sections/primitives';
import { pageIntros } from '@/content/pages';
import { getSiteContent } from '@/lib/site-content';

const intro = pageIntros.howItWorks;

export const metadata: Metadata = {
  title: 'How it works',
  description: intro.description,
  alternates: { canonical: '/how-it-works' },
};

export default async function HowItWorksPage() {
  const { process, why_us, faqs } = await getSiteContent();
  return (
    <>
      <PageHeader eyebrow={intro.eyebrow} title={intro.title} description={intro.description} />
      <Section>
        <ProcessSteps steps={process} />
      </Section>
      <Section
        tone="surface"
        eyebrow="What we handle"
        title="You manage outcomes, we manage people"
      >
        <FeatureGrid items={why_us} />
      </Section>
      <Section eyebrow="FAQs" title="Questions about the process">
        <FaqList faqs={faqs} />
      </Section>
      <CtaBand />
    </>
  );
}
