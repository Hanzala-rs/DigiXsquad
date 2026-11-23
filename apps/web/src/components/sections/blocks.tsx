import type { ServiceRole, SiteContent, Squad } from '@digixsquad/api-client';
import { ArrowRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ctaBand } from '@/content/pages';
import { roleCategoryLabels } from '@/content/labels';
import { Card, Container, IconBadge } from './primitives';

export function ProcessSteps({ steps }: { steps: SiteContent['process'] }) {
  return (
    <ol className="grid gap-5 md:grid-cols-5">
      {steps.map((step, i) => (
        <li key={step.title} className="relative">
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <IconBadge name={step.icon} />
              <span aria-hidden="true" className="font-heading text-3xl font-bold text-primary/30">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="mt-5 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </Card>
        </li>
      ))}
    </ol>
  );
}

const isPlaceholder = (v: string) => /^\s*TBD\b/i.test(v);

/** Hidden until the client confirms real numbers (stats are "TBD" in the seed). */
export function StatsBand({ stats }: { stats: SiteContent['stats'] }) {
  const real = stats.filter((s) => !isPlaceholder(s.value));
  if (real.length === 0) return null;
  return (
    <section aria-label="Key numbers" className="border-y border-border bg-surface py-12">
      <Container>
        <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {real.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-muted-foreground">{s.label}</dt>
              <dd className="text-brand-gradient font-heading text-4xl font-bold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

/** No-JS accordion (details/summary). */
export function FaqList({ faqs }: { faqs: SiteContent['faqs'] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border border-y border-border">
      {faqs.map((faq) => (
        <details key={faq.question} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown
              className="size-5 shrink-0 text-primary transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="mt-3 text-muted-foreground">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="chamfer edge-glow relative overflow-hidden bg-card px-6 py-12 text-center md:px-12 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgb(255_106_0/0.28),transparent_60%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="text-fluid-h2 font-bold uppercase">{ctaBand.title}</h2>
            <p className="text-muted-foreground">{ctaBand.description}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/hire">{ctaBand.primary}</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/contact">{ctaBand.secondary}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function SquadCard({ squad }: { squad: Squad }) {
  const size = squad.roles.reduce((n, r) => n + r.default_qty, 0);
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <IconBadge name={squad.icon} />
        <span className="font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {size} people
        </span>
      </div>
      <h3 className="mt-5 text-xl font-semibold">{squad.name}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{squad.tagline}</p>
      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Roles in this squad">
        {squad.roles.map(({ role, default_qty }) => (
          <li
            key={role.slug}
            className="chamfer-sm bg-accent px-2.5 py-1 text-xs text-foreground/90"
          >
            {default_qty > 1 ? `${default_qty}× ` : ''}
            {role.title}
          </li>
        ))}
      </ul>
      <Link
        href={`/squads/${squad.slug}`}
        className="mt-6 inline-flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.1em] text-primary uppercase after:absolute after:inset-0 hover:text-glow"
      >
        View squad <ArrowRight className="size-4" aria-hidden="true" />
        <span className="sr-only">: {squad.name}</span>
      </Link>
    </Card>
  );
}

export function RoleCard({ role }: { role: ServiceRole }) {
  return (
    <Card className="flex h-full flex-col">
      <p className="font-heading text-xs font-semibold tracking-[0.2em] text-primary uppercase">
        {roleCategoryLabels[role.category]}
      </p>
      <h3 className="mt-2 text-lg font-semibold">{role.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{role.description}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
        {role.skills.map((skill) => (
          <li key={skill} className="bg-accent px-2 py-0.5 text-xs text-muted-foreground">
            {skill}
          </li>
        ))}
      </ul>
      <Link
        href={`/hire?role=${encodeURIComponent(role.slug)}`}
        className="mt-5 inline-flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.1em] text-primary uppercase hover:text-glow"
      >
        Hire this role <ArrowRight className="size-4" aria-hidden="true" />
        <span className="sr-only">: {role.title}</span>
      </Link>
    </Card>
  );
}
