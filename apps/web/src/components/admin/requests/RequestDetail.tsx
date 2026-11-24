'use client';

import type { HireRequestDetail } from '@digixsquad/api-client';
import { ApiError } from '@digixsquad/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Loader2, Mail, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  budgetRangeOptions,
  contractTypeOptions,
  engagementModeOptions,
  labelOf,
  procurementModeOptions,
  requestTypeOptions,
  seniorityOptions,
} from '@/content/labels';
import { Checkbox, Select, Textarea } from '@/components/forms/fields';
import { Button } from '@/components/ui/button';
import { adminApi, qk } from '@/lib/admin/api';
import { formatDate, formatDateTime, STATUS_ORDER, statusLabel, timeAgo } from '@/lib/admin/format';
import { formatBytes } from '@/lib/uploads';
import { isRealPhone, telHref } from '@/lib/placeholders';
import { whatsappLink } from '@/lib/whatsapp';
import { useCan } from '../AdminSession';
import { BackLink, Def, ErrorState, Panel, Skeleton, StatusBadge } from '../ui';
import { MatchesPanel } from './MatchesPanel';

/** Shared: after any mutation, refresh this request + lists + dashboard. */
function useRefresh(id: string) {
  const qc = useQueryClient();
  return (data?: HireRequestDetail) => {
    if (data) qc.setQueryData(qk.request(id), data);
    void qc.invalidateQueries({ queryKey: qk.request(id) });
    void qc.invalidateQueries({ queryKey: qk.requestsAll });
    void qc.invalidateQueries({ queryKey: qk.stats });
  };
}

function StatusForm({ request }: { request: HireRequestDetail }) {
  const refresh = useRefresh(request.id);
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(false);
  const m = useMutation({
    mutationFn: () =>
      adminApi.updateStatus(request.id, {
        status,
        note: note.trim() || undefined,
        notify_client: notify,
      }),
    onSuccess: (data) => {
      setNote('');
      setNotify(false);
      refresh(data);
    },
  });
  const changed = status !== request.status || note.trim().length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (changed) m.mutate();
      }}
      className="space-y-3"
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium">Status</span>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </Select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">
          Note <span className="text-muted-foreground">(optional)</span>
        </span>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          className="min-h-20"
        />
      </label>
      <Checkbox
        id="notify-client"
        label="Email the client about this status change"
        checked={notify}
        onChange={(e) => setNotify(e.target.checked)}
        disabled={status === request.status}
      />
      {m.isError && <ErrorState error={m.error} />}
      <Button type="submit" size="sm" disabled={!changed || m.isPending}>
        {m.isPending && <Loader2 className="animate-spin" aria-hidden="true" />} Update
      </Button>
    </form>
  );
}

