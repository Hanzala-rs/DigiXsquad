# infra — Docker, reverse proxy, CI

Start PostgreSQL, MinIO and Mailpit from the repository root.

```sh
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps -a
```

The bucket setup container exits after creating the private bucket. The MinIO
console uses port 9001, and the Mailpit inbox uses port 8025.
The first startup builds the MinIO server and client from pinned upstream
releases. To rebuild after changing either release, add `--build` to `up`.

**Owner: Codex**

- Phase 1: `docker-compose.yml` for local dev: postgres:16, minio (+ bucket init), mailpit. **No Redis.**
- Phase 6: `docker-compose.prod.yml` for one **Oracle Cloud Always Free** Arm VM (`linux/arm64` images): caddy (auto HTTPS), web, api, postgres. Uploads + backups go to Cloudflare R2 free tier. Uptime Kuma (self-hosted, free) for uptime alerts.
