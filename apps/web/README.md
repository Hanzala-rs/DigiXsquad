# apps/web — Next.js (public site + admin)

**Owner: Frontend agent** · rules in [`FRONTEND.md`](../../FRONTEND.md).

Stack: Next.js 16 (App Router, `output: 'standalone'`) · TypeScript · Tailwind CSS 4 · shadcn/ui (`components.json`) · TanStack Query · MSW · Vitest.

API types and Zod schemas come from `@digixsquad/api-client`. Never hand-write API types.

```bash
pnpm --filter @digixsquad/web dev        # http://localhost:3000, real API at NEXT_PUBLIC_API_BASE_URL
pnpm --filter @digixsquad/web dev:mock   # browser requests answered by MSW from packages/contract/seed
pnpm --filter @digixsquad/web test
```

| Path | What |
| --- | --- |
| `src/app/globals.css` | Design tokens (`@theme`), shadcn variables, chamfer utilities, intro/hero styles |
| `src/components/home/` | `IntroSplash` + `HomeHero` (port of `docs/prototypes/intro.html`) and `intro-script.ts` timeline |
| `src/components/layout/` | Navbar, Footer, floating WhatsApp (`wa.me`) button |
| `src/lib/site-content.ts` | `getSiteContent` from the API, seed JSON as fallback |
| `src/mocks/` | MSW handlers + contract-shaped fixtures built from the seeds |

## Home intro

The overlay and hero are server-rendered. A tiny inline script in `<head>` (`intro-script.ts`) sets `html[data-intro]`:
`pending` → `burst` (1.9s) → `reveal` (2.1s) → `settled`. All motion is CSS keyframes ported 1:1 from the prototype, so it
runs before hydration and doesn't wait for React. It plays once per session (`sessionStorage.ds_intro_seen`), only on a
hard load of `/`, and is skipped by click or Esc. With `prefers-reduced-motion` the final hero shows right away.
