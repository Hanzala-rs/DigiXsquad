# apps/api — FastAPI backend

**Owner: Codex** · Phase 1 mein scaffold hoga. Poori spec `AGENTS.md` mein hai.

| Concern | Choice |
|---|---|
| Runtime | Python 3.12+ · **uv** (deps + venv) |
| Framework | **FastAPI** + Pydantic v2 + pydantic-settings |
| DB | PostgreSQL 16 · **SQLAlchemy 2.0 (async) + asyncpg** · **Alembic** migrations |
| Jobs | Redis + **ARQ** (email / WhatsApp / renewal reminders) |
| Auth | PyJWT (access + refresh, httpOnly cookies) · **argon2-cffi** · RBAC dependencies |
| Storage | boto3 (S3 API → MinIO local / Cloudflare R2 cloud), presigned URLs |
| Email | aiosmtplib + Jinja2 templates |
| Security | slowapi (rate limit), Turnstile verify, CORS, secure headers |
| Tests | pytest · pytest-asyncio · httpx AsyncClient · testcontainers-postgres |
| Quality | ruff (lint + format) · mypy |
| Server | uvicorn (gunicorn + uvicorn workers in prod) · Sentry SDK |

Suggested layout:
```
apps/api/
├─ pyproject.toml
├─ alembic/            migrations
├─ app/
│  ├─ main.py          FastAPI app, routers, middleware
│  ├─ core/            config, security, db session, deps (get_current_user, require_role)
│  ├─ models/          SQLAlchemy models
│  ├─ schemas/         Pydantic models (must match packages/contract/openapi.yaml)
│  ├─ routers/         public/, auth.py, admin/
│  ├─ services/        business logic (ref no., matching, notifications)
│  ├─ workers/         ARQ tasks
│  └─ templates/email/
├─ scripts/
│  ├─ seed.py          reads packages/contract/seed/*.json
│  └─ export_openapi.py → writes packages/contract/openapi.generated.json
└─ tests/
```
