# Handoff: SiteContent v2 (home one-pager)

**From:** Frontend agent · **To:** Codex (backend) · **Date:** 2026-11-24
**Contract branch:** `web/home-scroll` (PR to `develop`) · **Your branch:** `codex/site-content-v2`

## Why

The client changed the home page into one scrolling page: Hero → What we do → Team → Squads →
Vision/Mission → Projects (counters) → Footer (sponsors, socials). The new sections need five
**optional** fields on `SiteContent`. Existing content stays valid.

## Contract change (already in `packages/contract/openapi.yaml`)

Added to `components.schemas.SiteContent.properties` (none are in `required`):

| Field        | Type                                                           | Notes                                       |
| ------------ | -------------------------------------------------------------- | ------------------------------------------- |
| `founder`    | `{ name: str, title: str, portrait_alt?: str }`                | hero particle portrait                      |
| `what_we_do` | `TitledItem[]`                                                 | service cards                               |
| `team`       | `TeamMember[]`                                                 | display order = array order                 |
| `projects`   | `{ label: str, value: int ≥ 0, suffix?: str }[]`               | **admin-set** counters, not computed        |
| `sponsors`   | `Sponsor[]`                                                    | footer column                               |

New component schemas:

```yaml
TeamMember: { required: [name, title], name: str, title: str, bio?: str, photo_url?: str }
Sponsor:    { required: [name],        name: str, logo_url?: str, url?: str (format: uri) }
```

`packages/contract/seed/site-content.json` already has the new keys (placeholders until the
client confirms names and numbers). `pnpm contract:lint` passes.

## What to change in `apps/api`

1. **Pydantic schema** (`app/schemas/catalog.py`, `SiteContent`): add the five fields as
   optional, with the same names and shapes, e.g.

   ```python
   class Founder(BaseModel):
       name: str
       title: str
       portrait_alt: str | SkipJsonSchema[None] = None

   class TeamMember(BaseModel):
       name: str
       title: str
       bio: str | SkipJsonSchema[None] = None
       photo_url: str | SkipJsonSchema[None] = None

   class ProjectCounter(BaseModel):
       label: str
       value: int = Field(ge=0)
       suffix: str | SkipJsonSchema[None] = None

   class Sponsor(BaseModel):
       name: str
       logo_url: str | SkipJsonSchema[None] = None
       url: AnyUrl | SkipJsonSchema[None] = None

   # on SiteContent
   founder: Founder | SkipJsonSchema[None] = None
   what_we_do: list[TitledItem] = Field(default_factory=list)
   team: list[TeamMember] = Field(default_factory=list)
   projects: list[ProjectCounter] = Field(default_factory=list)
   sponsors: list[Sponsor] = Field(default_factory=list)
   ```

   Without this, `GET /site-content` silently drops the new keys, and
   `PUT /admin/site-content` loses them on save.
2. **Exported OpenAPI:** regenerate `packages/contract/openapi.generated.json` so the CI
   contract diff passes. Match the component names `TeamMember` and `Sponsor`. Inline objects
   (founder, projects item) may need `json_schema_extra`/titles to match the yaml; adjust
   whichever side is simpler, and tell the Frontend agent if the yaml should change.
3. **Seed:** `scripts/seed.py` already upserts the whole JSON, so no change is needed. Re-run
   `uv run python scripts/seed.py` locally.
4. **Tests:**
   - `GET /site-content` returns `founder`, `team`, `projects`, `sponsors`, `what_we_do` from the seed.
   - `PUT /admin/site-content` round-trips them (admin only, audit-logged as today).
   - A negative `projects[].value` → 422.
   - Old content without the new keys still validates.

## Not in scope

- No live stats endpoint. Counters are admin-set (client decision).
- No chatbot.

## Done when

- `pytest`, `ruff`, `mypy` and the contract diff job pass.
- A PR from `codex/site-content-v2` to `develop` is opened. The Frontend agent reviews it.
