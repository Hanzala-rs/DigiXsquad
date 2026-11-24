import type { AuthUser } from '@digixsquad/api-client';
import {
  AdminAddHireRequestNoteBody,
  AdminAssignHireRequestBody,
  AdminConvertToEngagementBody,
  AdminCreateTalentBody,
  AdminRenewEngagementBody,
  AdminUpdateEngagementBody,
  AdminUpdateHireRequestStatusBody,
  LoginBody,
} from '@digixsquad/api-client/zod';
import { http, HttpResponse, type HttpResponseResolver } from 'msw';
import { can, type Permission } from '@/lib/admin/rbac';
import { db } from './db';
import { mockSession } from './session';

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const err = (status: number, detail: string, code: string) =>
  HttpResponse.json({ detail, code }, { status });

/** Wraps a resolver with the auth + RBAC checks the real API does. */
function guarded(
  permission: Permission,
  resolver: (
    user: AuthUser,
    ...args: Parameters<HttpResponseResolver>
  ) => ReturnType<HttpResponseResolver>,
): HttpResponseResolver {
  return (...args) => {
    const id = mockSession.get();
    const user = id ? db.publicUser(id) : null;
    if (!user || !user.is_active) return err(401, 'Not authenticated', 'unauthorized');
    if (!can(user.role, permission)) return err(403, 'Not allowed for your role', 'forbidden');
    return resolver(user, ...args);
  };
}

const pageOf = (p: URLSearchParams) => ({
  page: Math.max(1, Number(p.get('page') ?? 1)),
  page_size: Math.min(100, Math.max(1, Number(p.get('page_size') ?? 20))),
});
const query = (request: Request) => new URL(request.url).searchParams;
const notFound = (what: string) => err(404, `${what} not found`, 'not_found');
const invalid = () => err(422, 'Invalid body', 'validation_error');

/** Hide internal cost from roles that may not see it (SALES). */
function redactCosts<T>(value: T, user: AuthUser): T {
  if (can(user.role, 'talents.cost')) return value;
  return JSON.parse(JSON.stringify(value), (k, v) => (k === 'monthly_cost' ? null : v)) as T;
}

