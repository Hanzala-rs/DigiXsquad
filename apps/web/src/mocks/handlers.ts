import { http, HttpResponse } from 'msw';
import { roles, siteContent, squads } from './fixtures';

/**
 * MSW handlers for the public contract endpoints, answered from packages/contract/seed.
 * Phase 3 adds presign / hire request / track; Phase 4 adds admin.
 */
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const notFound = (detail: string) =>
  HttpResponse.json({ detail, code: 'not_found' }, { status: 404 });

export const handlers = [
  http.get(`${API}/health`, () => HttpResponse.json({ status: 'ok' })),

  http.get(`${API}/site-content`, () => HttpResponse.json(siteContent)),

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
];
