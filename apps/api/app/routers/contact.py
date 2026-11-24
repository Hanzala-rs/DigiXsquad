from fastapi import APIRouter, Request
from fastapi.exceptions import RequestValidationError

from app.core.db import DatabaseSession
from app.core.rate_limit import limiter
from app.models.system import ContactMessage
from app.schemas.catalog import Error
from app.schemas.contact import ContactMessageCreate, Ok
from app.services.turnstile import verify_turnstile

router = APIRouter(prefix="/api/v1", tags=["public"])


@router.post(
    "/contact",
    operation_id="createContactMessage",
    status_code=201,
    response_description="Received",
    responses={429: {"model": Error, "description": "Too many requests"}},
)
@limiter.limit("5/minute")
async def create_contact_message(
    request: Request, body: ContactMessageCreate, session: DatabaseSession
) -> Ok:
    if not await verify_turnstile(body.turnstile_token):
        raise RequestValidationError(
            [
                {
                    "loc": ["body", "turnstile_token"],
                    "msg": "Turnstile verification failed",
                    "type": "value_error",
                }
            ]
        )

    session.add(
        ContactMessage(
            name=body.name,
            email=body.email,
            phone=body.phone,
            subject=body.subject,
            message=body.message,
        )
    )
    await session.commit()
    return Ok(ok=True)
