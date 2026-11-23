# apps/web — Next.js (public site + admin)

**Owner: Frontend agent** · rules in [`FRONTEND.md`](../../FRONTEND.md).

Stack: Next.js 16 (App Router, `output: 'standalone'`) · TypeScript · Tailwind CSS 4 · shadcn/ui (`components.json`) · TanStack Query · MSW · Vitest.

API types and Zod schemas come from `@digixsquad/api-client`. Never hand-write API types.

```bash
pnpm --filter @digixsquad/web dev        # http://localhost:3000, real API at NEXT_PUBLIC_API_BASE_URL
pnpm --filter @digixsquad/web dev:mock   # browser requests answered by MSW from packages/contract/seed
pnpm --filter @digixsquad/web test
pnpm --filter @digixsquad/web e2e        # Playwright: hire → admin → status → track + axe a11y (starts its own mock server on :3100)
```

Lighthouse: measure a production build (`APP_ENV=production pnpm build && pnpm start`), not `dev`. Non-production builds are `noindex`, so SEO scores low there on purpose.

| Path | What |
| --- | --- |
| `src/app/globals.css` | Design tokens (`@theme`), shadcn variables, chamfer utilities, intro/hero styles |
| `src/components/home/` | `IntroSplash` + `HomeHero` (port of `docs/prototypes/intro.html`) and `intro-script.ts` timeline |
| `src/components/layout/` | Navbar, Footer, floating WhatsApp (`wa.me`) button |
| `src/lib/site-content.ts` | `getSiteContent` from the API, seed JSON as fallback |
| `src/app/(site)/` | Public pages + their layout (navbar, footer, WhatsApp button) |
| `src/app/admin/` | Admin: `login/` (public) and `(panel)/` (session-guarded shell) |
| `src/lib/admin/` | `authed()` session refresh, typed admin API, RBAC matrix, formatting |
| `src/mocks/` | MSW handlers; `db.ts` is the mock backend shared by public + admin mocks (mirrored to sessionStorage in the browser) |
| `e2e/` | Playwright specs (`playwright.config.ts`; locally uses the installed Chrome) |

## Admin

`/admin` uses the API's httpOnly cookies. `AdminGuard` loads `GET /auth/me`; on a 401 every admin call refreshes the
session once via `/auth/refresh` (concurrent 401s share one refresh) and retries; if that fails it redirects to
`/admin/login?next=…` (only `/admin` paths are accepted as `next`). Navigation and actions are filtered by role with
`src/lib/admin/rbac.ts` (mirrors AGENTS.md); the API enforces the same rules.

With `dev:mock`, sign in with the demo accounts in `src/mocks/db.ts` (`DEMO_USERS` + `DEMO_PASSWORD`): one per role.
A request submitted on `/hire` appears in `/admin/requests`. The mock session lives in `sessionStorage`.

## Home intro

The overlay and hero are server-rendered. A tiny inline script in `<head>` (`intro-script.ts`) sets `html[data-intro]`:
`pending` → `burst` (1.9s) → `reveal` (2.1s) → `settled`. All motion is CSS keyframes ported 1:1 from the prototype, so it
runs before hydration and doesn't wait for React. It plays once per session (`sessionStorage.ds_intro_seen`), only on a
hard load of `/`, and is skipped by click or Esc. With `prefers-reduced-motion` the final hero shows right away.
