'use client';

import type { HireRequestPage, RequestStatus } from '@digixsquad/api-client';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { adminApi, qk } from '@/lib/admin/api';
import { STATUS_ORDER, statusLabel, timeAgo } from '@/lib/admin/format';
import { cn } from '@/lib/utils';
import { useCan } from '../AdminSession';
import { ErrorState, Skeleton, StatusBadge } from '../ui';

/**
 * Kanban by status. Drag a card to another column (mouse), or use the card's "Move to" picker
 * (keyboard / touch). Optimistic: the card moves at once and rolls back if the API refuses.
 */
export function RequestsBoard({ data, queryKey }: { data?: HireRequestPage; queryKey: QueryKey }) {
  const canWrite = useCan('requests.write');
  const qc = useQueryClient();
  const [dragOver, setDragOver] = useState<RequestStatus | null>(null);

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
      adminApi.updateStatus(id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<HireRequestPage>(queryKey);
      qc.setQueryData<HireRequestPage>(
        queryKey,
        (old) =>
          old && { ...old, items: old.items.map((r) => (r.id === id ? { ...r, status } : r)) },
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(queryKey, ctx.prev),
    onSettled: (_d, _e, { id }) => {
      void qc.invalidateQueries({ queryKey: qk.requestsAll });
      void qc.invalidateQueries({ queryKey: qk.request(id) });
      void qc.invalidateQueries({ queryKey: qk.stats });
    },
  });

  if (!data) return <Skeleton className="chamfer h-96" />;

  return (
    <div className="space-y-4">
      {move.isError && <ErrorState error={move.error} />}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <ol className="flex min-w-max gap-4" aria-label="Requests by status">
          {STATUS_ORDER.map((status) => {
            const cards = data.items.filter((r) => r.status === status);
            return (
              <li
                key={status}
                aria-label={`${statusLabel[status]}, ${cards.length}`}
                onDragOver={(e) => {
                  if (!canWrite) return;
                  e.preventDefault();
                  setDragOver(status);
                }}
                onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const id = e.dataTransfer.getData('text/plain');
                  const card = data.items.find((r) => r.id === id);
                  if (card && card.status !== status) move.mutate({ id, status });
                }}
                className={cn(
                  'chamfer flex w-72 flex-col bg-surface p-3 transition-shadow',
                  dragOver === status && 'shadow-[inset_0_0_0_1px_var(--primary)]',
                )}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <StatusBadge status={status} />
                  <span className="text-xs tabular-nums text-muted-foreground">{cards.length}</span>
                </div>
                <ul className="flex min-h-24 flex-1 flex-col gap-2">
                  {cards.map((r) => (
                    <li
                      key={r.id}
                      draggable={canWrite}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', r.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className={cn(
                        'chamfer-sm bg-card p-3 shadow-[inset_0_0_0_1px_var(--border)]',
                        canWrite && 'cursor-grab active:cursor-grabbing',
                      )}
                    >
                      <Link href={`/admin/requests/${r.id}`} className="block hover:text-primary">
                        <p className="font-medium leading-snug">{r.org_name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.ref_no} · {r.squad_name ?? `${r.total_headcount} people`} ·{' '}
                          {r.duration_months} mo
                        </p>
                      </Link>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {r.assigned_to?.name ?? 'Unassigned'} · {timeAgo(r.created_at)}
                        </span>
                      </div>
                      {canWrite && (
                        <label className="mt-2 block">
                          <span className="sr-only">Move {r.ref_no} to</span>
                          <select
                            value={r.status}
                            onChange={(e) =>
                              move.mutate({ id: r.id, status: e.target.value as RequestStatus })
                            }
                            className="w-full bg-surface px-2 py-1 text-xs text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]"
                          >
                            {STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>
                                {s === r.status ? statusLabel[s] : `Move to ${statusLabel[s]}`}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
      {data.meta.total > data.items.length && (
        <p className="text-sm text-muted-foreground">
          Showing the newest {data.items.length} of {data.meta.total}. Use search or the table for
          older requests.
        </p>
      )}
    </div>
  );
}
