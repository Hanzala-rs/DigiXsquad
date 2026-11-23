import type {
  Activity,
  AuthUser,
  DashboardStats,
  Engagement,
  HireRequestCreate,
  HireRequestDetail,
  HireRequestSummary,
  ItemMatches,
  RequestStatus,
  Seniority,
  Talent,
  TalentInput,
  UserRole,
} from '@digixsquad/api-client';
import { roles, squads, stableUuid } from '@/lib/seed-data';

/**
 * In-memory backend for MSW (dev:mock + tests). Shared by the public hire/track handlers and the
 * admin handlers, so a request submitted on /hire shows up in /admin. Resets on reload / reset().
 */

/** Demo logins for `pnpm dev:mock` only (never valid against the real API). */
export const DEMO_PASSWORD = 'demo-password-123';
const DEMO_USERS: { name: string; email: string; role: UserRole }[] = [
  { name: 'Ayesha Admin', email: 'admin@digixsquad.test', role: 'SUPER_ADMIN' },
  { name: 'Bilal Sales', email: 'sales@digixsquad.test', role: 'SALES' },
  { name: 'Sana Ops', email: 'ops@digixsquad.test', role: 'OPS' },
];

const year = new Date().getFullYear();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addMonths = (date: string, months: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() - 1);
  return isoDate(d);
};
const roleBySlug = new Map(roles.map((r) => [r.slug, r]));

type StoredRequest = HireRequestDetail & { contact_email_lower: string };

type State = {
  users: (AuthUser & { password: string })[];
  talents: Talent[];
  requests: StoredRequest[];
  engagements: Engagement[];
  seq: number;
};

const FIRST = [
  'Ali',
  'Fatima',
  'Hamza',
  'Zainab',
  'Usman',
  'Maryam',
  'Hassan',
  'Hira',
  'Omar',
  'Amna',
  'Saad',
  'Iqra',
];
const LAST = [
  'Khan',
  'Ahmed',
  'Raza',
  'Malik',
  'Qureshi',
  'Siddiqui',
  'Butt',
  'Chaudhry',
  'Shah',
  'Iqbal',
];
const SENIORITY: Seniority[] = ['JUNIOR', 'MID', 'SENIOR', 'MID', 'LEAD'];
const CITIES = ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Peshawar'];

function buildTalents(): Talent[] {
  let n = 0;
  // Three per role, so roles used by the sample engagements still have someone AVAILABLE.
  return roles.flatMap((role, ri) =>
    [0, 1, 2].map((k) => {
      const i = n++;
      const first = FIRST[i % FIRST.length]!;
      const last = LAST[(i * 7) % LAST.length]!;
      const seniority = SENIORITY[(ri + k) % SENIORITY.length]!;
      return {
        id: stableUuid(`talent:${role.slug}:${k}`),
        full_name: `${first} ${last}`,
        email: `${first}.${last}.${i}@talent.test`.toLowerCase(),
        phone: `+92 300 ${String(1000000 + i * 7919).slice(0, 7)}`,
        primary_role: role,
        seniority,
        skills: role.skills.slice(k, k + 3),
        experience_years: { JUNIOR: 1, MID: 3, SENIOR: 6, LEAD: 9 }[seniority] + k,
        availability: i % 9 === 4 ? 'ON_ENGAGEMENT' : i % 11 === 6 ? 'NOTICE_PERIOD' : 'AVAILABLE',
        monthly_cost: 90_000 + ((i * 37_000) % 260_000),
        city: CITIES[i % CITIES.length]!,
        cv_attachment_id: null,
        is_active: true,
      } satisfies Talent;
    }),
  );
}

type Seed = {
  org: string;
  dept: string;
  govt: boolean;
  status: RequestStatus;
  squad?: string;
  items: [string, number, Seniority][];
  age: number;
  months: number;
};

