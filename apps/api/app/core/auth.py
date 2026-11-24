from collections.abc import Awaitable, Callable
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyCookie

from app.core.config import get_settings
from app.core.db import DatabaseSession
from app.models.auth import User
from app.models.enums import UserRole

access_cookie = APIKeyCookie(name="ds_access", scheme_name="cookieAuth", auto_error=False)


async def get_access_user(
    session: DatabaseSession, token: Annotated[str | None, Security(access_cookie)]
) -> User:
    unauthorized = HTTPException(
        401, detail={"detail": "Valid access cookie required", "code": "UNAUTHORIZED"}
    )
    secret = get_settings().jwt_secret
    if not token or len(secret.encode()) < 32:
        raise unauthorized
    try:
        claims = jwt.decode(
            token, secret, algorithms=["HS256"], options={"require": ["exp", "sub", "type"]}
        )
        user_id = UUID(claims["sub"])
    except (jwt.InvalidTokenError, ValueError) as exc:
        raise unauthorized from exc
    if claims["type"] != "access":
        raise unauthorized
    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


def require_role(*roles: UserRole) -> Callable[..., Awaitable[User]]:
    async def check(user: Annotated[User, Depends(get_access_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(403, detail={"detail": "Forbidden", "code": "FORBIDDEN"})
        return user

    return check