export const adminHandlers = [
  /* ── auth ── */
  http.post(`${API}/auth/login`, async ({ request }) => {
    const parsed = LoginBody.safeParse(await request.json());
    const user = parsed.success ? db.authenticate(parsed.data.email, parsed.data.password) : null;
    if (!user) return err(401, 'Invalid email or password', 'invalid_credentials');
    mockSession.set(user.id);
    return HttpResponse.json(user);
  }),
  http.post(`${API}/auth/refresh`, () => {
    const id = mockSession.get();
    const user = id ? db.publicUser(id) : null;
    return user ? HttpResponse.json(user) : err(401, 'Session expired', 'unauthorized');
  }),
  http.post(`${API}/auth/logout`, () => {
    mockSession.set(null);
    return HttpResponse.json({ ok: true });
  }),
  http.get(`${API}/auth/me`, () => {
    const id = mockSession.get();
    const user = id ? db.publicUser(id) : null;
    return user ? HttpResponse.json(user) : err(401, 'Not authenticated', 'unauthorized');
  }),

  /* ── dashboard ── */
  http.get(
    `${API}/admin/dashboard/stats`,
    guarded('requests.read', (user) => HttpResponse.json(redactCosts(db.stats(), user))),
  ),

  /* ── requests ── */
  http.get(
    `${API}/admin/hire-requests`,
    guarded('requests.read', (_u, { request }) => {
      const p = query(request);
      return HttpResponse.json(
        db.listRequests({
          ...pageOf(p),
          q: p.get('q') ?? undefined,
          status: p.get('status') ?? undefined,
          org_type: p.get('org_type') ?? undefined,
          assigned_to: p.get('assigned_to') ?? undefined,
        }),
      );
    }),
  ),
  http.get(
    `${API}/admin/hire-requests/export.csv`,
    guarded('requests.export', (_u, { request }) => {
      const status = new URL(request.url).searchParams.get('status') ?? undefined;
      const { items } = db.listRequests({ page: 1, page_size: 10_000, status });
      const rows = [
        [
          'ref_no',
          'org_name',
          'org_type',
          'request_type',
          'headcount',
          'months',
          'status',
          'created_at',
        ],
        ...items.map((r) => [
          r.ref_no,
          r.org_name,
          r.org_type,
          r.request_type,
          r.total_headcount,
          r.duration_months,
          r.status,
          r.created_at,
        ]),
      ];
      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      return new HttpResponse(csv, { headers: { 'Content-Type': 'text/csv' } });
    }),
  ),
  http.get(
    `${API}/admin/hire-requests/:id`,
    guarded('requests.read', (_u, { params }) => {
      const r = db.getRequest(String(params.id));
      return r ? HttpResponse.json(r) : notFound('Request');
    }),
  ),
  http.patch(
    `${API}/admin/hire-requests/:id/status`,
    guarded('requests.write', async (user, { params, request }) => {
      const body = AdminUpdateHireRequestStatusBody.safeParse(await request.json());
      if (!body.success) return invalid();
      const r = db.updateStatus(String(params.id), user.id, body.data.status, body.data.note);
      return r ? HttpResponse.json(r) : notFound('Request');
    }),
  ),
  http.patch(
    `${API}/admin/hire-requests/:id/assign`,
    guarded('requests.assign', async (user, { params, request }) => {
      const body = AdminAssignHireRequestBody.safeParse(await request.json());
      if (!body.success) return invalid();
      const r = db.assign(String(params.id), user.id, body.data.user_id ?? null);
      return r ? HttpResponse.json(r) : notFound('Request');
    }),
  ),
  http.post(
    `${API}/admin/hire-requests/:id/notes`,
    guarded('requests.write', async (user, { params, request }) => {
      const body = AdminAddHireRequestNoteBody.safeParse(await request.json());
      if (!body.success) return invalid();
      const a = db.addNote(String(params.id), user.id, body.data.body);
      return a ? HttpResponse.json(a, { status: 201 }) : notFound('Request');
    }),
  ),
  http.get(
    `${API}/admin/hire-requests/:id/matches`,
    guarded('matches.read', (user, { params }) => {
      const m = db.matches(String(params.id));
      return m ? HttpResponse.json(redactCosts(m, user)) : notFound('Request');
    }),
  ),
  http.post(
    `${API}/admin/hire-requests/:id/convert`,
    guarded('engagements.convert', async (user, { params, request }) => {
      const body = AdminConvertToEngagementBody.safeParse(await request.json());
      if (!body.success) return invalid();
      const result = db.convert(String(params.id), user.id, body.data);
      if (result === 'not_found') return notFound('Request');
      if (result === 'conflict')
        return err(
          409,
          'Already converted, or a selected talent is no longer available',
          'conflict',
        );
      return HttpResponse.json(result, { status: 201 });
    }),
  ),
  http.get(
    `${API}/admin/attachments/:id/download`,
    guarded('requests.read', (_u, { params }) => {
      const r = db.attachmentUrl(String(params.id));
      return r ? HttpResponse.json(r) : notFound('Attachment');
    }),
  ),

  /* ── talents ── */
  http.get(
    `${API}/admin/talents`,
    guarded('talents.manage', (user, { request }) => {
      const p = query(request);
      const list = db.listTalents({
        ...pageOf(p),
        q: p.get('q') ?? undefined,
        role_slug: p.get('role_slug') ?? undefined,
        availability: p.get('availability') ?? undefined,
      });
      return HttpResponse.json(redactCosts(list, user));
    }),
  ),
  ...(['post', 'put'] as const).map((method) =>
    http[method](
      `${API}/admin/talents${method === 'put' ? '/:id' : ''}`,
      guarded('talents.manage', async (user, { params, request }) => {
        const body = AdminCreateTalentBody.safeParse(await request.json());
        if (!body.success) return invalid();
        const t = db.saveTalent(method === 'put' ? String(params.id) : null, body.data);
        if (t === 'not_found') return notFound('Talent');
        if (t === 'bad_role') return err(422, 'Unknown role', 'validation_error');
        if (t === 'conflict') return err(409, 'A talent with this email exists', 'conflict');
        return HttpResponse.json(redactCosts(t, user), { status: method === 'post' ? 201 : 200 });
      }),
    ),
  ),
  http.get(
    `${API}/admin/talents/:id`,
    guarded('talents.manage', (user, { params }) => {
      const t = db.getTalent(String(params.id));
      return t ? HttpResponse.json(redactCosts(t, user)) : notFound('Talent');
    }),
  ),
  http.delete(
    `${API}/admin/talents/:id`,
    guarded('talents.manage', (_u, { params }) =>
      db.deactivateTalent(String(params.id))
        ? new HttpResponse(null, { status: 204 })
        : notFound('Talent'),
    ),
  ),

  /* ── engagements ── */
  http.get(
    `${API}/admin/engagements`,
    guarded('engagements.manage', (user, { request }) => {
      const p = query(request);
      const list = db.listEngagements({
        ...pageOf(p),
        status: p.get('status') ?? undefined,
        ending_within_days: Number(p.get('ending_within_days')) || undefined,
      });
      return HttpResponse.json(redactCosts(list, user));
    }),
  ),
  http.get(
    `${API}/admin/engagements/:id`,
    guarded('engagements.manage', (user, { params }) => {
      const e = db.getEngagement(String(params.id));
      return e ? HttpResponse.json(redactCosts(e, user)) : notFound('Engagement');
    }),
  ),
  http.patch(
    `${API}/admin/engagements/:id`,
    guarded('engagements.manage', async (user, { params, request }) => {
      const body = AdminUpdateEngagementBody.safeParse(await request.json());
      if (!body.success) return invalid();
      const e = db.updateEngagement(String(params.id), body.data);
      return e ? HttpResponse.json(redactCosts(e, user)) : notFound('Engagement');
    }),
  ),
  http.post(
    `${API}/admin/engagements/:id/renew`,
    guarded('engagements.manage', async (user, { params, request }) => {
      const body = AdminRenewEngagementBody.safeParse(await request.json());
      if (!body.success) return invalid();
      const e = db.renewEngagement(String(params.id), body.data);
      if (e === 'not_found') return notFound('Engagement');
      if (e === 'conflict')
        return err(
          409,
          'Only an active engagement can be renewed, to a later end date',
          'conflict',
        );
      return HttpResponse.json(redactCosts(e, user), { status: 201 });
    }),
  ),

  /* ── users (assign picker) ── */
  http.get(
    `${API}/admin/users`,
    guarded('users.manage', () => HttpResponse.json(db.listUsers())),
  ),
];
