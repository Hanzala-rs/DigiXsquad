import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CtaBand, RoleCard } from '@/components/sections/blocks';
import { Card, IconBadge, PageHeader, Section } from '@/components/sections/primitives';
import { Button } from '@/components/ui/button';
import { getSquad, getSquads } from '@/lib/catalog';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const squads = await getSquads();
  return squads.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const squad = await getSquad((await params).slug);
  if (!squad) return {};
  return {
    title: squad.name,
    description: squad.tagline,
    alternates: { canonical: `/squads/${squad.slug}` },
  };
}

export default async function SquadPage({ params }: Props) {
  const squad = await getSquad((await params).slug);
  if (!squad) notFound();
  const size = squad.roles.reduce((n, r) => n + r.default_qty, 0);

  return (
    <>
      <PageHeader eyebrow="Squad" title={squad.name} description={squad.tagline}>
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <Button asChild>
            <Link href={`/hire?squad=${encodeURIComponent(squad.slug)}`}>Request this squad</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/squads">All squads</Link>
          </Button>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <IconBadge name={squad.icon} />
            <h2 className="text-2xl font-bold uppercase">What this squad does</h2>
            <p className="text-lg text-muted-foreground">{squad.description}</p>
          </div>
          <Card>
            <h2 className="font-heading text-sm font-semibold tracking-[0.2em] uppercase">
              Use cases
            </h2>
            <ul className="mt-4 space-y-3">
              {squad.use_cases.map((u) => (
                <li key={u} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 bg-primary" aria-hidden="true" />
                  {u}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section
        tone="surface"
        eyebrow="Default line-up"
        title={`${size} people, one monthly fee`}
        description="This is the starting team. Add, remove or change seniority for any role in your request."
      >
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {squad.roles.map(({ role, default_qty }) => (
            <li key={role.slug} className="relative">
              {default_qty > 1 && (
                <span className="chamfer-sm absolute top-4 right-4 z-10 bg-primary px-2 py-0.5 font-heading text-xs font-bold text-primary-foreground">
                  ×{default_qty}
                </span>
              )}
              <RoleCard role={role} />
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand />
    </>
  );
}