const SAMPLE: Seed[] = [
  {
    org: 'Punjab IT Board',
    dept: 'e-Services Wing',
    govt: true,
    status: 'NEW',
    items: [['qa-tester', 2, 'MID']],
    age: 1,
    months: 6,
  },
  {
    org: 'Ministry of IT & Telecom',
    dept: 'Digital Pakistan Cell',
    govt: true,
    status: 'CONTACTED',
    squad: 'data-ai-squad',
    items: [],
    age: 3,
    months: 12,
  },
  {
    org: 'Kaarobar Foods',
    dept: 'Retail',
    govt: false,
    status: 'PROPOSAL_SENT',
    squad: 'digital-marketing-squad',
    items: [],
    age: 6,
    months: 3,
  },
  {
    org: 'KP Health Department',
    dept: 'MIS Section',
    govt: true,
    status: 'NEGOTIATION',
    items: [
      ['frontend-developer', 1, 'SENIOR'],
      ['backend-developer', 1, 'SENIOR'],
    ],
    age: 9,
    months: 9,
  },
  {
    org: 'Tez Logistics',
    dept: 'Logistics',
    govt: false,
    status: 'NEW',
    items: [['project-manager', 1, 'LEAD']],
    age: 0,
    months: 4,
  },
  {
    org: 'Sindh Education Foundation',
    dept: 'Monitoring & Evaluation',
    govt: true,
    status: 'ON_HOLD',
    squad: 'digital-media-squad',
    items: [],
    age: 21,
    months: 6,
  },
  {
    org: 'Bazaar Mart',
    dept: 'E-commerce',
    govt: false,
    status: 'WON',
    squad: 'development-squad',
    items: [],
    age: 40,
    months: 12,
  },
  {
    org: 'Capital Development Authority',
    dept: 'IT Directorate',
    govt: true,
    status: 'WON',
    items: [['frontend-developer', 1, 'MID']],
    age: 75,
    months: 3,
  },
  {
    org: 'Raah Fintech',
    dept: 'Fintech',
    govt: false,
    status: 'LOST',
    items: [['backend-developer', 2, 'SENIOR']],
    age: 30,
    months: 6,
  },
  {
    org: 'Pak Agri Cooperative',
    dept: 'Agriculture',
    govt: false,
    status: 'CONTACTED',
    squad: 'it-support-squad',
    items: [],
    age: 2,
    months: 12,
  },
];

const ORDER: RequestStatus[] = ['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'];

function timelineTo(
  status: RequestStatus,
  created: number,
): { status: RequestStatus; at: string }[] {
  if (status === 'LOST' || status === 'ON_HOLD') {
    return [
      { status: 'NEW', at: daysAgo(created) },
      { status: 'CONTACTED', at: daysAgo(created - 1) },
      { status, at: daysAgo(Math.max(0, created - 3)) },
    ];
  }
  const idx = ORDER.indexOf(status);
  return ORDER.slice(0, idx + 1)
    .map((s, i) => ({ s, at: daysAgo(Math.max(0, created - i * 2)) }))
    .map(({ s, at }) => ({ status: s, at }));
}

