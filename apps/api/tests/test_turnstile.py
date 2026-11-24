import asyncio
from urllib.parse import parse_qs

import httpx
import pytest

from app.services.turnstile import SITEVERIFY_URL, verify_turnstile


@pytest.mark.parametrize(
    ("provider_status", "provider_body", "verified"),
    [
        (200, {"success": True}, True),
        (200, {"success": False}, False),
        (503, {}, False),
    ],
)
def test_turnstile_siteverify(
    monkeypatch: pytest.MonkeyPatch,
    provider_status: int,
    provider_body: dict[str, bool],
    verified: bool,
) -> None:
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "test-secret")

    def respond(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == SITEVERIFY_URL
        assert request.method == "POST"
        assert parse_qs(request.content.decode()) == {
            "secret": ["test-secret"],
            "response": ["test-token"],
        }
        return httpx.Response(provider_status, json=provider_body)

    client = httpx.AsyncClient(transport=httpx.MockTransport(respond))
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kwargs: client)

    assert asyncio.run(verify_turnstile("test-token")) is verified
