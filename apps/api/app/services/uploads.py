import re
from datetime import UTC, datetime
from uuid import uuid4

import boto3  # type: ignore[import-untyped]
from botocore.config import Config  # type: ignore[import-untyped]
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.config import REPO_ROOT
from app.schemas.uploads import PresignRequest

UPLOAD_TTL_SECONDS = 300


class StorageSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", extra="ignore")

    s3_endpoint: str
    s3_region: str
    s3_bucket: str
    s3_access_key: SecretStr
    s3_secret_key: SecretStr
    upload_max_mb: int = Field(default=10, gt=0)


def sign_upload(body: PresignRequest, settings: StorageSettings) -> tuple[str, str]:
    basename = body.file_name.replace("\\", "/").rsplit("/", 1)[-1]
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", basename).strip(".-") or "attachment"
    current = datetime.now(UTC)
    file_key = f"uploads/{current:%Y/%m}/{uuid4()}-{safe_name}"

    client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key.get_secret_value(),
        aws_secret_access_key=settings.s3_secret_key.get_secret_value(),
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )
    try:
        upload_url: str = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.s3_bucket,
                "Key": file_key,
                "ContentType": body.mime_type.value,
                "ContentLength": body.size_bytes,
            },
            ExpiresIn=UPLOAD_TTL_SECONDS,
            HttpMethod="PUT",
        )
    finally:
        client.close()
    return upload_url, file_key