function buildRequest(seed: Seed, idx: number, users: AuthUser[]): StoredRequest {
  const id = stableUuid(`request:${idx}`);
  const squad = squads.find((s) => s.slug === seed.squad);
  const itemsSrc: [string, number, Seniority][] = squad
    ? squad.roles.map((r) => [r.role.slug, r.default_qty, 'MID'])
    : seed.items;
  const items = itemsSrc.map(([slug, quantity, seniority], k) => ({
    id: stableUuid(`request:${idx}:item:${k}`),
    role: roleBySlug.get(slug)!,
    quantity,
    seniority,
    skills_note: null,
  }));
  const created = daysAgo(seed.age);
  const timeline = timelineTo(seed.status, seed.age);
  const sales = users.find((u) => u.role === 'SALES')!;
  const contactName = `${FIRST[(idx * 5) % FIRST.length]} ${LAST[(idx * 3) % LAST.length]}`;
  const email = `${contactName.split(' ')[0]!.toLowerCase()}@${seed.org.toLowerCase().replace(/[^a-z]+/g, '')}.${seed.govt ? 'gov.pk' : 'pk'}`;
  const activities: Activity[] = timeline.map((t, k) => ({
    id: stableUuid(`request:${idx}:activity:${k}`),
    type: k === 0 ? 'SYSTEM' : 'STATUS_CHANGE',
    body: k === 0 ? 'Request submitted via website' : `Status changed to ${t.status}`,
    user: k === 0 ? null : { id: sales.id, name: sales.name },
    created_at: t.at,
  }));
  if (seed.status !== 'NEW') {
    activities.splice(1, 0, {
      id: stableUuid(`request:${idx}:note`),
      type: 'NOTE',
      body: 'Called the client, requirement confirmed. Sharing profiles this week.',
      user: { id: sales.id, name: sales.name },
      created_at: daysAgo(Math.max(0, seed.age - 1)),
    });
  }
  const startDate = isoDate(new Date(Date.now() + (14 - seed.age) * 86_400_000));
  return {
    id,
    ref_no: `DS-${year}-${String(idx + 1).padStart(4, '0')}`,
    org_name: seed.org,
    org_type: seed.govt ? 'GOVT' : 'PRIVATE',
    request_type: squad ? 'SQUAD' : items.length === 1 ? 'SINGLE_ROLE' : 'CUSTOM_TEAM',
    squad_name: squad?.name ?? null,
    total_headcount: items.reduce((n, i) => n + i.quantity, 0),
    duration_months: seed.months,
    engagement_mode: (['ONSITE', 'REMOTE', 'HYBRID'] as const)[idx % 3]!,
    budget_range: (['PKR_500K_1M', 'PKR_1M_3M', 'PKR_200K_500K'] as const)[idx % 3],
    status: seed.status,
    assigned_to: seed.status === 'NEW' ? null : { id: sales.id, name: sales.name },
    created_at: created,
    organization: {
      name: seed.org,
      department_or_industry: seed.dept,
      city: CITIES[idx % CITIES.length],
    },
    contact: {
      name: contactName,
      email,
      phone: '+92 300 1234567',
      whatsapp: '+92 300 1234567',
      designation: seed.govt ? 'Deputy Director' : 'Head of Operations',
    },
    items,
    attachments:
      idx % 3 === 0
        ? [
            {
              id: stableUuid(`request:${idx}:file`),
              file_name: 'Terms-of-Reference.pdf',
              mime_type: 'application/pdf',
              size_bytes: 248_000,
            },
          ]
        : [],
    activities,
    start_date: startDate,
    city: CITIES[idx % CITIES.length]!,
    contract_type: 'MONTHLY',
    procurement_mode: seed.govt ? 'RFQ' : null,
    tender_ref: seed.govt ? `RFQ/${year}/${100 + idx}` : null,
    description:
      'We need a dependable team to support our digital services. Details are in the attached terms of reference where available.',
    engagement_id: null,
    contact_email_lower: email.toLowerCase(),
  };
}

function seedState(): State {
  const users = DEMO_USERS.map((u, i) => ({
    id: stableUuid(`user:${u.email}`),
    ...u,
    is_active: true,
    last_login_at: daysAgo(i),
    password: DEMO_PASSWORD,
  }));
  const talents = buildTalents();
  const requests = SAMPLE.map((s, i) => buildRequest(s, i, users));

  // Demo request for /track tests: DS-YYYY-0001 belongs to demo@example.com, status PROPOSAL_SENT.
  const first = requests[0]!;
  first.status = 'PROPOSAL_SENT';
  first.contact = { ...first.contact, email: 'demo@example.com' };
  first.contact_email_lower = 'demo@example.com';
  first.activities = [
    {
      id: stableUuid('demo:a1'),
      type: 'SYSTEM',
      body: 'Request submitted via website',
      user: null,
      created_at: daysAgo(6),
    },
    {
      id: stableUuid('demo:a2'),
      type: 'STATUS_CHANGE',
      body: 'Status changed to CONTACTED',
      user: null,
      created_at: daysAgo(5),
    },
    {
      id: stableUuid('demo:a3'),
      type: 'STATUS_CHANGE',
      body: 'Status changed to PROPOSAL_SENT',
      user: null,
      created_at: daysAgo(1),
    },
  ];

  const state: State = { users, talents, requests, engagements: [], seq: requests.length };
  // WON samples get engagements (one ends within 30 days → renewal alert).
  for (const r of requests.filter((x) => x.status === 'WON')) {
    const start = isoDate(new Date(Date.now() - 60 * 86_400_000));
    const end =
      r.duration_months <= 3
        ? isoDate(new Date(Date.now() + 20 * 86_400_000))
        : addMonths(start, r.duration_months);
    createEngagement(state, r, {
      start_date: start,
      end_date: end,
      monthly_fee: 450_000 * r.total_headcount,
      assignments: r.items.map((item) => ({
        talent_id: state.talents.find((t) => t.primary_role.slug === item.role.slug)!.id,
        role_slug: item.role.slug,
      })),
    });
  }
  return state;
}

