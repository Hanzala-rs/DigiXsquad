from urllib.parse import parse_qs, urlsplit

import pytest
from fastapi.testclient import TestClient

from app.main import app


def test_presign_upload(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("S3_ENDPOINT", "http://localhost:9000")
    monkeypatch.setenv("S3_REGION", "auto")
    monkeypatch.setenv("S3_BUCKET", "digixsquad-private")
    monkeypatch.setenv("S3_ACCESS_KEY", "test-access")
    monkeypatch.setenv("S3_SECRET_KEY", "test-secret")
    monkeypatch.setenv("UPLOAD_MAX_MB", "1")
    payload = {
        "file_name": r"..\documents\terms and conditions.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 128,
    }

    with TestClient(app, client=("192.0.2.21", 12345)) as client:
        response = client.post("/api/v1/uploads/presign", json=payload)
        assert response.status_code == 200
        result = response.json()
        key = result["file_key"]
        assert key.startswith("uploads/")
        assert key.endswith("-terms-and-conditions.pdf")
        assert ".." not in key
        url = urlsplit(result["upload_url"])
        assert url.netloc == "localhost:9000"
        assert url.path == f"/digixsquad-private/{key}"
        query = parse_qs(url.query)
        assert query["X-Amz-SignedHeaders"] == ["content-length;content-type;host"]
        assert query["X-Amz-Expires"] == [str(result["expires_in"])]
        assert (
            client.post(
                "/api/v1/uploads/presign", json={**payload, "size_bytes": 1048577}
            ).status_code
            == 422
        )
        assert (
            client.post(
                "/api/v1/uploads/presign", json={**payload, "mime_type": "image/png"}
            ).status_code
            == 422
        )
