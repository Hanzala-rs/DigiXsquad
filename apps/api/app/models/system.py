import uuid
from typing import Any

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, IdMixin, TimestampMixin


class ContactMessage(IdMixin, TimestampMixin, Base):
    """Contract: ContactMessage (public contact form)."""

    __tablename__ = "contact_messages"
    __table_args__ = (Index("ix_contact_messages_created_at", "created_at"),)

    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str | None] = mapped_column(String(20))
    subject: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)


class AuditLog(IdMixin, TimestampMixin, Base):
    """Contract: AuditLog. One row per admin mutation (AGENTS.md conventions)."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_entity", "entity", "entity_id"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(80))
    entity: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[str] = mapped_column(String(64))
    diff: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ip: Mapped[str | None] = mapped_column(String(45))


class SiteSetting(IdMixin, TimestampMixin, Base):
    """Key/value JSONB settings. Key `site_content` holds the contract's SiteContent object."""

    __tablename__ = "site_settings"

    key: Mapped[str] = mapped_column(String(80), unique=True)
    value: Mapped[dict[str, Any]] = mapped_column(JSONB)
