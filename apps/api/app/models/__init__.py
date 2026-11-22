"""All models, imported so `Base.metadata` is complete for Alembic and tests."""

from app.core.db import Base
from app.models.auth import RefreshToken, User
from app.models.catalog import ServiceRole, Squad, SquadRole
from app.models.requests import (
    Attachment,
    Contact,
    HireRequest,
    HireRequestItem,
    Organization,
    RequestActivity,
)
from app.models.system import AuditLog, ContactMessage, SiteSetting
from app.models.talent import Engagement, EngagementAssignment, Talent

__all__ = [
    "Attachment",
    "AuditLog",
    "Base",
    "Contact",
    "ContactMessage",
    "Engagement",
    "EngagementAssignment",
    "HireRequest",
    "HireRequestItem",
    "Organization",
    "RefreshToken",
    "RequestActivity",
    "ServiceRole",
    "SiteSetting",
    "Squad",
    "SquadRole",
    "Talent",
    "User",
]
