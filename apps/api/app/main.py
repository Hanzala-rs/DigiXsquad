from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import http_exception_handler
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from slowapi.errors import RateLimitExceeded

from app.core.db import get_engine
from app.core.rate_limit import limiter, rate_limit_response
from app.routers.catalog import router as catalog_router
from app.routers.contact import router as contact_router
from app.routers.uploads import router as uploads_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        yield
    finally:
        await get_engine().dispose()


app = FastAPI(title="DigixSquad API", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_response)
app.include_router(catalog_router)
app.include_router(contact_router)
app.include_router(uploads_router)


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
