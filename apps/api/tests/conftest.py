import os
from argparse import Namespace
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic.config import Config

from alembic import command
from app.core import config as app_config
from app.core import db as app_db

URL = os.environ.get("TEST_DATABASE_URL")
API_DIR = Path(__file__).resolve().parents[1]


def alembic_cfg() -> Config:
    cfg = Config(str(API_DIR / "alembic.ini"), cmd_opts=Namespace(x=[f"url={URL}"]))
    cfg.set_main_option("script_location", str(API_DIR / "alembic"))
    return cfg


def reset_app_caches() -> None:
    app_config.get_settings.cache_clear()
    app_db.get_engine.cache_clear()
    app_db.get_sessionmaker.cache_clear()


@pytest.fixture(scope="module")
def migrated_db() -> Iterator[None]:
    if not URL:
        pytest.skip("TEST_DATABASE_URL not set")
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


@pytest.fixture
def migration_config() -> Config:
    return alembic_cfg()
