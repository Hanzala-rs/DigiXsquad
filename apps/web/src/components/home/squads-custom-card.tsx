import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { homeSections } from '@/content/home';

const copy = homeSections.squads.custom;

/**
 * Last cell of the home squads grid: "build your own squad". Same chamfered frame as the squad
 * cards but filled with an orange wash, so the grid closes as an even 3×2 block on desktop.
 */
export function SquadsCustomCard() {
  return (
    <div className="group h-full transition-[transform,filter] duration-300 ease-brand focus-within:-translate-y-1.5 focus-within:drop-shadow-[0_0_22px_rgb(255_106_0/0.45)] hover:-translate-y-1.5 hover:drop-shadow-[0_0_22px_rgb(255_106_0/0.45)]">
      <article className="chamfer edge-glow relative isolate flex h-full flex-col overflow-hidden bg-[linear-gradient(150deg,rgb(255_106_0/0.22),rgb(232_68_15/0.08)_45%,var(--card)_80%)] p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 -z-10 size-48 rounded-full bg-[radial-gradient(circle,rgb(255_154_31/0.35),transparent_65%)] transition-transform duration-500 group-hover:scale-125"
        />

        <div className="flex items-start justify-between gap-4">
          <span className="chamfer-sm grid size-12 place-items-center bg-primary text-primary-foreground shadow-[0_0_18px_rgb(255_106_0/0.45)]">
            <Plus
              className="size-6 transition-transform duration-300 group-hover:rotate-90"
              aria-hidden="true"
            />
          </span>
          <span className="font-heading text-xs font-semibold tracking-[0.3em] text-glow uppercase">
            {copy.eyebrow}
          </span>
        </div>

        <h3 className="mt-5 text-xl leading-tight font-semibold">{copy.title}</h3>
        <p className="mt-2 flex-1 text-sm text-foreground/80">{copy.description}</p>

        <ol className="mt-5 flex flex-wrap gap-1.5">
          {copy.steps.map((step, i) => (
            <li
              key={step}
              className="chamfer-sm bg-background/50 px-2.5 py-1 text-xs text-foreground/90"
            >
              <span className="mr-1 text-primary" aria-hidden="true">
                {i + 1}.
              </span>
              {step}
            </li>
          ))}
        </ol>

        <Link
          href={copy.href}
          className="mt-6 inline-flex items-center gap-2 self-start font-heading text-sm font-semibold tracking-[0.1em] text-glow uppercase after:absolute after:inset-0 after:content-[''] hover:text-foreground"
        >
          {copy.cta}
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </article>
    </div>
  );
}
