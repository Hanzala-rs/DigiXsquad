import type { Metadata } from 'next';
import { RolesExplorer } from '@/components/roles/RolesExplorer';
import { CtaBand, RoleCard } from '@/components/sections/blocks';
import { Container, PageHeader } from '@/components/sections/primitives';
import { pageIntros } from '@/content/pages';
import { getRoles } from '@/lib/catalog';

const intro = pageIntros.roles;

export const metadata: Metadata = {
  title: 'Roles',
  description: intro.description,
  alternates: { canonical: '/roles' },
};

export default async function RolesPage() {
  const roles = await getRoles();
  const cards = Object.fromEntries(roles.map((r) => [r.slug, <RoleCard key={r.slug} role={r} />]));
  return (
    <>
      <PageHeader eyebrow={intro.eyebrow} title={intro.title} description={intro.description} />
      <Container>
        <RolesExplorer
          roles={roles.map(({ slug, category }) => ({ slug, category }))}
          cards={cards}
        />
      </Container>
      <CtaBand />
    </>
  );
}
