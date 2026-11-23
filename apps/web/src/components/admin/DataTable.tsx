'use client';

import type { PageMeta } from '@digixsquad/api-client';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState, Pagination, Skeleton } from './ui';

/** Paginated admin table: column headers sort the current page; pages come from the API. */
export function DataTable<T>({
  data,
  columns,
  caption,
  loading,
  onPage,
  emptyTitle,
}: {
  data?: { items: T[]; meta: PageMeta };
  // Column value types differ per column, so the defs can't share one value type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  caption: string;
  loading: boolean;
  onPage: (page: number) => void;
  emptyTitle: string;
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
        <EmptyState title={emptyTitle}>Try another search or clear the filters.</EmptyState>
      </div>
    );

  const sortIcon = (dir: false | 'asc' | 'desc'): ReactNode =>
    dir === 'asc' ? (
      <ArrowUp className="size-3" aria-hidden="true" />
    ) : dir === 'desc' ? (
      <ArrowDown className="size-3" aria-hidden="true" />
    ) : (
      <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
    );

  return (
    <div className={cn('transition-opacity', loading && 'opacity-60')}>
      <div className="chamfer overflow-x-auto bg-card shadow-[inset_0_0_0_1px_var(--border)]">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption} (column headers sort the current page)</caption>
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
                        {sortIcon(dir)}
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
