import type { SiteContent } from '@digixsquad/api-client';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/components/motion/Reveal';
import { Container, Eyebrow } from '@/components/sections/primitives';
import { Button } from '@/components/ui/button';
import { homeAnchors, homeSections } from '@/content/home';
import { ProjectsCounters } from './projects-counters';

const copy = homeSections.projects;
const headingId = `${homeAnchors.projects}-title`;

/**
 * "Our projects": admin-set counters (`content.projects`) as badges on a line, then the
 * request CTAs. Hidden entirely when there are no counters.
 */
export function ProjectsSection({ content }: { content: SiteContent }) {
  const items = content.projects ?? [];
  if (items.length === 0) return null;

  return (
    <section
      id={homeAnchors.projects}
      aria-labelledby={headingId}
      className="relative isolate overflow-hidden border-t border-border bg-surface py-16 md:py-24"
    >
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1/2 left-1/2 -z-10 aspect-square w-[min(1000px,160vw)] -translate-x-1/2 bg-[radial-gradient(circle,rgb(255_106_0/0.16),transparent_60%)]"
      />
      <Container>
        <Reveal className="mx-auto mb-12 max-w-2xl space-y-3 text-center md:mb-16">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 id={headingId} className="text-fluid-h2 font-bold uppercase">
            {copy.title}
          </h2>
        </Reveal>

        <ProjectsCounters items={items} />

        <Reveal
          delay={0.2}
          className="mt-14 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:mt-20"
        >
          <Button asChild>
            <Link href="/hire">
              {copy.cta}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/track">{copy.track}</Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
