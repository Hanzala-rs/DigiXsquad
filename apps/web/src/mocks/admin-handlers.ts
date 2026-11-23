import type { AuthUser } from '@digixsquad/api-client';
import {
  AdminAddHireRequestNoteBody,
  AdminAssignHireRequestBody,
  AdminConvertToEngagementBody,
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
      const p = new URL(request.url).searchParams;
      return HttpResponse.json(
        db.listRequests({
          page: Math.max(1, Number(p.get('page') ?? 1)),
          page_size: Math.min(100, Math.max(1, Number(p.get('page_size') ?? 20))),
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
      return r ? HttpResponse.json(r) : err(404, 'Request not found', 'not_found');
    }),
  ),
  http.patch(
    `${API}/admin/hire-requests/:id/status`,
    guarded('requests.write', async (user, { params, request }) => {
      const body = AdminUpdateHireRequestStatusBody.safeParse(await request.json());
      if (!body.success) return err(422, 'Invalid body', 'validation_error');
      const r = db.updateStatus(String(params.id), user.id, body.data.status, body.data.note);
      return r ? HttpResponse.json(r) : err(404, 'Request not found', 'not_found');
    }),
  ),
  http.patch(
    `${API}/admin/hire-requests/:id/assign`,
    guarded('requests.assign', async (user, { params, request }) => {
      const body = AdminAssignHireRequestBody.safeParse(await request.json());
      if (!body.success) return err(422, 'Invalid body', 'validation_error');
      const r = db.assign(String(params.id), user.id, body.data.user_id ?? null);
      return r ? HttpResponse.json(r) : err(404, 'Request not found', 'not_found');
    }),
  ),
  http.post(
    `${API}/admin/hire-requests/:id/notes`,
    guarded('requests.write', async (user, { params, request }) => {
      const body = AdminAddHireRequestNoteBody.safeParse(await request.json());
      if (!body.success) return err(422, 'Invalid body', 'validation_error');
      const a = db.addNote(String(params.id), user.id, body.data.body);
      return a ? HttpResponse.json(a, { status: 201 }) : err(404, 'Request not found', 'not_found');
    }),
  ),
  http.get(
    `${API}/admin/hire-requests/:id/matches`,
    guarded('matches.read', (user, { params }) => {
      const m = db.matches(String(params.id));
      return m
        ? HttpResponse.json(redactCosts(m, user))
        : err(404, 'Request not found', 'not_found');
    }),
  ),
  http.post(
    `${API}/admin/hire-requests/:id/convert`,
    guarded('engagements.convert', async (user, { params, request }) => {
      const body = AdminConvertToEngagementBody.safeParse(await request.json());
      if (!body.success) return err(422, 'Invalid body', 'validation_error');
      const result = db.convert(String(params.id), user.id, body.data);
      if (result === 'not_found') return err(404, 'Request not found', 'not_found');
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
      return r ? HttpResponse.json(r) : err(404, 'Attachment not found', 'not_found');
    }),
  ),

  /* ── users (assign picker) ── */
  http.get(
    `${API}/admin/users`,
    guarded('users.manage', () => HttpResponse.json(db.listUsers())),
  ),
];
