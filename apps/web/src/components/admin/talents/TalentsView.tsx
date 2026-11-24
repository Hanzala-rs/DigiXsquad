'use client';

import type { AdminListTalentsParams, Availability, Talent } from '@digixsquad/api-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Input, Select } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { labelOf, seniorityOptions } from '@/content/labels';
import { adminApi, qk } from '@/lib/admin/api';
import { availabilityBadge, formatPKR } from '@/lib/admin/format';
import { useCan } from '../AdminSession';
import { DataTable } from '../DataTable';
import { Badge, ErrorState, PageHeader } from '../ui';
import { useUrlFilters } from '../useUrlFilters';

const AVAILABILITY = Object.keys(availabilityBadge) as Availability[];
const col = createColumnHelper<Talent>();

const columns = [
  col.accessor('full_name', {
    header: 'Name',
    cell: (c) => (
      <div className="min-w-44">
        <Link
          href={`/admin/talents/${c.row.original.id}`}
          className="font-semibold text-primary hover:underline"
        >
          {c.getValue()}
        </Link>
        <p className="text-xs text-muted-foreground">{c.row.original.email}</p>
      </div>
    ),
  }),
  col.accessor((t) => t.primary_role.title, {
    id: 'role',
    header: 'Role',
    cell: (c) => (
      <div className="whitespace-nowrap">
        {c.getValue()}
        <p className="text-xs text-muted-foreground">
          {labelOf(seniorityOptions, c.row.original.seniority)}
        </p>
      </div>
    ),
  }),
  col.accessor('experience_years', {
    header: 'Years',
    cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
  }),
  col.accessor((t) => t.skills.join(', '), {
    id: 'skills',
    header: 'Skills',
    enableSorting: false,
    cell: (c) => (
      <span className="line-clamp-1 max-w-56 text-muted-foreground">{c.getValue()}</span>
    ),
  }),
  col.accessor('availability', {
    header: 'Availability',
    cell: (c) => (
      <Badge tone={availabilityBadge[c.getValue()].tone}>
        {availabilityBadge[c.getValue()].label}
      </Badge>
    ),
  }),
  col.accessor((t) => t.monthly_cost ?? 0, {
    id: 'cost',
    header: 'Monthly cost',
    cell: (c) =>
      c.row.original.monthly_cost == null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="whitespace-nowrap tabular-nums">{formatPKR(c.getValue())}</span>
      ),
  }),
  col.accessor((t) => t.city ?? '', { id: 'city', header: 'City' }),
];

export function TalentsView() {
  const { params, set, page, setPage, oneOf } = useUrlFilters();
  const canSeeCost = useCan('talents.cost');
  const q = params.get('q') ?? '';
  const [search, setSearch] = useState(q);
  const roleSlug = params.get('role') ?? undefined;
  const availability = oneOf('availability', AVAILABILITY);

  const roles = useQuery({ queryKey: qk.roles, queryFn: adminApi.roles, staleTime: Infinity });
  const query: AdminListTalentsParams = {
    page,
    page_size: 20,
    q: q || undefined,
    role_slug: roleSlug,
    availability,
  };
  const list = useQuery({
    queryKey: qk.talents(query),
    queryFn: () => adminApi.listTalents(query),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Talents"
        description={list.data ? `${list.data.meta.total} in the bench` : ' '}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/talents/new">
              <Plus aria-hidden="true" /> Add talent
            </Link>
          </Button>
        }
      />

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: search.trim() || undefined });
        }}
        className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <label className="relative block">
          <span className="sr-only">Search by name, email, city or skill</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => search.trim() !== q && set({ q: search.trim() || undefined })}
            placeholder="Search name, email, city or skill…"
            className="pl-9"
          />
        </label>
        <label>
          <span className="sr-only">Role</span>
          <Select
            value={roleSlug ?? ''}
            onChange={(e) => set({ role: e.target.value || undefined })}
          >
            <option value="">All roles</option>
            {roles.data?.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.title}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">Availability</span>
          <Select
            value={availability ?? ''}
            onChange={(e) => set({ availability: e.target.value || undefined })}
          >
            <option value="">Any availability</option>
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>
                {availabilityBadge[a].label}
              </option>
            ))}
          </Select>
        </label>
      </form>

      {list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <DataTable
          data={list.data}
          columns={canSeeCost ? columns : columns.filter((c) => c.id !== 'cost')}
          caption="Talents"
          loading={list.isFetching}
          onPage={setPage}
          emptyTitle="No talents match"
        />
      )}
    </>
  );
}
