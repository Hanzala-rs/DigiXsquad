'use client';

import type { RequestStatus } from '@digixsquad/api-client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BellRing,
  Briefcase,
  CircleDollarSign,
  Inbox,
  Layers,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { adminApi, qk } from '@/lib/admin/api';
import { formatPKR, STATUS_ORDER, statusLabel, timeAgo } from '@/lib/admin/format';
import { useAdminUser } from './AdminSession';
import { EmptyState, ErrorState, PageHeader, Panel, Skeleton, StatusBadge } from './ui';

function Kpi({
  label,
  value,
  icon: Icon,
  href,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof Inbox;
  href?: string;
  tone?: 'alert';
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon
          className={tone === 'alert' ? 'size-4 text-amber-300' : 'size-4 text-primary'}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums">{value}</p>
    </>
  );
  const cls =
    'chamfer block bg-card p-5 shadow-[inset_0_0_0_1px_var(--border)] transition-shadow hover:shadow-[inset_0_0_0_1px_rgb(255_106_0/0.5)]';
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Dashboard() {
  const user = useAdminUser();
  const stats = useQuery({ queryKey: qk.stats, queryFn: adminApi.stats });
  const recent = useQuery({
    queryKey: qk.requests({ page: 1, page_size: 5 }),
    queryFn: () => adminApi.listRequests({ page: 1, page_size: 5 }),
  });

  const by = stats.data?.requests_by_status ?? {};
  const total = Object.values(by).reduce((n, v) => n + v, 0);

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${user.name.split(' ')[0]}.`} />

      {stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.data ? (
            <>
              <Kpi
                label="New requests"
                value={stats.data.new_requests}
                icon={Inbox}
                href="/admin/requests?status=NEW"
              />
              <Kpi
                label="Open pipeline"
                value={stats.data.open_pipeline}
                icon={Layers}
                href="/admin/requests"
              />
              <Kpi
                label="Active engagements"
                value={stats.data.active_engagements}
                icon={Briefcase}
              />
              <Kpi label="Available talent" value={stats.data.available_talent} icon={Users} />
              <Kpi
                label="Renewals due in 30 days"
                value={stats.data.renewals_due_30d}
                icon={BellRing}
                tone={stats.data.renewals_due_30d > 0 ? 'alert' : undefined}
              />
              <Kpi
                label="Monthly recurring revenue"
                value={formatPKR(stats.data.monthly_recurring_revenue)}
                icon={CircleDollarSign}
              />
            </>
          ) : (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="chamfer h-[106px]" />)
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Panel title="Pipeline by status">
          {stats.data ? (
            total === 0 ? (
              <EmptyState title="No requests yet" />
            ) : (
              <ul className="space-y-3">
                {STATUS_ORDER.map((s: RequestStatus) => {
                  const n = by[s] ?? 0;
                  return (
                    <li key={s}>
                      <Link href={`/admin/requests?status=${s}`} className="group block">
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="group-hover:text-foreground">{statusLabel[s]}</span>
                          <span className="tabular-nums text-muted-foreground">{n}</span>
                        </div>
                        <div className="h-1.5 bg-accent">
                          <div
                            className="h-full bg-[linear-gradient(90deg,var(--deep),var(--glow))]"
                            style={{ width: `${(n / total) * 100}%` }}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )
          ) : (
            <Skeleton className="h-56" />
          )}
        </Panel>

        <Panel
          title="Latest requests"
          actions={
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              All requests <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        >
          {recent.isError ? (
            <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
          ) : !recent.data ? (
            <Skeleton className="h-56" />
          ) : recent.data.items.length === 0 ? (
            <EmptyState title="No requests yet" />
          ) : (
            <ul className="divide-y divide-border">
              {recent.data.items.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="flex items-center gap-4 py-3 hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.org_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.ref_no} · {r.squad_name ?? `${r.total_headcount} people`} ·{' '}
                        {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
