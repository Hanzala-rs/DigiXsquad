'use client';

import type { Engagement, EngagementStatus } from '@digixsquad/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Field, Input, Select } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { adminApi, qk } from '@/lib/admin/api';
import { engagementBadge, formatDate, formatPKR } from '@/lib/admin/format';
import { BackLink, Def, ErrorState, Panel, Skeleton } from '../ui';
import { DaysLeft } from './EngagementsView';

const STATUSES = Object.keys(engagementBadge) as EngagementStatus[];

/** `date` + `days`, as YYYY-MM-DD. */
const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const lengthInDays = (e: Engagement) =>
  Math.round((Date.parse(e.end_date) - Date.parse(e.start_date)) / 86_400_000);

/** After any change: this engagement, lists, dashboard and talents (availability may change). */
function useRefresh() {
  const qc = useQueryClient();
  return (e: Engagement) => {
    qc.setQueryData(qk.engagement(e.id), e);
    for (const queryKey of [qk.engagementsAll, qk.stats, qk.talentsAll])
      void qc.invalidateQueries({ queryKey });
  };
}

function UpdateForm({ engagement: e }: { engagement: Engagement }) {
  const refresh = useRefresh();
  const [end, setEnd] = useState(e.end_date);
  const [fee, setFee] = useState(String(e.monthly_fee));
  const [status, setStatus] = useState(e.status);
  const patch = {
    ...(end !== e.end_date && { end_date: end }),
    ...(Number(fee) !== e.monthly_fee && { monthly_fee: Number(fee) }),
    ...(status !== e.status && { status }),
  };
  const m = useMutation({
    mutationFn: () => adminApi.updateEngagement(e.id, patch),
    onSuccess: refresh,
  });

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        m.mutate();
      }}
      className="space-y-4"
    >
      <Field id="end_date" label="End date">
        <Input
          id="end_date"
          type="date"
          required
          min={e.start_date}
          value={end}
          onChange={(ev) => setEnd(ev.target.value)}
        />
      </Field>
      <Field id="monthly_fee" label="Monthly fee (PKR)">
        <Input
          id="monthly_fee"
          type="number"
          required
          min={0}
          step={1000}
          value={fee}
          onChange={(ev) => setFee(ev.target.value)}
        />
      </Field>
      <Field
        id="engagement_status"
        label="Status"
        hint={
          status !== 'ACTIVE' && e.status === 'ACTIVE'
            ? 'Ending it frees the team (Available again).'
            : undefined
        }
      >
        <Select
          id="engagement_status"
          value={status}
          onChange={(ev) => setStatus(ev.target.value as EngagementStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {engagementBadge[s].label}
            </option>
          ))}
        </Select>
      </Field>
      {m.isError && <ErrorState error={m.error} />}
      <Button type="submit" size="sm" disabled={Object.keys(patch).length === 0 || m.isPending}>
        {m.isPending && <Loader2 className="animate-spin" aria-hidden="true" />} Save
      </Button>
    </form>
  );
}

function RenewForm({ engagement: e }: { engagement: Engagement }) {
  const router = useRouter();
  const refresh = useRefresh();
  // Default: another period of the same length, same fee.
  const [end, setEnd] = useState(addDays(e.end_date, lengthInDays(e) + 1));
  const [fee, setFee] = useState(String(e.monthly_fee));
  const m = useMutation({
    mutationFn: () => adminApi.renewEngagement(e.id, { end_date: end, monthly_fee: Number(fee) }),
    onSuccess: (next) => {
      refresh({ ...e, status: 'COMPLETED' });
      refresh(next);
      router.push(`/admin/engagements/${next.id}`);
    },
  });

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        m.mutate();
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Starts {formatDate(addDays(e.end_date, 1))} with the same team. This one is marked
        completed.
      </p>
      <Field id="renew_end" label="New end date">
        <Input
          id="renew_end"
          type="date"
          required
          min={addDays(e.end_date, 1)}
          value={end}
          onChange={(ev) => setEnd(ev.target.value)}
        />
      </Field>
      <Field id="renew_fee" label="Monthly fee (PKR)">
        <Input
          id="renew_fee"
          type="number"
          required
          min={0}
          step={1000}
          value={fee}
          onChange={(ev) => setFee(ev.target.value)}
        />
      </Field>
      {m.isError && <ErrorState error={m.error} />}
      <Button type="submit" size="sm" disabled={m.isPending}>
        {m.isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCcw aria-hidden="true" />
        )}
        Renew
      </Button>
    </form>
  );
}

export function EngagementDetail({ id }: { id: string }) {
  const q = useQuery({ queryKey: qk.engagement(id), queryFn: () => adminApi.getEngagement(id) });
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return <Skeleton className="chamfer h-96" />;
  const e = q.data;

  return (
    <>
      <BackLink href="/admin/engagements">Engagements</BackLink>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-heading text-sm font-semibold tracking-[0.18em] text-primary">
            {e.ref_no}
          </p>
          <h1 className="text-2xl font-bold uppercase md:text-3xl">{e.org_name}</h1>
        </div>
        <DaysLeft engagement={e} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Panel title="Details">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
              <Def k="Period" v={`${formatDate(e.start_date)} – ${formatDate(e.end_date)}`} />
              <Def k="Monthly fee" v={formatPKR(e.monthly_fee)} />
              <Def k="Status" v={engagementBadge[e.status].label} />
              <Def
                k="Request"
                v={
                  <Link
                    href={`/admin/requests/${e.request_id}`}
                    className="text-primary hover:underline"
                  >
                    {e.ref_no}
                  </Link>
                }
              />
              {e.renewed_from_id && (
                <Def
                  k="Renewal of"
                  v={
                    <Link
                      href={`/admin/engagements/${e.renewed_from_id}`}
                      className="text-primary hover:underline"
                    >
                      Previous engagement
                    </Link>
                  }
                />
              )}
            </dl>
          </Panel>

          <Panel title={`Team (${e.assignments.length})`}>
            <ul className="divide-y divide-border">
              {e.assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/admin/talents/${a.talent.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {a.talent.full_name}
                    </Link>
                    <p className="text-muted-foreground">{a.role.title}</p>
                  </div>
                  <p className="text-muted-foreground">
                    {formatDate(a.start_date)}
                    {a.end_date ? ` – ${formatDate(a.end_date)}` : ' – now'}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-5">
          {/* key: reset the forms after this engagement changes */}
          <Panel title="Update">
            <UpdateForm key={`${e.end_date}${e.monthly_fee}${e.status}`} engagement={e} />
          </Panel>
          {e.status === 'ACTIVE' && (
            <Panel title="Renew">
              <RenewForm key={e.end_date} engagement={e} />
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
