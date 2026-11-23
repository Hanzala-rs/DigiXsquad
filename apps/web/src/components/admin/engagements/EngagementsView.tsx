'use client';

import type {
  AdminListEngagementsParams,
  Engagement,
  EngagementStatus,
} from '@digixsquad/api-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { BellRing } from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/forms/fields';
import { adminApi, qk } from '@/lib/admin/api';
import {
  daysUntil,
  engagementBadge,
  formatDate,
  formatPKR,
  RENEWAL_DAYS,
  tone,
} from '@/lib/admin/format';
import { cn } from '@/lib/utils';
import { DataTable } from '../DataTable';
import { Badge, ErrorState, PageHeader } from '../ui';
import { useUrlFilters } from '../useUrlFilters';

const STATUSES = Object.keys(engagementBadge) as EngagementStatus[];

/** "12 days left" (amber inside the renewal window, red once past the end date). */
export function DaysLeft({ engagement: e }: { engagement: Engagement }) {
  if (e.status !== 'ACTIVE')
    return <Badge tone={engagementBadge[e.status].tone}>{engagementBadge[e.status].label}</Badge>;
  const days = daysUntil(e.end_date);
  const t = days < 0 ? tone.red : days <= RENEWAL_DAYS ? tone.amber : tone.green;
  return (
    <Badge tone={t}>
      {days < 0 ? `Ended ${-days}d ago` : days === 0 ? 'Ends today' : `${days}d left`}
    </Badge>
  );
}

const col = createColumnHelper<Engagement>();
const columns = [
  col.accessor('ref_no', {
    header: 'Engagement',
    cell: (c) => (
      <div className="min-w-48">
        <Link
          href={`/admin/engagements/${c.row.original.id}`}
          className="font-heading font-semibold text-primary hover:underline"
        >
          {c.getValue()}
        </Link>
        <p className="text-xs text-muted-foreground">{c.row.original.org_name}</p>
      </div>
    ),
  }),
  col.accessor((e) => e.assignments.filter((a) => !a.end_date).length, {
    id: 'team',
    header: 'People',
    cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
  }),
  col.accessor('start_date', {
    header: 'Period',
    cell: (c) => (
      <span className="whitespace-nowrap">
        {formatDate(c.getValue())} – {formatDate(c.row.original.end_date)}
      </span>
    ),
  }),
  col.accessor('end_date', {
    header: 'Ends',
    cell: (c) => <DaysLeft engagement={c.row.original} />,
  }),
  col.accessor('monthly_fee', {
    header: 'Monthly fee',
    cell: (c) => <span className="whitespace-nowrap tabular-nums">{formatPKR(c.getValue())}</span>,
  }),
];

export function EngagementsView() {
  const { set, page, setPage, oneOf, params } = useUrlFilters();
  const status = oneOf('status', STATUSES);
  const renewals = params.get('ending') === String(RENEWAL_DAYS);

  const query: AdminListEngagementsParams = {
    page,
    page_size: 20,
    status: renewals ? undefined : status,
    ending_within_days: renewals ? RENEWAL_DAYS : undefined,
  };
  const list = useQuery({
    queryKey: qk.engagements(query),
    queryFn: () => adminApi.listEngagements(query),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Engagements"
        description={
          list.data
            ? renewals
              ? `${list.data.meta.total} active engagement${list.data.meta.total === 1 ? '' : 's'} ending within ${RENEWAL_DAYS} days`
              : `${list.data.meta.total} engagement${list.data.meta.total === 1 ? '' : 's'}`
            : ' '
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-pressed={renewals}
          onClick={() =>
            set({ ending: renewals ? undefined : String(RENEWAL_DAYS), status: undefined })
          }
          className={cn(
            'chamfer-sm inline-flex items-center gap-2 px-3 py-2 text-sm',
            renewals
              ? 'bg-primary text-primary-foreground'
              : 'bg-surface text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:text-foreground',
          )}
        >
          <BellRing className="size-4" aria-hidden="true" /> Renewals due
        </button>
        {!renewals && (
          <label className="min-w-48">
            <span className="sr-only">Status</span>
            <Select
              value={status ?? ''}
              onChange={(e) => set({ status: e.target.value || undefined })}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {engagementBadge[s].label}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>

      {list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <DataTable
          data={list.data}
          columns={columns}
          caption="Engagements"
          loading={list.isFetching}
          onPage={setPage}
          emptyTitle={renewals ? 'Nothing due for renewal' : 'No engagements match'}
        />
      )}
    </>
  );
}
