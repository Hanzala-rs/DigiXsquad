"""Seed catalog + site content from packages/contract/seed/*.json.

Idempotent (AGENTS.md): roles and squads upsert by slug, squad line-ups are replaced,
site content upserts by key. Never hardcode catalog data here.

    uv run python -m scripts.seed
"""

import asyncio
import json
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import REPO_ROOT
from app.core.db import get_engine, get_sessionmaker
from app.models import ServiceRole, SiteSetting, Squad, SquadRole

SEED_DIR = REPO_ROOT / "packages" / "contract" / "seed"


def load(name: str) -> Any:
    return json.loads((SEED_DIR / name).read_text(encoding="utf-8"))


async def seed_roles(session: AsyncSession, roles: list[dict[str, Any]]) -> dict[str, Any]:
    for r in roles:
        values = {
            "slug": r["slug"],
            "title": r["title"],
            "category": r["category"],
            "description": r["description"],
            "skills": r.get("skills", []),
            "is_active": r.get("is_active", True),
        }
        stmt = insert(ServiceRole).values(**values)
        await session.execute(
            stmt.on_conflict_do_update(
                index_elements=[ServiceRole.slug],
                set_={k: stmt.excluded[k] for k in values if k != "slug"},
            )
        )
    rows = await session.execute(select(ServiceRole.slug, ServiceRole.id))
    return {slug: id_ for slug, id_ in rows.all()}


async def seed_squads(
    session: AsyncSession, squads: list[dict[str, Any]], role_ids: dict[str, Any]
) -> None:
    for s in squads:
        values = {
            "slug": s["slug"],
            "name": s["name"],
            "tagline": s["tagline"],
            "description": s["description"],
            "icon": s["icon"],
            "sort_order": s.get("sort_order", 0),
            "use_cases": s.get("use_cases", []),
            "is_active": s.get("is_active", True),
        }
        stmt = insert(Squad).values(**values)
        squad_id = (
            await session.execute(
                stmt.on_conflict_do_update(
                    index_elements=[Squad.slug],
                    set_={k: stmt.excluded[k] for k in values if k != "slug"},
                ).returning(Squad.id)
            )
        ).scalar_one()

        await session.execute(delete(SquadRole).where(SquadRole.squad_id == squad_id))
        for position, item in enumerate(s["roles"]):
            role_id = role_ids.get(item["role_slug"])
            if role_id is None:
                raise ValueError(
                    f"squads.json: unknown role_slug {item['role_slug']!r} in {s['slug']}"
                )
            session.add(
                SquadRole(
                    squad_id=squad_id,
                    role_id=role_id,
                    default_qty=item["default_qty"],
                    position=position,
                )
            )


async def seed_site_content(session: AsyncSession, content: dict[str, Any]) -> None:
    stmt = insert(SiteSetting).values(key="site_content", value=content)
    await session.execute(
        stmt.on_conflict_do_update(
            index_elements=[SiteSetting.key], set_={"value": stmt.excluded.value}
        )
    )


async def run() -> dict[str, int]:
    roles, squads, content = load("roles.json"), load("squads.json"), load("site-content.json")
    async with get_sessionmaker()() as session, session.begin():
        role_ids = await seed_roles(session, roles)
        await seed_squads(session, squads, role_ids)
        await seed_site_content(session, content)
    return {"roles": len(roles), "squads": len(squads), "site_content": 1}


async def main() -> None:
    try:
        counts = await run()
        print("seeded", ", ".join(f"{k}={v}" for k, v in counts.items()))
    finally:
        await get_engine().dispose()


if __name__ == "__main__":
    asyncio.run(main())
