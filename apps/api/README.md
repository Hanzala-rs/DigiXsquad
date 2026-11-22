# apps/api — FastAPI backend

**Owner: Codex** · Phase 1 mein scaffold hoga. Poori spec `AGENTS.md` mein hai. **Zero-cost stack:** koi paid API nahi.

| Concern | Choice |
|---|---|
| Runtime | Python 3.12+ · **uv** (deps + venv) |
| Framework | **FastAPI** + Pydantic v2 + pydantic-settings |
| DB | PostgreSQL 16 · **SQLAlchemy 2.0 (async) + asyncpg** · **Alembic** migrations |
| Background work | FastAPI `BackgroundTasks` (emails) · **APScheduler** daily job (renewal reminders), guarded by a Postgres advisory lock. **No Redis.** |
| Auth | PyJWT (access + refresh, httpOnly cookies) · **argon2-cffi** · RBAC dependencies |
| Storage | boto3 (S3 API → MinIO local / Cloudflare R2 free tier in prod), presigned URLs |
| Email | aiosmtplib + Jinja2 templates → Mailpit (local) / Brevo free SMTP (prod) |
| WhatsApp | **No API.** Free `https://wa.me/<number>` click-to-chat links only (built on the frontend) |
| Security | slowapi (in-memory rate limit), Turnstile verify (free), CORS, secure headers |
| Tests | pytest · pytest-asyncio · httpx AsyncClient · testcontainers-postgres |
| Quality | ruff (lint + format) · mypy |
| Server | uvicorn (single process on the free VM) · Sentry SDK optional (free tier, off if `SENTRY_DSN` empty) |

Suggested layout:
```
apps/api/
├─ pyproject.toml
├─ alembic/            migrations
├─ app/
│  ├─ main.py          FastAPI app, routers, middleware, scheduler startup
│  ├─ core/            config, security, db session, deps (get_current_user, require_role)
│  ├─ models/          SQLAlchemy models
│  ├─ schemas/         Pydantic models (must match packages/contract/openapi.yaml)
│  ├─ routers/         public/, auth.py, admin/
│  ├─ services/        business logic (ref no., matching, mailer, renewals)
│  └─ templates/email/
├─ scripts/
│  ├─ seed.py          reads packages/contract/seed/*.json
│  ├─ create_admin.py
│  ├─ backup.sh        pg_dump → gzip → R2 (free 10 GB)
│  └─ export_openapi.py → writes packages/contract/openapi.generated.json
└─ tests/
```