/** In the browser (`dev:mock`, E2E) the db is mirrored to sessionStorage so full page loads keep data. */
const STORE_KEY = 'ds_mock_db';
const storage = () => (typeof sessionStorage === 'undefined' ? null : sessionStorage);

function load(): State {
  try {
    const saved = storage()?.getItem(STORE_KEY);
    if (saved) return JSON.parse(saved) as State;
  } catch {
    /* corrupt or blocked storage: fall back to the seed */
  }
  return seedState();
}

let state = load();

function createEngagement(
  s: State,
  r: StoredRequest,
  body: {
    start_date: string;
    end_date: string;
    monthly_fee: number;
    currency?: string;
    assignments: { talent_id: string; role_slug: string }[];
  },
): Engagement {
  const engagement: Engagement = {
    id: stableUuid(`engagement:${r.id}:${s.engagements.length}`),
    request_id: r.id,
    ref_no: r.ref_no,
    org_name: r.org_name,
    start_date: body.start_date,
    end_date: body.end_date,
    monthly_fee: body.monthly_fee,
    currency: body.currency ?? 'PKR',
    status: 'ACTIVE',
    renewed_from_id: null,
    assignments: body.assignments.map((a, i) => {
      const talent = s.talents.find((t) => t.id === a.talent_id)!;
      talent.availability = 'ON_ENGAGEMENT';
      return {
        id: stableUuid(`assignment:${r.id}:${s.engagements.length}:${i}`),
        talent,
        role: roleBySlug.get(a.role_slug)!,
        start_date: body.start_date,
        end_date: null,
      };
    }),
  };
  s.engagements.push(engagement);
  r.engagement_id = engagement.id;
  return engagement;
}

const summary = (r: StoredRequest): HireRequestSummary => ({
  id: r.id,
  ref_no: r.ref_no,
  org_name: r.org_name,
  org_type: r.org_type,
  request_type: r.request_type,
  squad_name: r.squad_name,
  total_headcount: r.total_headcount,
  duration_months: r.duration_months,
  engagement_mode: r.engagement_mode,
  budget_range: r.budget_range,
  status: r.status,
  assigned_to: r.assigned_to,
  created_at: r.created_at,
});

const detail = (r: StoredRequest): HireRequestDetail => {
  const { contact_email_lower: _omit, ...rest } = r;
  void _omit;
  return structuredClone(rest);
};

type PageQuery = { page: number; page_size: number };
const paginate = <T, U>(rows: T[], q: PageQuery, map: (row: T) => U) => ({
  items: rows.slice((q.page - 1) * q.page_size, q.page * q.page_size).map(map),
  meta: { total: rows.length, page: q.page, page_size: q.page_size },
});
const clone = <T>(x: T): T => structuredClone(x);
const today = () => isoDate(new Date());

const SENIORITY_RANK: Record<Seniority, number> = { JUNIOR: 0, MID: 1, SENIOR: 2, LEAD: 3 };

