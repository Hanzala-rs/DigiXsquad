from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="DigixSquad API", version="0.1.0")


class HealthResponse(BaseModel):
    status: Literal["ok"] = Field(json_schema_extra={"enum": ["ok"]})


@app.get(
    "/api/v1/health",
    operation_id="getHealth",
    tags=["public"],
    response_description="OK",
)
def health() -> HealthResponse:
    return HealthResponse(status="ok")
