import type { SiteContent, Squad } from '@digixsquad/api-client';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/components/motion/Reveal';
import { Container, Eyebrow } from '@/components/sections/primitives';
import { Button } from '@/components/ui/button';
import { homeAnchors, homeSections } from '@/content/home';
import { SquadsCard } from './squads-card';
import { SquadsCustomCard } from './squads-custom-card';
import { SquadsRunway } from './squads-runway';

const copy = homeSections.squads;
const headingId = `${homeAnchors.squads}-title`;
/** Same size portrait cards on one line; equal heights come from the flex row stretching. */
const cardClass =
  'flex min-h-[26rem] w-[78vw] max-w-[20rem] shrink-0 snap-start sm:w-[20rem] lg:w-[21rem]';

/**
 * "Our squads": the seeded squads plus a closing "build your own squad" card, all on one
 * line (a runway). Desktop: the section pins and the line slides as you scroll. Phones,
 * reduced motion and no-JS: a horizontal swipe line. See SquadsRunway.
 */
export function SquadsSection({ squads }: { squads: Squad[]; content?: SiteContent }) {
  return (
    <section id={homeAnchors.squads} aria-labelledby={headingId} className="relative isolate py-16">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 aspect-square w-[min(820px,130vw)] -translate-x-1/2 bg-[radial-gradient(circle,rgb(255_106_0/0.12),transparent_62%)]"
      />

      <SquadsRunway
        label={copy.title}
        header={
          <Container>
            <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-10">
              <div className="max-w-2xl space-y-3">
                <Eyebrow>{copy.eyebrow}</Eyebrow>
                <h2 id={headingId} className="text-fluid-h2 font-bold uppercase">
                  {copy.title}
                </h2>
                <p className="text-base text-muted-foreground md:text-lg">{copy.description}</p>
              </div>
              <Button asChild variant="ghost">
                <Link href="/squads">
                  {copy.allSquads}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>
          </Container>
        }
      >
        {squads.map((squad, i) => (
          <li key={squad.slug} className={cardClass}>
            <Reveal from="right" amount={0.3} className="flex w-full *:w-full">
              <SquadsCard squad={squad} index={i} viewLabel={copy.viewSquad} />
            </Reveal>
          </li>
        ))}
        <li className={cardClass}>
          <Reveal from="right" amount={0.3} className="flex w-full *:w-full">
            <SquadsCustomCard />
          </Reveal>
        </li>
      </SquadsRunway>
    </section>
  );
}
