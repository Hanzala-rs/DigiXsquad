import type { RequestStatus } from '@digixsquad/api-client';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { statusLabel, statusTone } from '@/lib/admin/format';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold uppercase md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('chamfer bg-card p-5 shadow-[inset_0_0_0_1px_var(--border)]', className)}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="font-heading text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  return (
    <span
      className={cn(
        'chamfer-sm inline-flex items-center px-2 py-0.5 font-heading text-[11px] font-semibold tracking-[0.08em] whitespace-nowrap uppercase',
        statusTone[status],
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Inbox className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-semibold">{title}</p>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';
  return (
    <div role="alert" className="chamfer flex items-start gap-3 bg-destructive/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#ff8a80]" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-[#ff8a80]">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-2 text-primary hover:underline">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-accent', className)} aria-hidden="true" />;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    'chamfer-sm grid size-9 place-items-center bg-surface shadow-[inset_0_0_0_1px_var(--border)] hover:text-foreground disabled:opacity-40';
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4 text-sm">
      <p className="text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="tabular-nums">
          {page} / {pages}
        </span>
        <button
          type="button"
          className={btn}
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}
