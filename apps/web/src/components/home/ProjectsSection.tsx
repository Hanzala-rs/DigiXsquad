import type { SiteContent } from '@digixsquad/api-client';
import { homeAnchors } from '@/content/home';

/** Admin-set counters (Agent C). Placeholder until the section is built. */
export function ProjectsSection({ content }: { content: SiteContent }) {
  void content;
  return <section id={homeAnchors.projects} aria-label="projects" className="min-h-[60vh]" />;
}
