# DigixSquad — Website + Platform Plan (v1.1)

> v1.1 changes: backend switched **NestJS → FastAPI**; contract is now **OpenAPI** (language-neutral); **About page** gets Story, Mission, Vision, Core Values, Goals, Why Us, Stats, Compliance.

## 1. Context

DigixSquad ek **IT staff augmentation / managed squad** company hai. Client (Govt ya Private) ko ek role ka banda (e.g. QA Tester) ya poori squad (3–8 log) chahiye hoti hai, monthly fee par, 1–36 months ke liye, on-site, remote ya hybrid. Hiring, training aur salary DigixSquad handle karta hai.

Website ke do kaam hain: **bechna** (services, squads, Govt/Private value, trust) aur **leads pakarna/manage karna** (multi-step form → admin pipeline → talent match → engagement).

## 2. Scope

| Phase  | Features                                                                                                                                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1** | Public site, About (mission/vision/values), Hire Request form, Request tracking, Admin (leads pipeline, matching, talent bench, engagements + renewals, catalog + site-content CMS, users, audit), Email + WhatsApp notifications |
| **v2** | Client portal, proposal PDFs, invoicing, timesheets, careers page, blog/case studies, Urdu                                                                                                                                        |

## 3. Architecture

```
 Browser ─► apps/web (Next.js: public + admin) ──REST /api/v1, cookies──► apps/api (FastAPI)
                         ▲                                               │
       @digixsquad/api-client (orval → TS types, fetch fns, Zod)         ├─ PostgreSQL 16 (SQLAlchemy + Alembic)
                         ▲                                               ├─ Redis + ARQ (email/WhatsApp jobs)
            packages/contract/openapi.yaml  ◄── must match ── app.openapi()  └─ S3 API (MinIO / Cloudflare R2)
            packages/contract/seed/*.json   ──► seed.py + MSW fixtures + build-time fallback
```

### Repo layout

```
digixsquad/
├─ apps/web            Next.js                         [Claude Code]
├─ apps/api            FastAPI (uv, Python)            [Codex]
├─ packages/contract   openapi.yaml + seed JSON        [shared, PR + review]
├─ packages/api-client generated TS client + Zod       [Claude Code]
├─ packages/config     tsconfig presets                [Claude Code]
├─ infra               docker-compose, Caddy, CI       [Codex]
├─ brand/logo.png
├─ docs/PLAN.md, docs/adr/
├─ CLAUDE.md           Claude Code rules
└─ AGENTS.md           Codex rules
```

## 4. Tech stack

| Layer         | Choice                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Frontend      | Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Framer Motion · RHF + Zod · TanStack Query/Table · MSW |
| Contract      | OpenAPI 3.1 (`packages/contract`) → **orval** → TS types + fetch + Zod                                            |
| Backend       | **FastAPI** · Pydantic v2 · SQLAlchemy 2.0 async + asyncpg · Alembic · uv                                         |
| Database      | **PostgreSQL 16**                                                                                                 |
| Jobs/Cache    | Redis + ARQ                                                                                                       |
| Storage       | MinIO (local/on-prem) · Cloudflare R2 (cloud), presigned URLs                                                     |
| Auth          | JWT access + refresh in httpOnly cookies · argon2 · RBAC (SUPER_ADMIN / SALES / OPS)                              |
| Security      | Cloudflare Turnstile · slowapi rate limits · audit logs · NDA/data pages                                          |
| Notifications | SMTP (aiosmtplib) · WhatsApp Cloud API                                                                            |
| Testing       | pytest + testcontainers · Vitest · Playwright                                                                     |
| Deploy        | Docker Compose on VPS + Caddy (HTTPS) · GitHub Actions · Sentry · Plausible/GA4                                   |

**FastAPI kyun:** Python/AI ecosystem (chatbots, automation, RAG aage chal ke isi backend mein), auto OpenAPI, async performance. **Trade-off:** TS ↔ Python mein types share nahi hote, isliye OpenAPI contract + orval generation + CI contract-diff se sync rakhte hain.

## 5. Sitemap

