'use client';

import type { AdminListHireRequestsParams, OrgType, RequestStatus } from '@digixsquad/api-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download, Kanban, Loader2, Search, Table2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Input, Select } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { adminApi, qk } from '@/lib/admin/api';
import { downloadText, STATUS_ORDER, statusLabel } from '@/lib/admin/format';
import { cn } from '@/lib/utils';
import { useCan } from '../AdminSession';
import { ErrorState, PageHeader } from '../ui';
import { RequestsBoard } from './RequestsBoard';
import { RequestsTable } from './RequestsTable';

const PAGE_SIZE = 20;
const isStatus = (v: string | null): v is RequestStatus =>
  !!v && (STATUS_ORDER as string[]).includes(v);
const isOrg = (v: string | null): v is OrgType => v === 'GOVT' || v === 'PRIVATE';

/** Requests: filters live in the URL so views are shareable and survive reloads. */
export function RequestsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const canExport = useCan('requests.export');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<unknown>(null);

  const view = params.get('view') === 'board' ? 'board' : 'table';
  const status = isStatus(params.get('status'))
    ? (params.get('status') as RequestStatus)
    : undefined;
  const orgType = isOrg(params.get('org_type')) ? (params.get('org_type') as OrgType) : undefined;
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(q);

  const setParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  // Board shows every status as a column, so it ignores the status filter and pages.
  const query: AdminListHireRequestsParams =
    view === 'board'
      ? { page: 1, page_size: 100, q: q || undefined, org_type: orgType }
      : { page, page_size: PAGE_SIZE, q: q || undefined, status, org_type: orgType };
  const list = useQuery({
    queryKey: qk.requests(query),
    queryFn: () => adminApi.listRequests(query),
    placeholderData: keepPreviousData,
  });

  async function exportCsv() {
    setExporting(true);
    setExportError(null);
    try {
      const csv = await adminApi.exportCsv(status);
      downloadText(
        `hire-requests${status ? `-${status.toLowerCase()}` : ''}-${new Date().toISOString().slice(0, 10)}.csv`,
        csv,
      );
    } catch (e) {
      setExportError(e);
    } finally {
      setExporting(false);
    }
  }

  const toggle = (v: 'table' | 'board', label: string, Icon: typeof Table2) => (
    <button
      type="button"
      aria-pressed={view === v}
      onClick={() => setParams({ view: v === 'board' ? 'board' : undefined })}
      className={cn(
        'chamfer-sm inline-flex items-center gap-2 px-3 py-2 text-sm',
        view === v
          ? 'bg-primary text-primary-foreground'
          : 'bg-surface text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="size-4" aria-hidden="true" /> {label}
    </button>
  );

  return (
    <>
      <PageHeader
        title="Requests"
        description={
          list.data
            ? `${list.data.meta.total} matching request${list.data.meta.total === 1 ? '' : 's'}`
            : ' '
        }
        actions={
          <>
            <div role="group" aria-label="View" className="flex gap-1">
              {toggle('table', 'Table', Table2)}
              {toggle('board', 'Board', Kanban)}
            </div>
            {canExport && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={exportCsv}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download aria-hidden="true" />
                )}
                Export CSV
              </Button>
            )}
          </>
        }
      />

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ q: search.trim() || undefined });
        }}
        className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <label className="relative block">
          <span className="sr-only">Search by reference, organization or contact</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => search.trim() !== q && setParams({ q: search.trim() || undefined })}
            placeholder="Search ref, organization or contact…"
            className="pl-9"
          />
        </label>
        {view === 'table' && (
          <label>
            <span className="sr-only">Status</span>
            <Select
              value={status ?? ''}
              onChange={(e) => setParams({ status: e.target.value || undefined })}
            >
              <option value="">All statuses</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label>
          <span className="sr-only">Organization type</span>
          <Select
            value={orgType ?? ''}
            onChange={(e) => setParams({ org_type: e.target.value || undefined })}
          >
            <option value="">Govt + private</option>
            <option value="GOVT">Government</option>
            <option value="PRIVATE">Private</option>
          </Select>
        </label>
      </form>

      {exportError != null && (
        <div className="mb-4">
          <ErrorState error={exportError} />
        </div>
      )}

      {list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : view === 'board' ? (
        <RequestsBoard data={list.data} queryKey={qk.requests(query)} />
      ) : (
        <RequestsTable
          data={list.data}
          loading={list.isFetching}
          onPage={(p) => setParams({ page: p > 1 ? String(p) : undefined })}
        />
      )}
    </>
  );
}
