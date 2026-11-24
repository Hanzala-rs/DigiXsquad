import asyncio
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import get_settings
from app.main import app
from app.models.system import ContactMessage
from app.routers import contact


async def verify_and_remove_message(email: str) -> None:
    engine = create_async_engine(get_settings().database_url)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            message = await session.scalar(
                select(ContactMessage).where(ContactMessage.email == email)
            )
            await session.execute(delete(ContactMessage).where(ContactMessage.email == email))
            await session.commit()
            assert message is not None
            assert message.name == "Contact Test"
            assert message.phone is None
            assert message.subject == "Inquiry"
            assert message.message == "Please send me the details."
    finally:
        await engine.dispose()


def test_contact_verification_persistence_and_rate_limit(
    migrated_db: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    verify = AsyncMock(side_effect=[True, False, False, False, False, False])
    monkeypatch.setattr(contact, "verify_turnstile", verify)
    email = f"contact-{uuid4().hex}@example.com"
    body = {
        "name": "Contact Test",
        "email": email,
        "subject": "Inquiry",
        "message": "Please send me the details.",
        "turnstile_token": "test-token",
    }

    with TestClient(app, client=("192.0.2.11", 12345)) as client:
        success = client.post("/api/v1/contact", json=body)
        assert success.status_code == 201
        assert success.json() == {"ok": True}
        asyncio.run(verify_and_remove_message(email))

        for _ in range(4):
            rejected = client.post("/api/v1/contact", json=body)
            assert rejected.status_code == 422
            assert rejected.json()["detail"][0]["loc"] == ["body", "turnstile_token"]

        limited = client.post("/api/v1/contact", json=body)
        assert limited.status_code == 429
        assert limited.json() == {
            "detail": "Too many requests",
            "code": "RATE_LIMITED",
        }
        assert verify.await_count == 5

    with TestClient(app, client=("192.0.2.12", 12345)) as client:
        assert client.post("/api/v1/contact", json=body).status_code == 422
        assert verify.await_count == 6

        invalid = client.post("/api/v1/contact", json={**body, "email": "invalid"})
        assert invalid.status_code == 422
        assert invalid.json()["detail"][0]["loc"] == ["body", "email"]
        assert verify.await_count == 6

    async def check_no_rejected_messages() -> None:
        engine = create_async_engine(get_settings().database_url)
        try:
            async with AsyncSession(engine) as session:
                assert (
                    await session.scalar(
                        select(ContactMessage.id).where(ContactMessage.email == email)
                    )
                    is None
                )
        finally:
            await engine.dispose()

    asyncio.run(check_no_rejected_messages())
