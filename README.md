# DigixSquad

Squad-as-a-service platform: public website + hire request flow + admin panel.

- Plan: [`docs/PLAN.md`](docs/PLAN.md)
- Frontend agent rules: [`FRONTEND.md`](FRONTEND.md) · Codex rules: [`AGENTS.md`](AGENTS.md)
- API contract: [`packages/contract/openapi.yaml`](packages/contract/openapi.yaml)

## Quick start (Phase 0)

```bash
corepack enable          # pnpm 10
pnpm install
pnpm contract:lint       # validate OpenAPI + seed data
pnpm contract:gen        # regenerate TS client + Zod
pnpm test
```

| Part                  | Tech                     | 
| --------------------- | ------------------------ | 
| `apps/web`            | Next.js                  | 
| `apps/api`            | FastAPI (uv)             | 
| `packages/contract`   | OpenAPI + seed JSON      | 
| `packages/api-client` | orval-generated TS + Zod | 
| `infra`               | Docker, Caddy, CI        | 
