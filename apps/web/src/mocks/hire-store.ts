import type { RequestStatus } from '@digixsquad/api-client';

/** In-memory hire requests for MSW (dev + tests). Resets on reload. */
type Stored = {
  ref_no: string;
  email: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  timeline: { status: RequestStatus; at: string }[];
};

const year = new Date().getFullYear();
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

/** Demo request so /track works out of the box in dev:mock. */
export const DEMO_REQUEST = { ref: `DS-${year}-0001`, email: 'demo@example.com' } as const;

let seq = 1;
const store = new Map<string, Stored>();

function seedDemo() {
  store.clear();
  seq = 1;
  store.set(DEMO_REQUEST.ref, {
    ref_no: DEMO_REQUEST.ref,
    email: DEMO_REQUEST.email,
    status: 'PROPOSAL_SENT',
    created_at: iso(6),
    updated_at: iso(1),
    timeline: [
      { status: 'NEW', at: iso(6) },
      { status: 'CONTACTED', at: iso(5) },
      { status: 'PROPOSAL_SENT', at: iso(1) },
    ],
  });
}
seedDemo();

export const hireStore = {
  create(email: string): Stored {
    seq += 1;
    const now = new Date().toISOString();
    const ref_no = `DS-${year}-${String(seq).padStart(4, '0')}`;
    const row: Stored = {
      ref_no,
      email: email.toLowerCase(),
      status: 'NEW',
      created_at: now,
      updated_at: now,
      timeline: [{ status: 'NEW', at: now }],
    };
    store.set(ref_no, row);
    return row;
  },
  find(ref: string, email: string): Stored | undefined {
    const row = store.get(ref.toUpperCase());
    return row && row.email === email.toLowerCase() ? row : undefined;
  },
  reset: seedDemo,
};
