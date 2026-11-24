import type { SiteContent, Squad } from '@digixsquad/api-client';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Container, Eyebrow } from '@/components/sections/primitives';
import { Button } from '@/components/ui/button';
import { homeAnchors, homeSections } from '@/content/home';
import { SquadsCard } from './squads-card';
import { SquadsCustomCard } from './squads-custom-card';

const copy = homeSections.squads;
const headingId = `${homeAnchors.squads}-title`;
/** Carousel slide on phones, plain grid cell from `sm` up. */
const itemClass = 'w-[82%] max-w-sm shrink-0 snap-start sm:w-auto sm:max-w-none';

/**
 * "Our squads": the seeded squads as chamfered cards plus a closing "build your own squad"
 * card, so 5 squads fill an even grid (3×2 desktop, 2×3 tablet) instead of a centred 3 + 2.
 * Mobile: horizontal scroll-snap carousel (next card peeks in). Cards stagger in on scroll.
 */
export function SquadsSection({ squads }: { squads: Squad[]; content?: SiteContent }) {
  return (
    <section
      id={homeAnchors.squads}
      aria-labelledby={headingId}
      className="relative isolate py-16 md:py-24"
    >
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 aspect-square w-[min(820px,130vw)] -translate-x-1/2 bg-[radial-gradient(circle,rgb(255_106_0/0.12),transparent_62%)]"
      />
      <Container>
        <Reveal className="mx-auto mb-10 max-w-2xl space-y-3 text-center md:mb-14">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 id={headingId} className="text-fluid-h2 font-bold uppercase">
            {copy.title}
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">{copy.description}</p>
        </Reveal>

        {squads.length > 0 && (
          <RevealGroup
            as="ul"
            stagger={0.08}
            amount={0.15}
            className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-2 pb-6 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
          >
            {squads.map((squad, i) => (
              <RevealItem key={squad.slug} as="li" className={itemClass}>
                <SquadsCard squad={squad} index={i} viewLabel={copy.viewSquad} />
              </RevealItem>
            ))}
            <RevealItem as="li" className={itemClass}>
              <SquadsCustomCard />
            </RevealItem>
          </RevealGroup>
        )}

        <Reveal delay={0.1} className="mt-8 flex justify-center md:mt-12">
          <Button asChild variant="ghost">
            <Link href="/squads">
              {copy.allSquads}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
