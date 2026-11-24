import type { SiteContent } from '@digixsquad/api-client';
import { Reveal } from '@/components/motion/Reveal';
import { Container, Eyebrow } from '@/components/sections/primitives';
import { homeAnchors, homeSections } from '@/content/home';
import { cn } from '@/lib/utils';
import { TeamPortrait } from './team-portrait';

/**
 * Leadership rows from `content.team`, alternating sides (text | photo, then photo | text);
 * each half slides in from its own side. Hidden when there are no members.
 */
export function TeamSection({ content }: { content: SiteContent }) {
  const team = content.team ?? [];
  if (team.length === 0) return null;

  const copy = homeSections.team;
  const headingId = `${homeAnchors.team}-title`;
  const total = String(team.length).padStart(2, '0');

  return (
    <section
      id={homeAnchors.team}
      aria-labelledby={headingId}
      className="relative overflow-x-clip bg-surface py-20 md:py-28"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden="true"
      />
      <Container>
        <Reveal className="mb-14 max-w-2xl space-y-3 md:mb-20">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 id={headingId} className="text-fluid-h2 font-bold uppercase">
            {copy.title}
          </h2>
        </Reveal>

        <ul className="space-y-20 md:space-y-28">
          {team.map((member, i) => {
            const photoRight = i % 2 === 0;
            return (
              <li
                key={`${member.name}-${member.title}`}
                className="grid items-center gap-10 min-[820px]:grid-cols-2 min-[820px]:gap-14 lg:gap-20"
              >
                <Reveal
                  from={photoRight ? 'right' : 'left'}
                  distance={64}
                  amount={0.3}
                  className={cn(photoRight ? 'min-[820px]:order-2' : 'min-[820px]:order-1')}
                >
                  <TeamPortrait member={member} />
                </Reveal>

                <Reveal
                  from={photoRight ? 'left' : 'right'}
                  distance={64}
                  delay={0.1}
                  amount={0.3}
                  className={cn(
                    'relative',
                    photoRight ? 'min-[820px]:order-1' : 'min-[820px]:order-2',
                  )}
                >
                  <p
                    aria-hidden="true"
                    className="font-heading text-sm font-semibold tracking-[0.3em] text-muted-foreground"
                  >
                    <span className="text-primary">{String(i + 1).padStart(2, '0')}</span> / {total}
                  </p>
                  <h3 className="mt-4 font-heading text-[clamp(2rem,1.4rem+2.4vw,3.5rem)] leading-none font-bold uppercase">
                    {member.name}
                  </h3>
                  <p className="mt-4 font-mono text-sm font-semibold tracking-[0.25em] text-primary uppercase">
                    {member.title}
                  </p>
                  <span
                    aria-hidden="true"
                    className="mt-6 block h-px w-24 bg-gradient-to-r from-glow via-primary to-transparent"
                  />
                  {member.bio && (
                    <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                      {member.bio}
                    </p>
                  )}
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
