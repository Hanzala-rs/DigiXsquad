'use client';

import type { RoleCategory, ServiceRole } from '@digixsquad/api-client';
import { useState, type ReactNode } from 'react';
import { roleCategoryLabels, roleCategoryOrder } from '@/content/labels';
import { cn } from '@/lib/utils';

type Filter = RoleCategory | 'ALL';

/**
 * Category filter over role cards. Cards are rendered on the server and passed in by slug,
 * so this only toggles visibility (the page stays static and fully indexable).
 */
export function RolesExplorer({
  roles,
  cards,
}: {
  roles: Pick<ServiceRole, 'slug' | 'category'>[];
  cards: Record<string, ReactNode>;
}) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const present = roleCategoryOrder.filter((c) => roles.some((r) => r.category === c));
  const visible = roles.filter((r) => filter === 'ALL' || r.category === filter);
  const count = (c: Filter) =>
    c === 'ALL' ? roles.length : roles.filter((r) => r.category === c).length;

  return (
    <div>
      <div role="group" aria-label="Filter roles by category" className="mb-8 flex flex-wrap gap-2">
        {(['ALL', ...present] as Filter[]).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
            className={cn(
              'chamfer-sm px-4 py-2 font-heading text-sm font-semibold tracking-[0.06em] transition-colors',
              filter === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:text-foreground',
            )}
          >
            {c === 'ALL' ? 'All roles' : roleCategoryLabels[c]}{' '}
            <span className="opacity-80">({count(c)})</span>
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {visible.length} roles
      </p>
      <h2 className="sr-only">Roles</h2>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => (
          <li key={r.slug}>{cards[r.slug]}</li>
        ))}
      </ul>
    </div>
  );
}
