"""Migration + seed tests against a real PostgreSQL.

Set TEST_DATABASE_URL to a throwaway database (it is reset to empty), e.g.
    TEST_DATABASE_URL=postgresql+asyncpg://digix:digix@localhost:5432/digixsquad_test
CI provides one via a postgres service container. Skipped when unset.
"""

import asyncio
import os
from argparse import Namespace
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import command
from app.core import config as app_config
from app.core import db as app_db

URL = os.environ.get("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not URL, reason="TEST_DATABASE_URL not set")
API_DIR = Path(__file__).resolve().parents[1]
APP_TABLES = (
    "select count(*) from information_schema.tables "
    "where table_schema = 'public' and table_name <> 'alembic_version'"
)


def alembic_cfg() -> Config:
    cfg = Config(str(API_DIR / "alembic.ini"), cmd_opts=Namespace(x=[f"url={URL}"]))
    cfg.set_main_option("script_location", str(API_DIR / "alembic"))
    return cfg


def scalar(sql: str) -> object:
    async def go() -> object:
        engine = create_async_engine(str(URL))
        async with engine.connect() as conn:
            value = (await conn.execute(text(sql))).scalar()
        await engine.dispose()
        return value

    return asyncio.run(go())


def reset_app_caches() -> None:
    app_config.get_settings.cache_clear()
    app_db.get_engine.cache_clear()
    app_db.get_sessionmaker.cache_clear()


@pytest.fixture(scope="module")
def migrated_db() -> Iterator[None]:
    previous = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = str(URL)  # seed.py reads settings
    reset_app_caches()
    cfg = alembic_cfg()
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
    yield
    if previous is None:
        os.environ.pop("DATABASE_URL", None)
    else:
        os.environ["DATABASE_URL"] = previous
    reset_app_caches()


def test_migration_creates_all_tables(migrated_db: None) -> None:
    from app.models import Base

    assert scalar(APP_TABLES) == len(Base.metadata.tables) == 17


def test_models_match_migration(migrated_db: None) -> None:
    # Raises if autogenerate would emit any operation (models drifted from migrations).
    command.check(alembic_cfg())


def test_migration_downgrades_cleanly(migrated_db: None) -> None:
    cfg = alembic_cfg()
    command.downgrade(cfg, "base")
    assert scalar(APP_TABLES) == 0
    command.upgrade(cfg, "head")


def test_seed_is_idempotent(migrated_db: None) -> None:
    from scripts import seed

    async def twice() -> None:
        await seed.run()
        await seed.run()
        await app_db.get_engine().dispose()

    asyncio.run(twice())
    roles = seed.load("roles.json")
    squads = seed.load("squads.json")
    assert scalar("select count(*) from service_roles") == len(roles)
    assert scalar("select count(*) from squads") == len(squads)
    assert scalar("select count(*) from squad_roles") == sum(len(s["roles"]) for s in squads)
    assert scalar("select value->'about'->>'mission' from site_settings where key='site_content'")


def test_contract_rules_are_db_constraints(migrated_db: None) -> None:
    # GOVT => procurement_mode and SQUAD => squad_id also hold at the database level.
    names = "'ck_hire_requests_govt_procurement_required', 'ck_hire_requests_squad_required'"
    assert scalar(f"select count(*) from pg_constraint where conname in ({names})") == 2
