import type { SiteContent } from '@digixsquad/api-client';
import { homeAnchors } from '@/content/home';

/** Vision + mission, sticky split (Agent B). Placeholder until the section is built. */
export function VisionMission({ content }: { content: SiteContent }) {
  void content;
  return <section id={homeAnchors.vision} aria-label="vision" className="min-h-[60vh]" />;
}