export const db = {
  reset() {
    state = seedState();
    try {
      storage()?.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  },
  save() {
    try {
      storage()?.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* ignore (quota / blocked storage) */
    }
  },

  /* ── auth ── */
  authenticate(email: string, password: string): AuthUser | null {
    const u = state.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u || !u.is_active || u.password !== password) return null;
    u.last_login_at = new Date().toISOString();
    return db.publicUser(u.id);
  },
  publicUser(id: string): AuthUser | null {
    const u = state.users.find((x) => x.id === id);
    if (!u) return null;
    const { password: _p, ...rest } = u;
    void _p;
    return { ...rest };
  },
  listUsers: (): AuthUser[] => state.users.map((u) => db.publicUser(u.id)!),

  /* ── public hire flow ── */
  createRequest(body: HireRequestCreate): HireRequestDetail {
    state.seq += 1;
    const now = new Date().toISOString();
    const squad = squads.find((s) => s.slug === body.squad_slug);
    const items = body.items.map((it, k) => ({
      id: stableUuid(`new:${state.seq}:item:${k}`),
      role: roleBySlug.get(it.role_slug) ?? roles[0]!,
      quantity: it.quantity,
      seniority: it.seniority,
      skills_note: it.skills_note ?? null,
    }));
    const r: StoredRequest = {
      id: stableUuid(`new:${state.seq}`),
      ref_no: `DS-${year}-${String(state.seq).padStart(4, '0')}`,
      org_name: body.organization.name,
      org_type: body.org_type,
      request_type: body.request_type,
      squad_name: squad?.name ?? null,
      total_headcount: items.reduce((n, i) => n + i.quantity, 0),
      duration_months: body.duration_months,
      engagement_mode: body.engagement_mode,
      budget_range: body.budget_range,
      status: 'NEW',
      assigned_to: null,
      created_at: now,
      organization: body.organization,
      contact: body.contact,
      items,
      attachments: (body.attachment_keys ?? []).map((key, k) => ({
        id: stableUuid(`new:${state.seq}:file:${k}`),
        file_name: key
          .split('/')
          .pop()!
          .replace(/^[0-9a-f-]{36}-/, ''),
        mime_type: 'application/pdf',
        size_bytes: 100_000,
      })),
      activities: [
        {
          id: stableUuid(`new:${state.seq}:a0`),
          type: 'SYSTEM',
          body: 'Request submitted via website',
          user: null,
          created_at: now,
        },
      ],
      start_date: body.start_date,
      city: body.city ?? null,
      contract_type: body.contract_type,
      procurement_mode: body.procurement_mode ?? null,
      tender_ref: body.tender_ref ?? null,
      description: body.description,
      engagement_id: null,
      contact_email_lower: body.contact.email.toLowerCase(),
    };
    state.requests.unshift(r);
    return detail(r);
  },
  track(ref: string, email: string) {
    const r = state.requests.find((x) => x.ref_no === ref.toUpperCase());
    if (!r || r.contact_email_lower !== email.toLowerCase()) return null;
    const timeline = r.activities
      .filter((a) => a.type === 'SYSTEM' || a.type === 'STATUS_CHANGE')
      .map((a) => ({
        status: a.type === 'SYSTEM' ? ('NEW' as const) : (a.body.split(' ').pop() as RequestStatus),
        at: a.created_at,
      }));
    return {
      ref_no: r.ref_no,
      status: r.status,
      updated_at: timeline.at(-1)?.at ?? r.created_at,
      timeline,
    };
  },

  /* ── admin: requests ── */
  listRequests(
    q: PageQuery & {
      q?: string;
      status?: string;
      org_type?: string;
      assigned_to?: string;
    },
  ) {
    const needle = q.q?.trim().toLowerCase();
    const rows = state.requests.filter(
      (r) =>
        (!q.status || r.status === q.status) &&
        (!q.org_type || r.org_type === q.org_type) &&
        (!q.assigned_to || r.assigned_to?.id === q.assigned_to) &&
        (!needle ||
          r.ref_no.toLowerCase().includes(needle) ||
          r.org_name.toLowerCase().includes(needle) ||
          r.contact.name.toLowerCase().includes(needle)),
    );
    return paginate(rows, q, summary);
  },
  getRequest(id: string) {
    const r = state.requests.find((x) => x.id === id);
    return r ? detail(r) : null;
  },
  updateStatus(id: string, userId: string, status: RequestStatus, note?: string) {
    const r = state.requests.find((x) => x.id === id);
    if (!r) return null;
    const u = db.publicUser(userId)!;
    const now = new Date().toISOString();
    if (note) {
      r.activities.push({
        id: crypto.randomUUID(),
        type: 'NOTE',
        body: note,
        user: { id: u.id, name: u.name },
        created_at: now,
      });
    }
    if (r.status !== status) {
      r.status = status;
      r.activities.push({
        id: crypto.randomUUID(),
        type: 'STATUS_CHANGE',
        body: `Status changed to ${status}`,
        user: { id: u.id, name: u.name },
        created_at: now,
      });
    }
    return detail(r);
  },
  assign(id: string, userId: string, assigneeId: string | null) {
    const r = state.requests.find((x) => x.id === id);
    if (!r) return null;
    const actor = db.publicUser(userId)!;
    const assignee = assigneeId ? db.publicUser(assigneeId) : null;
    r.assigned_to = assignee ? { id: assignee.id, name: assignee.name } : null;
    r.activities.push({
      id: crypto.randomUUID(),
      type: 'ASSIGNMENT',
      body: assignee ? `Assigned to ${assignee.name}` : 'Unassigned',
      user: { id: actor.id, name: actor.name },
      created_at: new Date().toISOString(),
    });
    return detail(r);
  },
  addNote(id: string, userId: string, body: string): Activity | null {
    const r = state.requests.find((x) => x.id === id);
    if (!r) return null;
    const u = db.publicUser(userId)!;
    const a: Activity = {
      id: crypto.randomUUID(),
      type: 'NOTE',
      body,
      user: { id: u.id, name: u.name },
      created_at: new Date().toISOString(),
    };
    r.activities.push(a);
    return a;
  },
  matches(id: string): ItemMatches[] | null {
    const r = state.requests.find((x) => x.id === id);
    if (!r) return null;
    return r.items.map((item) => {
      const wanted = new Set(
        [...item.role.skills, ...(item.skills_note ?? '').split(/[,\s]+/)]
          .map((s) => s.toLowerCase())
          .filter(Boolean),
      );
      const candidates = state.talents
        .filter(
          (t) =>
            t.is_active && t.availability === 'AVAILABLE' && t.primary_role.slug === item.role.slug,
        )
        .map((talent) => {
          const gap = Math.abs(SENIORITY_RANK[talent.seniority] - SENIORITY_RANK[item.seniority]);
          const seniority = gap === 0 ? 1 : gap === 1 ? 0.5 : 0;
          const overlap = talent.skills.filter((s) => wanted.has(s.toLowerCase())).length;
          const skills = wanted.size ? Math.min(1, overlap / Math.min(3, wanted.size)) : 0;
          return { talent, score: Math.round((0.6 * seniority + 0.4 * skills) * 100) / 100 };
        })
        .sort((a, b) => b.score - a.score);
      return { item_id: item.id, role_slug: item.role.slug, quantity: item.quantity, candidates };
    });
  },
  convert(
    id: string,
    userId: string,
    body: {
      start_date: string;
      end_date: string;
      monthly_fee: number;
      currency?: string;
      assignments: { talent_id: string; role_slug: string }[];
    },
  ): Engagement | 'not_found' | 'conflict' {
    const r = state.requests.find((x) => x.id === id);
    if (!r) return 'not_found';
    if (r.engagement_id) return 'conflict';
    if (
      body.assignments.some(
        (a) => state.talents.find((t) => t.id === a.talent_id)?.availability !== 'AVAILABLE',
      )
    )
      return 'conflict';
    const engagement = createEngagement(state, r, body);
    db.updateStatus(id, userId, 'WON');
    return structuredClone(engagement);
  },
  attachmentUrl(id: string) {
    const found = state.requests.some((r) => r.attachments.some((a) => a.id === id));
    return found ? { url: `https://example.com/mock-download/${id}.pdf`, expires_in: 300 } : null;
  },

  /* ── admin: talents ── */
  listTalents(q: PageQuery & { q?: string; role_slug?: string; availability?: string }) {
    const needle = q.q?.trim().toLowerCase();
    const rows = state.talents.filter(
      (t) =>
        (!q.role_slug || t.primary_role.slug === q.role_slug) &&
        (!q.availability || t.availability === q.availability) &&
        (!needle ||
          [t.full_name, t.email, t.city ?? '', ...t.skills].some((v) =>
            v.toLowerCase().includes(needle),
          )),
    );
    return paginate(rows, q, clone);
  },
  getTalent(id: string) {
    const t = state.talents.find((x) => x.id === id);
    return t ? clone(t) : null;
  },
  /** Create (id = null) or replace a talent. */
  saveTalent(
    id: string | null,
    input: TalentInput,
  ): Talent | 'not_found' | 'bad_role' | 'conflict' {
    const role = roleBySlug.get(input.primary_role_slug);
    if (!role) return 'bad_role';
    const email = input.email.toLowerCase();
    if (state.talents.some((t) => t.id !== id && t.email.toLowerCase() === email))
      return 'conflict';
    const fields = {
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      primary_role: role,
      seniority: input.seniority,
      skills: input.skills ?? [],
      experience_years: input.experience_years,
      availability: input.availability,
      monthly_cost: input.monthly_cost ?? null,
      city: input.city || null,
      is_active: input.availability !== 'INACTIVE',
    };
    if (id === null) {
      const t: Talent = { id: crypto.randomUUID(), cv_attachment_id: null, ...fields };
      state.talents.unshift(t);
      return clone(t);
    }
    const t = state.talents.find((x) => x.id === id);
    if (!t) return 'not_found';
    Object.assign(t, fields);
    return clone(t);
  },
  /** Soft delete, like the API. */
  deactivateTalent(id: string) {
    const t = state.talents.find((x) => x.id === id);
    if (t) Object.assign(t, { is_active: false, availability: 'INACTIVE' });
    return !!t;
  },

  /* ── admin: engagements ── */
  listEngagements(q: PageQuery & { status?: string; ending_within_days?: number }) {
    const cutoff = q.ending_within_days
      ? isoDate(new Date(Date.now() + q.ending_within_days * 86_400_000))
      : null;
    const rows = state.engagements
      .filter(
        (e) =>
          (!q.status || e.status === q.status) &&
          (!cutoff || (e.status === 'ACTIVE' && e.end_date <= cutoff)),
      )
      .sort((a, b) => a.end_date.localeCompare(b.end_date));
    return paginate(rows, q, clone);
  },
  getEngagement(id: string) {
    const e = state.engagements.find((x) => x.id === id);
    return e ? clone(e) : null;
  },
  updateEngagement(
    id: string,
    patch: { end_date?: string; monthly_fee?: number; status?: Engagement['status'] },
  ) {
    const e = state.engagements.find((x) => x.id === id);
    if (!e) return null;
    const closing = patch.status && patch.status !== 'ACTIVE' && e.status === 'ACTIVE';
    Object.assign(e, patch);
    if (closing) {
      // Ending an engagement frees its people and closes their assignments.
      for (const a of e.assignments) {
        a.end_date ??= today();
        const t = state.talents.find((x) => x.id === a.talent.id);
        if (t?.availability === 'ON_ENGAGEMENT') t.availability = 'AVAILABLE';
      }
    }
    return clone(e);
  },
  /** New engagement from the day after the old one ends, same team; the old one is completed. */
  renewEngagement(id: string, body: { end_date: string; monthly_fee?: number }) {
    const e = state.engagements.find((x) => x.id === id);
    const r = e && state.requests.find((x) => x.id === e.request_id);
    if (!e || !r) return 'not_found' as const;
    if (e.status !== 'ACTIVE' || body.end_date <= e.end_date) return 'conflict' as const;
    const start = new Date(`${e.end_date}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() + 1);
    e.status = 'COMPLETED';
    const next = createEngagement(state, r, {
      start_date: isoDate(start),
      end_date: body.end_date,
      monthly_fee: body.monthly_fee ?? e.monthly_fee,
      currency: e.currency,
      assignments: e.assignments
        .filter((a) => !a.end_date)
        .map((a) => ({ talent_id: a.talent.id, role_slug: a.role.slug })),
    });
    next.renewed_from_id = e.id;
    return clone(next);
  },

  /* ── admin: dashboard ── */
  stats(): DashboardStats {
    const by: Record<string, number> = {};
    for (const r of state.requests) by[r.status] = (by[r.status] ?? 0) + 1;
    const active = state.engagements.filter((e) => e.status === 'ACTIVE');
    const in30 = Date.now() + 30 * 86_400_000;
    return {
      new_requests: by.NEW ?? 0,
      open_pipeline: state.requests.filter((r) => !['WON', 'LOST'].includes(r.status)).length,
      active_engagements: active.length,
      available_talent: state.talents.filter((t) => t.is_active && t.availability === 'AVAILABLE')
        .length,
      monthly_recurring_revenue: active.reduce((n, e) => n + e.monthly_fee, 0),
      renewals_due_30d: active.filter((e) => new Date(e.end_date).getTime() <= in30).length,
      requests_by_status: by,
    };
  },
};

export const DEMO_REQUEST = { ref: `DS-${year}-0001`, email: 'demo@example.com' } as const;
