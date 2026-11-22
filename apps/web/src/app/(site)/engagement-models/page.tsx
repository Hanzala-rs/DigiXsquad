import type { Metadata } from 'next';
import { CtaBand } from '@/components/sections/blocks';
import {
  Card,
  FeatureGrid,
  IconBadge,
  PageHeader,
  Section,
} from '@/components/sections/primitives';
import { engagementModels as e } from '@/content/pages';

export const metadata: Metadata = {
  title: 'Engagement models',
  description: e.description,
  alternates: { canonical: '/engagement-models' },
};

export default function EngagementModelsPage() {
  return (
    <>
      <PageHeader eyebrow={e.eyebrow} title={e.title} description={e.description} />
      <Section eyebrow="Contract type" title="Monthly or project-based">
        <div className="grid gap-5 md:grid-cols-2">
          {e.contracts.map((c) => (
            <Card key={c.title} className="p-8">
              <IconBadge name={c.icon} />
              <h3 className="mt-5 text-2xl font-bold uppercase">{c.title}</h3>
              <p className="mt-3 text-muted-foreground">{c.description}</p>
              <ul className="mt-5 space-y-2">
                {c.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-3">
                    <span className="size-1.5 bg-primary" aria-hidden="true" />
                    {pt}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Section>
      <Section tone="surface" eyebrow="Work mode" title="On-site, remote or hybrid">
        <FeatureGrid items={e.modes} />
      </Section>
      <CtaBand />
    </>
  );
}
