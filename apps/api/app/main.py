from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from app.routers.catalog import router as catalog_router

app = FastAPI(title="DigixSquad API", version="0.1.0")
app.include_router(catalog_router)


@app.exception_handler(HTTPException)
async def api_error(request: Request, exc: HTTPException) -> Response:
    if isinstance(exc.detail, dict):
        return JSONResponse(exc.detail, status_code=exc.status_code, headers=exc.headers)
    return await http_exception_handler(request, exc)


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
