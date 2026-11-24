from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.auth import require_role
from app.core.db import DatabaseSession
from app.models.auth import User
from app.models.enums import UserRole
from app.models.system import AuditLog, SiteSetting
from app.schemas.catalog import Error, SiteContent

router = APIRouter(prefix="/api/v1")
SITE_CONTENT_KEY = "site_content"


@router.get(
    "/site-content",
    operation_id="getSiteContent",
    tags=["public"],
    response_description="Site content",
    response_model_exclude_none=True,
    response_model_exclude_unset=True,
)
async def get_site_content(session: DatabaseSession) -> SiteContent:
    content = await session.scalar(
        select(SiteSetting.value).where(SiteSetting.key == SITE_CONTENT_KEY)
    )
    if content is None:
        raise HTTPException(
            503, detail={"detail": "Site content is unavailable", "code": "SITE_CONTENT_MISSING"}
        )
    return SiteContent.model_validate(content)


@router.put(
    "/admin/site-content",
    operation_id="adminUpdateSiteContent",
    tags=["admin-catalog"],
    description="SUPER_ADMIN only.",
    response_description="Updated",
    response_model_exclude_none=True,
    response_model_exclude_unset=True,
    responses={403: {"model": Error, "description": "Forbidden"}},
)
async def update_site_content(
    content: SiteContent,
    request: Request,
    session: DatabaseSession,
    admin: Annotated[User, Depends(require_role(UserRole.SUPER_ADMIN))],
) -> SiteContent:
    value = content.model_dump(mode="json", exclude_none=True, exclude_unset=True)
    # Ensure there is a row to lock even on an unseeded database.
    inserted_id = await session.scalar(
        insert(SiteSetting)
        .values(key=SITE_CONTENT_KEY, value=value)
        .on_conflict_do_nothing(index_elements=[SiteSetting.key])
        .returning(SiteSetting.id)
    )
    setting = (
        await session.scalars(
            select(SiteSetting).where(SiteSetting.key == SITE_CONTENT_KEY).with_for_update()
        )
    ).one()
    previous = setting.value if inserted_id is None else None
    setting.value = value
    session.add(
        AuditLog(
            user_id=admin.id,
            action="update",
            entity="site_content",
            entity_id=str(setting.id),
            diff={"before": previous, "after": value},
            ip=request.client.host if request.client else None,
        )
    )
    await session.commit()
    return content
