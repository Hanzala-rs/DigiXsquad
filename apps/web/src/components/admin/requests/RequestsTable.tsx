'use client';

import type { HireRequestPage, HireRequestSummary } from '@digixsquad/api-client';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { engagementModeOptions, labelOf } from '@/content/labels';
import { formatDate, timeAgo } from '@/lib/admin/format';
import { DataTable } from '../DataTable';
import { StatusBadge } from '../ui';

const col = createColumnHelper<HireRequestSummary>();

const columns = [
  col.accessor('ref_no', {
    header: 'Ref',
    cell: (c) => (
      <Link
        href={`/admin/requests/${c.row.original.id}`}
        className="font-heading font-semibold whitespace-nowrap text-primary hover:underline"
      >
        {c.getValue()}
      </Link>
    ),
  }),
  col.accessor('org_name', {
    header: 'Organization',
    cell: (c) => (
      <div className="min-w-48">
        <p className="font-medium">{c.getValue()}</p>
        <p className="text-xs text-muted-foreground">
          {c.row.original.org_type === 'GOVT' ? 'Government' : 'Private'}
        </p>
      </div>
    ),
  }),
  col.accessor(
    (r) => r.squad_name ?? (r.request_type === 'SINGLE_ROLE' ? 'Single role' : 'Custom team'),
    {
      id: 'need',
      header: 'Need',
      cell: (c) => <span className="whitespace-nowrap">{c.getValue()}</span>,
    },
  ),
  col.accessor('total_headcount', {
    header: 'People',
    cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
  }),
  col.accessor('duration_months', {
    header: 'Months',
    cell: (c) => <span className="tabular-nums">{c.getValue()}</span>,
  }),
  col.accessor('engagement_mode', {
    header: 'Mode',
    cell: (c) => labelOf(engagementModeOptions, c.getValue()),
  }),
  col.accessor('status', { header: 'Status', cell: (c) => <StatusBadge status={c.getValue()} /> }),
  col.accessor((r) => r.assigned_to?.name ?? '', {
    id: 'assigned',
    header: 'Owner',
    cell: (c) => c.getValue() || <span className="text-muted-foreground">Unassigned</span>,
  }),
  col.accessor('created_at', {
    header: 'Received',
    cell: (c) => (
      <time
        dateTime={c.getValue()}
        title={formatDate(c.getValue())}
        className="whitespace-nowrap text-muted-foreground"
      >
        {timeAgo(c.getValue())}
      </time>
    ),
  }),
];

export function RequestsTable({
  data,
  loading,
  onPage,
}: {
  data?: HireRequestPage;
  loading: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <DataTable
      data={data}
      columns={columns}
      caption="Hire requests"
      loading={loading}
      onPage={onPage}
      emptyTitle="No requests match"
    />
  );
}
