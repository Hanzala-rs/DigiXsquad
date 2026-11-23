'use client';

import type { HireRequestDetail } from '@digixsquad/api-client';
import { ApiError } from '@digixsquad/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { describedBy, Field, Input } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { labelOf, seniorityOptions } from '@/content/labels';
import { adminApi, qk } from '@/lib/admin/api';
import { formatDate, formatPKR } from '@/lib/admin/format';
import { cn } from '@/lib/utils';
import { useCan } from '../AdminSession';
import { EmptyState, ErrorState, Panel, Skeleton } from '../ui';

const TOP = 5;

/** End date for an N-month engagement starting on `start` (inclusive). */
export function endDateFor(start: string, months: number): string {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function MatchesPanel({ request }: { request: HireRequestDetail }) {
  const canConvert = useCan('engagements.convert');
  const canSeeCost = useCan('talents.cost');
  const qc = useQueryClient();
  const converted = !!request.engagement_id;
  const matches = useQuery({
    queryKey: qk.matches(request.id),
    queryFn: () => adminApi.matches(request.id),
    enabled: !converted,
  });

  // item_id -> selected talent ids
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [start, setStart] = useState(request.start_date);
  const [end, setEnd] = useState(endDateFor(request.start_date, request.duration_months));
  const [fee, setFee] = useState('');

  const convert = useMutation({
    mutationFn: () =>
      adminApi.convert(request.id, {
        start_date: start,
        end_date: end,
        monthly_fee: Number(fee),
        currency: 'PKR',
        assignments: request.items.flatMap((it) =>
          (picked[it.id] ?? []).map((talent_id) => ({ talent_id, role_slug: it.role.slug })),
        ),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.request(request.id) });
      void qc.invalidateQueries({ queryKey: qk.requestsAll });
      void qc.invalidateQueries({ queryKey: qk.stats });
    },
  });

  if (converted || convert.isSuccess) {
    return (
      <Panel title="Engagement">
        <p className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 text-emerald-300" aria-hidden="true" />
          Converted to an engagement
          {convert.data &&
            ` (${formatDate(convert.data.start_date)} – ${formatDate(convert.data.end_date)})`}
          .
        </p>
      </Panel>
    );
  }

  const toggle = (itemId: string, talentId: string, max: number) =>
    setPicked((p) => {
      const cur = p[itemId] ?? [];
      if (cur.includes(talentId)) return { ...p, [itemId]: cur.filter((t) => t !== talentId) };
      if (cur.length >= max) return p;
      return { ...p, [itemId]: [...cur, talentId] };
    });

  const selectedCount = Object.values(picked).reduce((n, v) => n + v.length, 0);
  const feeNum = Number(fee);
  const formError =
    selectedCount === 0
      ? 'Pick at least one talent.'
      : !fee || !Number.isFinite(feeNum) || feeNum < 0
        ? 'Enter the monthly fee.'
        : end < start
          ? 'End date must be after the start date.'
          : null;
  const convertError =
    convert.error instanceof ApiError && convert.error.status === 409
      ? 'This request was already converted, or a selected talent is no longer available. Refresh the matches.'
      : convert.error;

  return (
    <Panel title="Talent matches">
      {matches.isError ? (
        <ErrorState error={matches.error} onRetry={() => matches.refetch()} />
      ) : !matches.data ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="space-y-6">
          {matches.data.map((m) => {
            const item = request.items.find((i) => i.id === m.item_id);
            const chosen = picked[m.item_id] ?? [];
            return (
              <fieldset key={m.item_id}>
                <legend className="mb-2 flex w-full flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold">
                    {item?.role.title ?? m.role_slug} · need {m.quantity}
                    {item && (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        · {labelOf(seniorityOptions, item.seniority)}
                      </span>
                    )}
                  </span>
                  {canConvert && (
                    <span className="text-xs text-muted-foreground">
                      {chosen.length}/{m.quantity} selected
                    </span>
                  )}
                </legend>
                {m.candidates.length === 0 ? (
                  <EmptyState title="No available talent for this role">
                    Add talent to the bench or check back later.
                  </EmptyState>
                ) : (
                  <ul className="space-y-1.5">
                    {m.candidates.slice(0, TOP).map(({ talent, score }) => {
                      const on = chosen.includes(talent.id);
                      const full = !on && chosen.length >= m.quantity;
                      const row = (
                        <>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{talent.full_name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {labelOf(seniorityOptions, talent.seniority)} ·{' '}
                              {talent.experience_years} yrs
                              {talent.city && ` · ${talent.city}`} · {talent.skills.join(', ')}
                            </span>
                          </span>
                          {canSeeCost && talent.monthly_cost != null && (
                            <span className="hidden text-xs text-muted-foreground tabular-nums sm:block">
                              {formatPKR(talent.monthly_cost)}/mo
                            </span>
                          )}
                          <span
                            className="w-12 text-right font-heading text-sm font-semibold tabular-nums text-primary"
                            title="Match score: seniority and skills overlap"
                          >
                            {Math.round(score * 100)}%
                          </span>
                        </>
                      );
                      return (
                        <li key={talent.id}>
                          {canConvert ? (
                            <label
                              className={cn(
                                'chamfer-sm flex cursor-pointer items-center gap-3 bg-surface px-3 py-2 text-sm',
                                on
                                  ? 'shadow-[inset_0_0_0_1px_var(--primary)]'
                                  : 'shadow-[inset_0_0_0_1px_var(--border)]',
                                full && 'cursor-not-allowed opacity-50',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={on}
                                disabled={full}
                                onChange={() => toggle(m.item_id, talent.id, m.quantity)}
                                className="size-4 accent-primary"
                              />
                              {row}
                            </label>
                          ) : (
                            <div className="chamfer-sm flex items-center gap-3 bg-surface px-3 py-2 text-sm">
                              {row}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>
            );
          })}

          {canConvert && request.status !== 'LOST' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!formError) convert.mutate();
              }}
              className="border-t border-border pt-5"
            >
              <h3 className="mb-3 font-heading text-sm font-semibold tracking-[0.18em] uppercase">
                Convert to engagement
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Marks the request as won and places the selected talent on the engagement.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="eng-start" label="Start date">
                  <Input
                    id="eng-start"
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </Field>
                <Field id="eng-end" label="End date">
                  <Input
                    id="eng-end"
                    type="date"
                    value={end}
                    min={start}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </Field>
                <Field id="eng-fee" label="Monthly fee (PKR)">
                  <Input
                    id="eng-fee"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1000}
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    {...describedBy('eng-fee', undefined)}
                  />
                </Field>
              </div>
              {convert.isError && (
                <div className="mt-3">
                  <ErrorState error={convertError} />
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button type="submit" size="sm" disabled={!!formError || convert.isPending}>
                  {convert.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}{' '}
                  Convert
                </Button>
                {formError && <span className="text-sm text-muted-foreground">{formError}</span>}
              </div>
            </form>
          )}
        </div>
      )}
    </Panel>
  );
}
