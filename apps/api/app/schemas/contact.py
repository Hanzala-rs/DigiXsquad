from pydantic import BaseModel, EmailStr, Field
from pydantic.json_schema import SkipJsonSchema


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | SkipJsonSchema[None] = Field(default=None, max_length=20)
    subject: str = Field(min_length=2, max_length=200)
    message: str = Field(min_length=10, max_length=3000)
    turnstile_token: str


class Ok(BaseModel):
    ok: bool
