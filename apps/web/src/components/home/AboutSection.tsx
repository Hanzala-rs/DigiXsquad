import type { SiteContent } from '@digixsquad/api-client';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Card, Container, Eyebrow, IconBadge } from '@/components/sections/primitives';
import { homeAnchors, homeSections } from '@/content/home';
import { AboutAccentLine } from './about-accent';

/**
 * "What we do / About company": the company story as a lead paragraph on the left, service
 * cards (`what_we_do`, falling back to `why_us`) in a staggered 2×2 grid on the right.
 * Stacks below 820px.
 */
export function AboutSection({ content }: { content: SiteContent }) {
  const copy = homeSections.about;
  const headingId = `${homeAnchors.about}-title`;
  const items = content.what_we_do?.length ? content.what_we_do : content.why_us;

  return (
    <section
      id={homeAnchors.about}
      aria-labelledby={headingId}
      className="relative overflow-x-clip py-20 md:py-28"
    >
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute top-1/3 -left-40 aspect-square w-[min(640px,110vw)] bg-[radial-gradient(circle,rgb(255_106_0/0.14),transparent_62%)]"
        aria-hidden="true"
      />

      <Container className="relative grid gap-12 min-[820px]:grid-cols-12 min-[820px]:gap-10 lg:gap-16">
        <div className="space-y-6 min-[820px]:col-span-5 min-[820px]:self-start lg:sticky lg:top-28">
          <Reveal from="up" className="space-y-3">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h2 id={headingId} className="text-fluid-h2 font-bold uppercase">
              {copy.title}
            </h2>
          </Reveal>
          <AboutAccentLine />
          <Reveal from="up" delay={0.15} distance={24}>
            <p className="text-lg leading-relaxed text-foreground/90 md:text-xl">
              {content.about.story}
            </p>
          </Reveal>
        </div>

        <RevealGroup
          as="ul"
          stagger={0.12}
          className="grid gap-5 sm:grid-cols-2 min-[820px]:col-span-7"
        >
          {items.map((item, i) => (
            <RevealItem as="li" key={item.title} className="h-full">
              <Card className="group relative h-full p-6 md:p-7">
                <span
                  aria-hidden="true"
                  className="absolute top-5 right-6 font-heading text-sm font-semibold tracking-widest text-muted-foreground/60 transition-colors duration-300 group-hover:text-primary"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <IconBadge name={item.icon} />
                <h3 className="mt-5 font-heading text-lg font-semibold uppercase tracking-wide">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <span
                  aria-hidden="true"
                  className="mt-6 block h-px w-10 bg-primary/60 transition-[width] duration-500 ease-brand group-hover:w-full"
                />
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
