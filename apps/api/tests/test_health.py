from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    response = TestClient(app).get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_openapi() -> None:
    spec = app.openapi()
    operation = spec["paths"]["/api/v1/health"]["get"]
    schema = spec["components"]["schemas"]["HealthResponse"]

    assert operation["operationId"] == "getHealth"
    assert schema["required"] == ["status"]
    assert schema["properties"]["status"]["enum"] == ["ok"]
