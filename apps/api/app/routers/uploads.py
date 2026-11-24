from fastapi import APIRouter, Request
from fastapi.exceptions import RequestValidationError

from app.core.rate_limit import limiter
from app.schemas.catalog import Error
from app.schemas.uploads import PresignRequest, PresignResponse
from app.services.uploads import UPLOAD_TTL_SECONDS, StorageSettings, sign_upload

router = APIRouter(prefix="/api/v1", tags=["public"])


@router.post(
    "/uploads/presign",
    operation_id="presignUpload",
    response_description="Presigned URL",
    responses={429: {"model": Error, "description": "Too many requests"}},
)
@limiter.limit("5/minute")
def presign_upload(request: Request, body: PresignRequest) -> PresignResponse:
    settings = StorageSettings()  # type: ignore[call-arg]  # Loaded from the environment.
    if body.size_bytes > settings.upload_max_mb * 1024 * 1024:
        raise RequestValidationError(
            [
                {
                    "loc": ["body", "size_bytes"],
                    "msg": "File exceeds the configured upload limit",
                    "type": "value_error",
                }
            ]
        )

    upload_url, file_key = sign_upload(body, settings)
    return PresignResponse(upload_url=upload_url, file_key=file_key, expires_in=UPLOAD_TTL_SECONDS)