function AssignForm({ request }: { request: HireRequestDetail }) {
  const refresh = useRefresh(request.id);
  const users = useQuery({ queryKey: qk.users, queryFn: adminApi.users, staleTime: 5 * 60_000 });
  const m = useMutation({
    mutationFn: (userId: string | null) => adminApi.assign(request.id, userId),
    onSuccess: refresh,
  });
  return (
    <div className="space-y-2">
      <label htmlFor="assignee" className="block text-sm font-medium">
        Owner
      </label>
      <Select
        id="assignee"
        value={request.assigned_to?.id ?? ''}
        disabled={!users.data || m.isPending}
        onChange={(e) => m.mutate(e.target.value || null)}
      >
        <option value="">Unassigned</option>
        {users.data
          ?.filter((u) => u.is_active && u.role !== 'OPS')
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
      </Select>
      {(m.isError || users.isError) && <ErrorState error={m.error ?? users.error} />}
    </div>
  );
}

function Timeline({ request }: { request: HireRequestDetail }) {
  const canWrite = useCan('requests.write');
  const refresh = useRefresh(request.id);
  const [note, setNote] = useState('');
  const m = useMutation({
    mutationFn: () => adminApi.addNote(request.id, note.trim()),
    onSuccess: () => {
      setNote('');
      refresh();
    },
  });
  const items = [...request.activities].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <Panel title="Activity">
      {canWrite && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (note.trim()) m.mutate();
          }}
          className="mb-5 space-y-2"
        >
          <label htmlFor="new-note" className="sr-only">
            Add a note
          </label>
          <Textarea
            id="new-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note: call summary, next steps…"
            maxLength={5000}
            className="min-h-20"
          />
          {m.isError && <ErrorState error={m.error} />}
          <Button type="submit" size="sm" variant="ghost" disabled={!note.trim() || m.isPending}>
            {m.isPending && <Loader2 className="animate-spin" aria-hidden="true" />} Add note
          </Button>
        </form>
      )}
      <ol className="space-y-4 border-l border-border pl-5">
        {items.map((a) => (
          <li key={a.id} className="relative">
            <span
              aria-hidden="true"
              className={`absolute top-1.5 -left-[25px] size-2 ${a.type === 'NOTE' ? 'bg-primary' : 'bg-accent'}`}
            />
            <p
              className={
                a.type === 'NOTE' ? 'whitespace-pre-line' : 'text-sm text-muted-foreground'
              }
            >
              {a.body}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {a.user?.name ?? 'System'} ·{' '}
              <time dateTime={a.created_at} title={formatDateTime(a.created_at)}>
                {timeAgo(a.created_at)}
              </time>
            </p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function Attachments({ request }: { request: HireRequestDetail }) {
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState<string | null>(null);
  if (request.attachments.length === 0) return null;
  async function open(id: string) {
    setBusy(id);
    setError(null);
    try {
      const { url } = await adminApi.attachmentUrl(id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }
  return (
    <Panel title="Attachments">
      <ul className="space-y-2">
        {request.attachments.map((f) => (
          <li key={f.id} className="flex items-center gap-3 text-sm">
            <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="flex-1 truncate">{f.file_name}</span>
            <span className="text-muted-foreground">{formatBytes(f.size_bytes)}</span>
            <button
              type="button"
              onClick={() => open(f.id)}
              disabled={busy === f.id}
              className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
            >
              {busy === f.id ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-3.5" aria-hidden="true" />
              )}
              Open<span className="sr-only"> {f.file_name}</span>
            </button>
          </li>
        ))}
      </ul>
      {error != null && (
        <div className="mt-3">
          <ErrorState error={error} />
        </div>
      )}
    </Panel>
  );
}

function ClientCard({ request }: { request: HireRequestDetail }) {
  const { organization: o, contact: c } = request;
  const wa = whatsappLink(
    c.whatsapp ?? c.phone,
    `Hi ${c.name}, this is DigixSquad about your request ${request.ref_no}.`,
  );
  return (
    <Panel title="Client">
      <p className="text-lg font-semibold">{o.name}</p>
      <p className="text-sm text-muted-foreground">
        {[o.department_or_industry, o.city].filter(Boolean).join(' · ')}
      </p>
      <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
        <Def k="NTN" v={o.ntn} />
        <Def k="Website" v={o.website} />
        <Def k="Contact" v={[c.name, c.designation].filter(Boolean).join(', ')} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="ghost">
          <a
            href={`mailto:${c.email}?subject=${encodeURIComponent(`Your DigixSquad request ${request.ref_no}`)}`}
          >
            <Mail aria-hidden="true" /> {c.email}
          </a>
        </Button>
        {isRealPhone(c.phone) && (
          <Button asChild size="sm" variant="ghost">
            <a href={telHref(c.phone)}>
              <Phone aria-hidden="true" /> {c.phone}
            </a>
          </Button>
        )}
        {wa && (
          <Button asChild size="sm" variant="ghost">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden="true" /> Open chat
            </a>
          </Button>
        )}
      </div>
    </Panel>
  );
}

export function RequestDetail({ id }: { id: string }) {
  const canWrite = useCan('requests.write');
  const canAssign = useCan('requests.assign');
  const canMatch = useCan('matches.read');
  const q = useQuery({ queryKey: qk.request(id), queryFn: () => adminApi.getRequest(id) });

  if (q.isError) {
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return notFound ? (
      <div className="space-y-4">
        <p className="text-lg font-semibold">Request not found.</p>
        <Link href="/admin/requests" className="text-primary hover:underline">
          Back to requests
        </Link>
      </div>
    ) : (
      <ErrorState error={q.error} onRetry={() => q.refetch()} />
    );
  }
  if (!q.data) return <Skeleton className="chamfer h-[600px]" />;
  const r = q.data;

  return (
    <>
      <BackLink href="/admin/requests">Requests</BackLink>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-heading text-sm font-semibold tracking-[0.2em] text-primary uppercase">
            {r.ref_no}
          </p>
          <h1 className="mt-1 text-2xl font-bold uppercase md:text-3xl">{r.org_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {r.org_type === 'GOVT' ? 'Government' : 'Private'} · received{' '}
            {formatDateTime(r.created_at)}
          </p>
        </div>
        <StatusBadge status={r.status} className="text-xs" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Panel title="Request">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
              <Def k="Type" v={labelOf(requestTypeOptions, r.request_type)} />
              <Def k="Squad" v={r.squad_name} />
              <Def
                k="Duration"
                v={`${r.duration_months} month${r.duration_months === 1 ? '' : 's'} from ${formatDate(r.start_date)}`}
              />
              <Def
                k="Work mode"
                v={[labelOf(engagementModeOptions, r.engagement_mode), r.city]
                  .filter(Boolean)
                  .join(' · ')}
              />
              <Def k="Contract" v={labelOf(contractTypeOptions, r.contract_type)} />
              <Def
                k="Budget"
                v={r.budget_range ? labelOf(budgetRangeOptions, r.budget_range) : 'Not specified'}
              />
              {r.org_type === 'GOVT' && (
                <Def
                  k="Procurement"
                  v={r.procurement_mode ? labelOf(procurementModeOptions, r.procurement_mode) : '—'}
                />
              )}
              <Def k="Tender ref" v={r.tender_ref} />
            </dl>
            <h3 className="mt-6 mb-2 font-heading text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Roles ({r.total_headcount} people)
            </h3>
            <ul className="divide-y divide-border">
              {r.items.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
                >
                  <span>
                    <strong className="tabular-nums">{it.quantity}×</strong> {it.role.title}
                    {it.skills_note && (
                      <span className="text-muted-foreground"> · {it.skills_note}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {labelOf(seniorityOptions, it.seniority)}
                  </span>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 mb-2 font-heading text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Description
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed">{r.description}</p>
          </Panel>

          {canMatch && <MatchesPanel request={r} />}
          <Timeline request={r} />
        </div>

        <div className="space-y-6">
          {(canWrite || canAssign) && (
            <Panel title="Manage">
              <div className="space-y-6">
                {canWrite && <StatusForm key={`${r.status}`} request={r} />}
                {canAssign && <AssignForm request={r} />}
              </div>
            </Panel>
          )}
          {!canAssign && (
            <Panel title="Owner">
              <p className="text-sm">{r.assigned_to?.name ?? 'Unassigned'}</p>
            </Panel>
          )}
          <ClientCard request={r} />
          <Attachments request={r} />
        </div>
      </div>
    </>
  );
}
