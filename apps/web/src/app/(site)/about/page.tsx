import type { Metadata } from 'next';
import { Compass, Target, Users } from 'lucide-react';
import { CtaBand, StatsBand } from '@/components/sections/blocks';
import { Card, FeatureGrid, PageHeader, Section } from '@/components/sections/primitives';
import { pageIntros } from '@/content/pages';
import { getSiteContent } from '@/lib/site-content';

const intro = pageIntros.about;

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getSiteContent();
  return {
    title: 'About',
    description: about.mission,
    alternates: { canonical: '/about' },
  };
}

export default async function AboutPage() {
  const { about, why_us, stats, compliance } = await getSiteContent();
  return (
    <>
      <PageHeader eyebrow={intro.eyebrow} title={intro.title} />

      <Section id="story" eyebrow="Our story" title="Why we started">
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{about.story}</p>
      </Section>

      <Section id="mission-vision" tone="surface">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { label: 'Mission', text: about.mission, icon: Target },
            { label: 'Vision', text: about.vision, icon: Compass },
          ].map(({ label, text, icon: I }) => (
            <Card key={label} className="p-8 md:p-10">
              <I className="size-8 text-primary" aria-hidden="true" />
              <h2 className="mt-5 font-heading text-sm font-semibold tracking-[0.3em] text-primary uppercase">
                Our {label}
              </h2>
              <p className="mt-3 text-xl leading-relaxed md:text-2xl">{text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="values" eyebrow="Core values" title="How we work">
        <FeatureGrid items={about.values} />
      </Section>

      {about.goals && about.goals.length > 0 && (
        <Section id="goals" tone="surface" eyebrow="Goals" title="What we are working towards">
          <ol className="grid gap-5 md:grid-cols-2">
            {about.goals.map((goal, i) => (
              <li key={goal} className="flex gap-5">
                <span
                  aria-hidden="true"
                  className="font-heading text-4xl font-bold text-primary/70"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="pt-2 text-lg">{goal}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}

      <Section id="why-us" eyebrow="Why DigixSquad" title="What you get">
        <FeatureGrid items={why_us} />
      </Section>

      <StatsBand stats={stats} />

      <Section
        id="compliance"
        tone="surface"
        eyebrow="Compliance & trust"
        title="Safe to work with"
      >
        <FeatureGrid items={compliance} columns={4} />
      </Section>

      {/* Placeholder until the client shares team names and photos (PLAN.md §11). */}
      <Section id="team" eyebrow="Leadership" title="The team behind your squad">
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Users className="size-8 text-primary" aria-hidden="true" />
          <p className="max-w-xl text-muted-foreground">
            Leadership profiles are coming soon. Every squad is led by an experienced lead who is
            your single point of contact.
          </p>
        </Card>
      </Section>

      <CtaBand />
    </>
  );
}
