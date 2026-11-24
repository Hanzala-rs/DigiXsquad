import type { SiteContent } from '@digixsquad/api-client';
import { Container, Eyebrow } from '@/components/sections/primitives';
import { homeAnchors, homeSections } from '@/content/home';
import { VisionStatement } from './vision-statement';

/**
 * "Our vision / Our mission": two big statements whose words light up as you scroll through
 * them, next to a sticky label with an outlined 01 / 02. Fully lit with no JS or reduced motion.
 */
export function VisionMission({ content }: { content: SiteContent }) {
  const copy = homeSections.vision;
  const eyebrowId = `${homeAnchors.vision}-eyebrow`;
  const statements = [
    { title: copy.visionTitle, text: content.about.vision },
    { title: copy.missionTitle, text: content.about.mission },
  ].filter((s) => s.text?.trim());

  if (statements.length === 0) return null;

  return (
    <section
      id={homeAnchors.vision}
      aria-labelledby={eyebrowId}
      className="relative py-16 md:py-24"
    >
      {/* clipped decoration layer: overflow on the section itself would break position: sticky */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="absolute top-1/4 -right-48 aspect-square w-[min(720px,120vw)] bg-[radial-gradient(circle,rgb(255_106_0/0.12),transparent_62%)]" />
        <div className="absolute bottom-0 -left-48 aspect-square w-[min(640px,110vw)] bg-[radial-gradient(circle,rgb(232_68_15/0.1),transparent_62%)]" />
      </div>

      <Container className="relative">
        <div id={eyebrowId}>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </div>
      </Container>

      <div className="relative">
        {statements.map((s, i) => (
          <VisionStatement
            key={s.title}
            index={i + 1}
            title={s.title}
            statement={s.text}
            headingId={`${homeAnchors.vision}-title-${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
