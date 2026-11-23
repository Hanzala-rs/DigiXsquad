import type { Metadata } from 'next';
import { CtaBand, SquadCard } from '@/components/sections/blocks';
import { Container, PageHeader } from '@/components/sections/primitives';
import { pageIntros } from '@/content/pages';
import { getSquads } from '@/lib/catalog';

const intro = pageIntros.squads;

export const metadata: Metadata = {
  title: 'Squads',
  description: intro.description,
  alternates: { canonical: '/squads' },
};

export default async function SquadsPage() {
  const squads = await getSquads();
  return (
    <>
      <PageHeader eyebrow={intro.eyebrow} title={intro.title} description={intro.description} />
      <Container>
        <h2 className="sr-only">All squads</h2>
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {squads.map((squad) => (
            <li key={squad.slug}>
              <SquadCard squad={squad} />
            </li>
          ))}
        </ul>
      </Container>
      <CtaBand />
    </>
  );
}
