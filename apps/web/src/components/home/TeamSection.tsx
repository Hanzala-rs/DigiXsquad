import type { SiteContent } from '@digixsquad/api-client';
import { homeAnchors } from '@/content/home';

/** Leadership cards (Agent B). Placeholder until the section is built. */
export function TeamSection({ content }: { content: SiteContent }) {
  void content;
  return <section id={homeAnchors.team} aria-label="team" className="min-h-[60vh]" />;
}
