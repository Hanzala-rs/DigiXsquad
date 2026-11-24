import type { SiteContent } from '@digixsquad/api-client';
import { homeAnchors } from '@/content/home';

/** Story + what_we_do cards (Agent B). Placeholder until the section is built. */
export function AboutSection({ content }: { content: SiteContent }) {
  void content;
  return <section id={homeAnchors.about} aria-label="about" className="min-h-[60vh]" />;
}
