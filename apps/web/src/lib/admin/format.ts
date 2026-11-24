import type { Availability, EngagementStatus, RequestStatus } from '@digixsquad/api-client';

export const formatDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-GB', {
    dateStyle: 'medium',
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

/** "3 days ago" style, for timelines and tables. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60 * 60 * 24 * 365, 'year'],
    [60 * 60 * 24 * 30, 'month'],
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [size, unit] of units) if (s >= size) return rtf.format(-Math.floor(s / size), unit);
  return 'just now';
}

export const formatPKR = (n: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n);

export const daysUntil = (date: string, now = Date.now()) =>
  Math.ceil((new Date(`${date}T00:00:00`).getTime() - now) / 86_400_000);

/** Pipeline order (kanban columns, status pickers). */
export const STATUS_ORDER: RequestStatus[] = [
  'NEW',
  'CONTACTED',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'WON',
  'LOST',
  'ON_HOLD',
];

/** Badge colours shared by every status-like badge in admin. */
export const tone = {
  orange: 'bg-primary/15 text-glow shadow-[inset_0_0_0_1px_rgb(255_106_0/0.45)]',
  sky: 'bg-sky-500/15 text-sky-300 shadow-[inset_0_0_0_1px_rgb(56_189_248/0.35)]',
  violet: 'bg-violet-500/15 text-violet-300 shadow-[inset_0_0_0_1px_rgb(167_139_250/0.35)]',
  amber: 'bg-amber-500/15 text-amber-300 shadow-[inset_0_0_0_1px_rgb(251_191_36/0.35)]',
  green: 'bg-emerald-500/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgb(52_211_153/0.35)]',
  red: 'bg-red-500/15 text-red-300 shadow-[inset_0_0_0_1px_rgb(248_113_113/0.35)]',
  grey: 'bg-neutral-500/15 text-neutral-300 shadow-[inset_0_0_0_1px_rgb(163_163_163/0.3)]',
} as const;

export const statusTone: Record<RequestStatus, string> = {
  NEW: tone.orange,
  CONTACTED: tone.sky,
  PROPOSAL_SENT: tone.violet,
  NEGOTIATION: tone.amber,
  WON: tone.green,
  LOST: tone.grey,
  ON_HOLD: tone.grey,
};

export const availabilityBadge: Record<Availability, { label: string; tone: string }> = {
  AVAILABLE: { label: 'Available', tone: tone.green },
  ON_ENGAGEMENT: { label: 'On engagement', tone: tone.sky },
  NOTICE_PERIOD: { label: 'Notice period', tone: tone.amber },
  INACTIVE: { label: 'Inactive', tone: tone.grey },
};

export const engagementBadge: Record<EngagementStatus, { label: string; tone: string }> = {
  ACTIVE: { label: 'Active', tone: tone.green },
  COMPLETED: { label: 'Completed', tone: tone.grey },
  TERMINATED: { label: 'Terminated', tone: tone.red },
};

/** Renewal alert window used by the engagements list and dashboard. */
export const RENEWAL_DAYS = 30;

/** Admin-facing status names (the public /track labels are friendlier). */
export const statusLabel: Record<RequestStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  PROPOSAL_SENT: 'Proposal sent',
  NEGOTIATION: 'Negotiation',
  WON: 'Won',
  LOST: 'Lost',
  ON_HOLD: 'On hold',
};

export function downloadText(filename: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
