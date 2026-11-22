# infra — Docker, reverse proxy, CI

**Owner: Codex**

- Phase 1: `docker-compose.yml` for local dev: postgres:16, minio (+ bucket init), mailpit. **No Redis.**
- Phase 6: `docker-compose.prod.yml` for one **Oracle Cloud Always Free** Arm VM (`linux/arm64` images): caddy (auto HTTPS), web, api, postgres. Uploads + backups go to Cloudflare R2 free tier. Uptime Kuma (self-hosted, free) for uptime alerts.
