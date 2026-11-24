import type { SiteContent, Squad } from '@digixsquad/api-client';
import { homeAnchors } from '@/content/home';

/** Squad cards (Agent C). Placeholder until the section is built. */
export function SquadsSection({ squads }: { squads: Squad[]; content?: SiteContent }) {
  void squads;
  return <section id={homeAnchors.squads} aria-label="squads" className="min-h-[60vh]" />;
}