| Route                                 | Content                                                                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                   | Hero, how it works, squads preview, Govt vs Private, why us, stats, FAQs, CTA                                                                  |
| `/squads`, `/squads/[slug]`           | 5 squads: roles, use-cases, CTA (prefills form)                                                                                                |
| `/roles`                              | 24 roles catalog, filter by category                                                                                                           |
| `/government`                         | e-gov, dashboards, MIS, digitization, cybersecurity · PPRA, NTN, NDA & data security                                                           |
| `/private-sector`                     | Software, ERP/CRM, marketing, automation/chatbots, flexible contracts                                                                          |
| `/how-it-works`, `/engagement-models` | 5-step process · Monthly/Project · On-site/Remote/Hybrid                                                                                       |
| **`/about`**                          | **Our Story · Mission · Vision · Core Values (6) · Goals · Why DigixSquad · Stats · Compliance & Trust · Leadership/Team (placeholder) · CTA** |
| `/hire`                               | 7-step request form                                                                                                                            |
| `/track`                              | Status by ref no. + email                                                                                                                      |
| `/contact`, `/privacy`, `/terms`      |                                                                                                                                                |

**About copy (draft, `seed/site-content.json`, admin se editable):**

- **Mission:** To give every organization, from government departments to growing businesses, instant access to skilled and managed IT teams, so they can deliver digital projects without the cost, delay and risk of hiring.
- **Vision:** To be Pakistan's most trusted squad-as-a-service partner, powering digital transformation across the public and private sectors and taking Pakistani tech talent to the world.
- **Core values:** Ownership · Transparency · Security First · Agility · Quality · Growth

### Hire form steps

Org type → Need (single role / squad / custom team) → Roles + qty + seniority → Duration, start date, mode, city → Organization & contact (Govt: department, procurement mode, tender ref) → Budget, description, attachments → Review + Turnstile → Ref `DS-2026-0001`.

### Admin

Dashboard · Requests (table + kanban, timeline, notes, status, assign, CSV) · Matching · Engagements (renewal alerts, renew) · Talent bench · Squads/Roles/Site content (incl. mission & vision) · Users · Audit logs · Contact messages.

## 6. Database (PostgreSQL)

`users` · `refresh_tokens` · `organizations` · `contacts` · `squads` · `service_roles` · `squad_roles` · `hire_requests` · `hire_request_items` · `attachments` · `request_activities` · `talents` · `engagements` · `engagement_assignments` · `contact_messages` · `audit_logs` · `site_settings` (key `site_content` → JSONB matching `SiteContent` schema).
Field-level detail = `packages/contract/openapi.yaml` schemas + AGENTS.md conventions.

## 7. API

Full contract: `packages/contract/openapi.yaml` (46 operations: public, auth, admin).

## 8. Design system

Black `#0A0A0A` / `#141414` / `#1C1C1C`, orange `#FF6A00`, glow `#FF9A1F`, deep `#E8440F`. Chakra Petch + Inter. Chamfered corners, orange edge glow, dark default.

## 9. Work division

| #    | Phase      | Claude Code                                                           | Codex                                                                          |
| ---- | ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 0 ✅ | Foundation | Monorepo, contract, seeds, api-client generation, CLAUDE.md/AGENTS.md | —                                                                              |
| 1    | Core       | Next.js scaffold, design system, layout, MSW                          | Docker compose, FastAPI scaffold, models, Alembic, seed.py, CI + contract diff |
| 2    | Public     | All public pages incl. About, SEO                                     | Public endpoints                                                               |
| 3    | Hire flow  | 7-step form, upload, Turnstile, `/track`                              | Presign, create request, track, ARQ email/WhatsApp                             |
| 4    | Admin      | Admin UI                                                              | Auth, RBAC, admin endpoints, matching, audit                                   |
| 5    | Quality    | Playwright, a11y, Lighthouse                                          | pytest coverage, hardening, backups                                            |
| 6    | Deploy     | Analytics, polish                                                     | Prod compose, Caddy, CI deploy, Sentry                                         |
| ↔    | Review     | Reviews Codex PRs                                                     | Reviews Claude PRs                                                             |

## 10. Verification

`pnpm contract:lint` (spec + seeds) · `pnpm test` · `docker compose up` · `uv run pytest` · Playwright: hire → admin → status → track · Lighthouse ≥ 90 · RBAC 401/403 tests.

## 11. Open items (client se confirm)

| Item                                                   | Current                         |
| ------------------------------------------------------ | ------------------------------- |
| Brand name                                             | DigixSquad                      |
| Pricing on site                                        | Quote only                      |
| Language                                               | English v1, Urdu v2             |
| Hosting                                                | VPS + Docker                    |
| Contact info, NTN, address, socials                    | `TBD` in site-content.json      |
| Stats, "7–14 days deploy", "free replacement" promises | Draft copy, client must approve |
| Domain, SMTP, WhatsApp Business number                 | Client dega                     |
