import {
  AdminUpdateSiteContentBody,
  CreateContactMessageBody,
  CreateHireRequestBody,
  PresignUploadBody,
  TrackHireRequestQueryParams,
} from '@digixsquad/api-client/zod';
import { http, HttpResponse } from 'msw';
import type { z } from 'zod';
import { can } from '@/lib/admin/rbac';
import { roles, siteContent, squads } from '@/lib/seed-data';
import { adminHandlers } from './admin-handlers';
import { db } from './db';
import { mockSession } from './session';

/**
 * MSW handlers: public endpoints answered from packages/contract/seed, plus the admin API
 * (admin-handlers.ts). Hire requests and tracking share the in-memory store in db.ts.
 */
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const notFound = (detail: string) =>
  HttpResponse.json({ detail, code: 'not_found' }, { status: 404 });

/** FastAPI-style 422 body. */
const validationError = (error: z.ZodError) =>
  HttpResponse.json(
    {
      detail: error.issues.map((i) => ({ loc: ['body', ...i.path], msg: i.message, type: i.code })),
    },
    { status: 422 },
  );

/** Site content as edited through `PUT /admin/site-content` (in memory; reset() restores the seed). */
let liveSiteContent = structuredClone(siteContent);
export const siteContentStore = {
  get: () => liveSiteContent,
  reset() {
    liveSiteContent = structuredClone(siteContent);
  },
};

export const handlers = [
  http.get(`${API}/health`, () => HttpResponse.json({ status: 'ok' })),

  http.get(`${API}/site-content`, () => HttpResponse.json(liveSiteContent)),

  // SUPER_ADMIN only (rbac `content.manage`); replaces the whole document.
  http.put(`${API}/admin/site-content`, async ({ request }) => {
    const id = mockSession.get();
    const user = id ? db.publicUser(id) : null;
    if (!user || !user.is_active)
      return HttpResponse.json(
        { detail: 'Not authenticated', code: 'unauthorized' },
        { status: 401 },
      );
    if (!can(user.role, 'content.manage'))
      return HttpResponse.json(
        { detail: 'Not allowed for your role', code: 'forbidden' },
        { status: 403 },
      );
    const parsed = AdminUpdateSiteContentBody.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    liveSiteContent = parsed.data;
    return HttpResponse.json(liveSiteContent);
  }),

  http.get(`${API}/squads`, () =>
    HttpResponse.json([...squads].sort((a, b) => a.sort_order - b.sort_order)),
  ),

  http.get(`${API}/squads/:slug`, ({ params }) => {
    const squad = squads.find((s) => s.slug === params.slug);
    return squad ? HttpResponse.json(squad) : notFound('Squad not found');
  }),

  http.get(`${API}/roles`, ({ request }) => {
    const category = new URL(request.url).searchParams.get('category');
    return HttpResponse.json(category ? roles.filter((r) => r.category === category) : roles);
  }),

  http.post(`${API}/contact`, async ({ request }) => {
    const parsed = CreateContactMessageBody.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    return HttpResponse.json({ ok: true }, { status: 201 });
  }),

  // Presign → the browser PUTs the file to a mock storage URL below.
  http.post(`${API}/uploads/presign`, async ({ request }) => {
    const parsed = PresignUploadBody.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const now = new Date();
    const safe = parsed.data.file_name.replace(/[^\w.-]+/g, '_');
    const file_key = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}-${safe}`;
    return HttpResponse.json({
      upload_url: `${API}/__mock-storage/${encodeURIComponent(file_key)}`,
      file_key,
      expires_in: 600,
    });
  }),
  http.put(`${API}/__mock-storage/:key`, () => new HttpResponse(null, { status: 200 })),

  http.post(`${API}/hire-requests`, async ({ request }) => {
    const parsed = CreateHireRequestBody.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);
    const b = parsed.data;
    // Business rules the real API enforces (contract description).
    if (b.org_type === 'GOVT' && !b.procurement_mode)
      return HttpResponse.json(
        {
          detail: 'procurement_mode is required for government requests',
          code: 'procurement_required',
        },
        { status: 400 },
      );
    if (b.request_type === 'SQUAD' && !b.squad_slug)
      return HttpResponse.json(
        { detail: 'squad_slug is required', code: 'squad_required' },
        { status: 400 },
      );
    if (b.request_type === 'SINGLE_ROLE' && b.items.length !== 1)
      return HttpResponse.json(
        { detail: 'A single-role request must have exactly one item', code: 'single_role_items' },
        { status: 400 },
      );
    if (!b.turnstile_token)
      return HttpResponse.json(
        { detail: 'Security check failed', code: 'turnstile_failed' },
        { status: 400 },
      );

    const row = db.createRequest({ ...b, consent: true });
    return HttpResponse.json(
      { ref_no: row.ref_no, status: row.status, created_at: row.created_at },
      { status: 201 },
    );
  }),

  http.get(`${API}/hire-requests/track`, ({ request }) => {
    const q = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = TrackHireRequestQueryParams.safeParse(q);
    if (!parsed.success) return validationError(parsed.error);
    const row = db.track(parsed.data.ref, parsed.data.email);
    return row ? HttpResponse.json(row) : notFound('Request not found');
  }),

  ...adminHandlers,
];
