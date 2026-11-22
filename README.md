# DigixSquad

Squad-as-a-service platform: public website + hire request flow + admin panel.

- Plan: [`docs/PLAN.md`](docs/PLAN.md)
- Claude Code rules: [`CLAUDE.md`](CLAUDE.md) · Codex rules: [`AGENTS.md`](AGENTS.md)
- API contract: [`packages/contract/openapi.yaml`](packages/contract/openapi.yaml)

## Quick start (Phase 0)

```bash
corepack enable          # pnpm 10
pnpm install
pnpm contract:lint       # validate OpenAPI + seed data
pnpm contract:gen        # regenerate TS client + Zod
pnpm test
```

| Part                  | Tech                     | Owner       |
| --------------------- | ------------------------ | ----------- |
| `apps/web`            | Next.js                  | Claude Code |
| `apps/api`            | FastAPI (uv)             | Codex       |
| `packages/contract`   | OpenAPI + seed JSON      | shared      |
| `packages/api-client` | orval-generated TS + Zod | Claude Code |
| `infra`               | Docker, Caddy, CI        | Codex       |
