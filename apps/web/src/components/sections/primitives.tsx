import type { ReactNode } from 'react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12', className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-3 font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase before:h-px before:w-6 before:shrink-0 before:bg-current before:content-['']">
      {children}
    </p>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  tone = 'default',
  centered,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** `formal`: lighter, formal style used on the Government page (FRONTEND.md). */
  tone?: 'default' | 'surface' | 'formal';
  centered?: boolean;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={cn(
        'py-16 md:py-24',
        tone === 'surface' && 'bg-surface',
        tone === 'formal' && 'formal bg-[#f5f3ef] text-[#141414]',
        className,
      )}
    >
      <Container>
        {(eyebrow || title) && (
          <div
            className={cn('mb-10 max-w-2xl space-y-3 md:mb-14', centered && 'mx-auto text-center')}
          >
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && (
              <h2 id={headingId} className="text-fluid-h2 font-bold uppercase">
                {title}
              </h2>
            )}
            {description && (
              <p
                className={cn(
                  'text-base md:text-lg',
                  tone === 'formal' ? 'text-[#4a4a4a]' : 'text-muted-foreground',
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}

/** Top of inner pages (clears the fixed navbar). */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden pt-32 pb-14 md:pt-40 md:pb-20">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 aspect-square w-[min(900px,140vw)] -translate-x-1/2 bg-[radial-gradient(circle,rgb(255_106_0/0.22),transparent_60%)]"
        aria-hidden="true"
      />
      <Container className="relative max-w-4xl space-y-5 text-center">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-fluid-h1 font-bold uppercase">{title}</h1>
        {description && (
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{description}</p>
        )}
        {children}
      </Container>
    </header>
  );
}

/** Chamfered card with the orange edge. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'chamfer edge-glow bg-card p-6 transition-[transform,box-shadow] duration-300 ease-brand hover:-translate-y-1 hover:shadow-[0_0_28px_rgb(255_106_0/0.18)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function IconBadge({ name, formal }: { name?: string; formal?: boolean }) {
  return (
    <span
      className={cn(
        'chamfer-sm grid size-11 place-items-center',
        formal
          ? 'bg-[#141414] text-primary'
          : 'bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgb(255_106_0/0.35)]',
      )}
    >
      <Icon name={name} className="size-5" />
    </span>
  );
}

type Feature = { title: string; description: string; icon?: string };

export function FeatureGrid({
  items,
  columns = 3,
  formal,
}: {
  items: readonly Feature[];
  columns?: 2 | 3 | 4;
  formal?: boolean;
}) {
  return (
    <ul
      className={cn(
        'grid gap-5 sm:grid-cols-2',
        columns === 3 && 'lg:grid-cols-3',
        columns === 4 && 'lg:grid-cols-4',
      )}
    >
      {items.map((item) => (
        <li key={item.title}>
          {formal ? (
            <div className="h-full border border-[#d9d4cc] bg-white p-6">
              <IconBadge name={item.icon} formal />
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[#4a4a4a]">{item.description}</p>
            </div>
          ) : (
            <Card className="h-full">
              <IconBadge name={item.icon} />
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </Card>
          )}
        </li>
      ))}
    </ul>
  );
}
