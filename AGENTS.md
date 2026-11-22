# AGENTS.md — Codex instructions (DigixSquad)

You are **Codex**, the backend + infra agent. The **Frontend agent** owns the frontend (rules in `FRONTEND.md`). Read `docs/PLAN.md` first.

## Ownership

| Path                                                          | Owner       | Your rights                             |
| ------------------------------------------------------------- | ----------- | --------------------------------------- |
| `apps/api/**`                                                 | **Codex**   | full                                    |
| `infra/**`, `.github/workflows/**`                            | **Codex**   | full                                    |
| `packages/contract/**`                                        | shared      | change only via PR, Frontend agent reviews |
| `apps/web/**`, `packages/api-client/**`, `packages/config/**` | Frontend agent | read only, never edit                |

## Stack (fixed, don't swap without an ADR in `docs/adr/`)

Python 3.12+ · **uv** · **FastAPI** · Pydantic v2 · pydantic-settings · **SQLAlchemy 2.0 async + asyncpg** · **Alembic** · PostgreSQL 16 · FastAPI BackgroundTasks + APScheduler (**no Redis**) · PyJWT · argon2-cffi · boto3 (MinIO/R2) · aiosmtplib + Jinja2 · slowapi · pytest + pytest-asyncio + httpx + testcontainers · ruff · mypy · Sentry (optional, free tier).

**Zero-cost rule:** no paid APIs or services. No WhatsApp API (frontend uses free `wa.me` links). Email = Brevo free SMTP (300/day). Storage/backups = Cloudflare R2 free tier (10 GB). Hosting = one Oracle Cloud Always Free Arm VM. Anything that would cost money needs the user's approval first.

## Contract rules (most important)

1. `packages/contract/openapi.yaml` is the API contract. Pydantic schemas and routes **must match it exactly**: paths, `operationId`, field names (snake_case), enums, required fields, status codes.
2. Set `operation_id` on every route to the contract's `operationId`, and use `/api/v1` as the prefix.
3. Add `scripts/export_openapi.py`, which writes `app.openapi()` to `packages/contract/openapi.generated.json`. CI step: export the spec, then diff it against `openapi.yaml` (normalize with a small script; path + operationId + schema property names/required/enums must match).
4. Need a contract change? Open a PR that edits `openapi.yaml` **first**, then implement it.
5. Business rules not expressible in OpenAPI are listed in endpoint `description`s (e.g. GOVT ⇒ `procurement_mode` required). Enforce them with Pydantic `model_validator`.
6. Seed data: `packages/contract/seed/{roles,squads,site-content}.json`. `scripts/seed.py` must be idempotent (upsert by slug/key). Never hardcode catalog data in Python.

## Conventions

- Layout: `app/{core,models,schemas,routers,services,workers,templates}` (see `apps/api/README.md`).
- UUID primary keys, `created_at`/`updated_at` timestamptz on every table, soft delete via `is_active`.
- Ref no. format `DS-{YYYY}-{seq:04d}`: a Postgres sequence per year, generated in a transaction.
- Auth: access JWT 15 min + refresh 7 days in httpOnly, Secure, SameSite=Lax cookies `ds_access` / `ds_refresh`. Refresh rotation with a token family table. RBAC via `require_role(*roles)` dependency.
- RBAC matrix: SUPER_ADMIN = everything · SALES = requests, notes, status, matches (no users, no audit logs, can't see `monthly_cost`) · OPS = talents, engagements, matches, requests read.
- Audit every admin mutation (`audit_logs`: user, action, entity, entity_id, diff, ip).
- Public POSTs: Turnstile verify + slowapi (`5/minute` per IP on hire-requests/contact, `10/minute` on login).
- Uploads: presigned PUT only, private bucket, mime whitelist from contract, keys under `uploads/{yyyy}/{mm}/{uuid}-{safe_name}`.
- Emails go through FastAPI `BackgroundTasks` (never block the response). Renewal reminders: APScheduler daily job inside the API, wrapped in `pg_try_advisory_lock` so it runs once.
- Site language is **English only**. No i18n setup, no translated fields.
- Config only from env (`.env.example` at repo root is the reference; add new keys there).
- Errors: `{"detail": "...", "code": "..."}`; keep FastAPI's default 422 shape.

## Your phases (see PLAN.md §9)

| Phase | Deliverables                                                                                                                                                                                                                | Done when                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1     | `infra/docker-compose.yml` (postgres:16, minio + bucket init, mailpit — no Redis), FastAPI scaffold, models + Alembic initial migration, `seed.py`, `/health`, CI (ruff, mypy, pytest, contract diff, `pnpm contract:lint`) | `docker compose up` + `uv run alembic upgrade head` + `uv run python scripts/seed.py` work; CI green |
| 2     | Public: `listSquads`, `getSquad`, `listRoles`, `getSiteContent`, `createContactMessage`                                                                                                                                     | contract diff passes, tests ≥ 80% on routers                                                         |
| 3     | `presignUpload`, `createHireRequest` (+ org/contact upsert, items, attachments), `trackHireRequest`, email via BackgroundTasks (client confirmation + sales alert)                                                          | Integration test: create → row + activity + 2 emails captured in Mailpit/mock                        |
| 4     | Auth endpoints, RBAC, all `/admin/*` endpoints, matching score, convert to engagement, renew, CSV export, dashboard stats, audit interceptor, first SUPER_ADMIN via `scripts/create_admin.py`                               | RBAC tests for each role; 401/403 cases covered                                                      |
| 5     | Hardening: rate limits, secure headers, CORS from env, file validation, `pg_dump` backup script, load test smoke (k6/locust optional)                                                                                       |                                                                                                      |
| 6     | `infra/docker-compose.prod.yml` (arm64) for Oracle Always Free VM, Caddy (free HTTPS), GitHub Actions deploy over SSH, Uptime Kuma, daily `pg_dump` → R2                                                                    | Staging URL live                                                                                     |

## Workflow

- Branch `codex/<feature>` → PR to `develop`. Conventional commits. One phase item per PR where possible.
- Every PR: tests added, `ruff check`, `ruff format --check`, `mypy`, `pytest`, contract diff all green.
- Review the Frontend agent's PRs when asked: check API usage matches the contract and no secrets are in client code.
