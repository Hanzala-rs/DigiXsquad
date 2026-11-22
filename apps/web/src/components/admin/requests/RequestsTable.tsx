'use client';

import type { HireRequestPage, HireRequestSummary } from '@digixsquad/api-client';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { engagementModeOptions, labelOf } from '@/content/labels';
import { formatDate, timeAgo } from '@/lib/admin/format';
import { cn } from '@/lib/utils';
import { EmptyState, Pagination, Skeleton, StatusBadge } from '../ui';

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
  const [sorting, setSorting] = useState<SortingState>([]);
  // TanStack Table returns non-memoizable functions; the React compiler just skips this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!data) return <Skeleton className="chamfer h-96" />;
  if (data.items.length === 0)
    return (
      <div className="chamfer bg-card">
        <EmptyState title="No requests match">Try another search or clear the filters.</EmptyState>
      </div>
    );

  return (
    <div className={cn('transition-opacity', loading && 'opacity-60')}>
      <div className="chamfer overflow-x-auto bg-card shadow-[inset_0_0_0_1px_var(--border)]">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Hire requests (column headers sort the current page)
          </caption>
          <thead className="border-b border-border text-xs tracking-wider text-muted-foreground uppercase">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const dir = h.column.getIsSorted();
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={
                        dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'
                      }
                      className="px-4 py-3 font-medium"
                    >
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {dir === 'asc' ? (
                          <ArrowUp className="size-3" aria-hidden="true" />
                        ) : dir === 'desc' ? (
                          <ArrowDown className="size-3" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-accent/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={data.meta.page}
        pageSize={data.meta.page_size}
        total={data.meta.total}
        onPage={onPage}
      />
    </div>
  );
}
