import type { Squad } from '@digixsquad/api-client';
import { ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';
import { homeSections } from '@/content/home';
import { Icon } from '@/lib/icons';

const units = homeSections.squads.units;

const MAX_CHIPS = 3;

/**
 * Home squad card: chamfered, the whole card is the link (after:absolute on the CTA),
 * lifts with an orange edge glow on hover/focus. The outer glow is a `drop-shadow` on the
 * wrapper so it follows the chamfered clip-path instead of being cut off by it.
 */
export function SquadsCard({
  squad,
  index,
  viewLabel,
}: {
  squad: Squad;
  index: number;
  viewLabel: string;
}) {
  const people = squad.roles.reduce((n, r) => n + r.default_qty, 0);
  const chips = squad.roles.slice(0, MAX_CHIPS);
  const more = squad.roles.length - chips.length;

  return (
    <div className="group h-full transition-[transform,filter] duration-300 ease-brand focus-within:-translate-y-1.5 focus-within:drop-shadow-[0_0_18px_rgb(255_106_0/0.35)] hover:-translate-y-1.5 hover:drop-shadow-[0_0_18px_rgb(255_106_0/0.35)]">
      <article className="chamfer edge-glow relative isolate flex h-full flex-col overflow-hidden bg-card p-6">
        {/* hover wash + brighter edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_0%_0%,rgb(255_106_0/0.16),transparent_60%)] opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--glow),transparent)] opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100"
        />

        <div className="flex items-start justify-between gap-4">
          <span className="chamfer-sm grid size-12 place-items-center bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgb(255_106_0/0.35)] transition-[background-color,box-shadow,color] duration-300 group-focus-within:bg-primary/20 group-focus-within:text-glow group-focus-within:shadow-[inset_0_0_0_1px_var(--glow),inset_0_0_16px_rgb(255_106_0/0.45)] group-hover:bg-primary/20 group-hover:text-glow group-hover:shadow-[inset_0_0_0_1px_var(--glow),inset_0_0_16px_rgb(255_106_0/0.45)]">
            <Icon
              name={squad.icon}
              className="size-6 transition-[filter] duration-300 group-hover:drop-shadow-[0_0_6px_rgb(255_154_31/0.9)]"
            />
          </span>
          <span
            aria-hidden="true"
            className="font-heading text-2xl font-bold text-primary/25 transition-colors duration-300 group-hover:text-primary/50"
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <h3 className="mt-5 text-xl leading-tight font-semibold">{squad.name}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{squad.tagline}</p>

        {people > 0 && (
          <p className="mt-5 inline-flex items-center gap-2 font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            <Users className="size-3.5 text-primary" aria-hidden="true" />
            {people} {units.people}
          </p>
        )}

        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={units.roles}>
            {chips.map(({ role }) => (
              <li
                key={role.slug}
                className="chamfer-sm bg-accent px-2.5 py-1 text-xs text-foreground/90"
              >
                {role.title}
              </li>
            ))}
            {more > 0 && (
              <li className="chamfer-sm bg-primary/12 px-2.5 py-1 text-xs text-primary">+{more}</li>
            )}
          </ul>
        )}

        <Link
          href={`/squads/${squad.slug}`}
          className="mt-6 inline-flex items-center gap-2 self-start font-heading text-sm font-semibold tracking-[0.1em] text-primary uppercase after:absolute after:inset-0 after:content-[''] hover:text-glow"
        >
          {viewLabel}
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
          <span className="sr-only">: {squad.name}</span>
        </Link>
      </article>
    </div>
  );
}
