import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { HomeHero } from '@/components/home/HomeHero';
import { IntroSplash } from '@/components/home/IntroSplash';
import { CtaBand, FaqList, ProcessSteps, SquadCard, StatsBand } from '@/components/sections/blocks';
import { Card, FeatureGrid, IconBadge, Section } from '@/components/sections/primitives';
import { Button } from '@/components/ui/button';
import { homeHeroExtras } from '@/content/home';
import { government, privateSector } from '@/content/pages';
import { getSquads } from '@/lib/catalog';
import { getSiteContent } from '@/lib/site-content';

export default async function HomePage() {
  const [content, squads] = await Promise.all([getSiteContent(), getSquads()]);
  return (
    <>
      <IntroSplash loadingLabel={homeHeroExtras.introLoading} />
      <HomeHero content={content} />

      <Section id="how-it-works" eyebrow="How it works" title="Request to delivery in five steps">
        <ProcessSteps steps={content.process} />
      </Section>

      <Section
        id="squads"
        tone="surface"
        eyebrow="Squads"
        title="Ready-to-deploy teams"
        description="Pick a squad built for your kind of project, or hire individual roles."
      >
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {squads.slice(0, 6).map((squad) => (
            <li key={squad.slug}>
              <SquadCard squad={squad} />
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="ghost">
            <Link href="/squads">All squads</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/roles">Browse all roles</Link>
          </Button>
        </div>
      </Section>

      <Section id="sectors" eyebrow="Who we serve" title="Built for government and business">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { ...government, href: '/government', icon: 'landmark' },
            { ...privateSector, href: '/private-sector', icon: 'building-2' },
          ].map((s) => (
            <Card key={s.href} className="relative flex flex-col p-8">
              <IconBadge name={s.icon} />
              <p className="mt-6 font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
                {s.eyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-bold uppercase">{s.title}</h3>
              <p className="mt-3 flex-1 text-muted-foreground">{s.description}</p>
              <ul className="mt-5 space-y-1.5 text-sm">
                {s.focus.map((f) => (
                  <li key={f.title} className="flex items-center gap-2">
                    <span className="size-1.5 bg-primary" aria-hidden="true" />
                    {f.title}
                  </li>
                ))}
              </ul>
              <Link
                href={s.href}
                className="mt-6 inline-flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.1em] text-primary uppercase after:absolute after:inset-0 hover:text-glow"
              >
                Learn more <ArrowRight className="size-4" aria-hidden="true" />
                <span className="sr-only">: {s.eyebrow}</span>
              </Link>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="why-us"
        tone="surface"
        eyebrow="Why DigixSquad"
        title="Your team, without the overhead"
      >
        <FeatureGrid items={content.why_us} />
      </Section>

      <StatsBand stats={content.stats} />

      <Section id="faqs" eyebrow="FAQs" title="Common questions" centered>
        <FaqList faqs={content.faqs} />
      </Section>

      <CtaBand />
    </>
  );
}
