from enum import StrEnum

from pydantic import BaseModel, Field

MAX_UPLOAD_BYTES = 10 * 1024 * 1024


class UploadMimeType(StrEnum):
    PDF = "application/pdf"
    DOC = "application/msword"
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


class PresignRequest(BaseModel):
    file_name: str = Field(max_length=200)
    mime_type: UploadMimeType
    size_bytes: int = Field(ge=1, le=MAX_UPLOAD_BYTES)


class PresignResponse(BaseModel):
    upload_url: str = Field(json_schema_extra={"format": "uri"})
    file_key: str
    expires_in: int
