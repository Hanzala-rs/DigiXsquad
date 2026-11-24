import asyncio
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core.db import get_engine
from app.main import app
from scripts import seed


@pytest.fixture(scope="module")
def seeded_db(migrated_db: None) -> Iterator[None]:
    async def populate() -> None:
        try:
            await seed.run()
        finally:
            await get_engine().dispose()

    asyncio.run(populate())
    yield


def test_public_squads(seeded_db: None) -> None:
    seeds = seed.load("squads.json")
    with TestClient(app) as client:
        response = client.get("/api/v1/squads")
        assert response.status_code == 200
        squads = response.json()
        assert [squad["slug"] for squad in squads] == [
            squad["slug"] for squad in sorted(seeds, key=lambda seed: seed["sort_order"])
        ]
        for squad, expected in zip(
            squads, sorted(seeds, key=lambda s: s["sort_order"]), strict=True
        ):
            assert squad["is_active"]
            assert [(item["role"]["slug"], item["default_qty"]) for item in squad["roles"]] == [
                (item["role_slug"], item["default_qty"]) for item in expected["roles"]
            ]
            detail = client.get(f"/api/v1/squads/{squad['slug']}")
            assert detail.status_code == 200
            assert detail.json() == squad

        missing = client.get("/api/v1/squads/missing-squad")
        assert missing.status_code == 404
        assert missing.json() == {"detail": "Squad not found", "code": "NOT_FOUND"}
        assert client.get("/api/v1/squads/INVALID").status_code == 422


def test_public_roles(seeded_db: None) -> None:
    seeds = seed.load("roles.json")
    with TestClient(app) as client:
        response = client.get("/api/v1/roles")
        assert response.status_code == 200
        assert {role["slug"] for role in response.json()} == {role["slug"] for role in seeds}
        filtered = client.get("/api/v1/roles", params={"category": "DEVELOPMENT"})
        assert filtered.status_code == 200
        assert {role["slug"] for role in filtered.json()} == {
            role["slug"] for role in seeds if role["category"] == "DEVELOPMENT"
        }
        assert client.get("/api/v1/roles", params={"category": "invalid"}).status_code == 422
