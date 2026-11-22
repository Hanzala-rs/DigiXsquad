import uuid

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, IdMixin, TimestampMixin
from app.models._types import str_enum
from app.models.enums import RoleCategory


class ServiceRole(IdMixin, TimestampMixin, Base):
    """Contract: ServiceRole. Seeded from packages/contract/seed/roles.json (upsert by slug)."""

    __tablename__ = "service_roles"

    slug: Mapped[str] = mapped_column(String(80), unique=True)
    title: Mapped[str] = mapped_column(String(120))
    category: Mapped[RoleCategory] = mapped_column(
        str_enum(RoleCategory, "role_category"), index=True
    )
    description: Mapped[str] = mapped_column(Text)
    skills: Mapped[list[str]] = mapped_column(ARRAY(String(60)), server_default="{}")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")


class Squad(IdMixin, TimestampMixin, Base):
    """Contract: Squad. Seeded from packages/contract/seed/squads.json (upsert by slug)."""

    __tablename__ = "squads"

    slug: Mapped[str] = mapped_column(String(80), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    tagline: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(60))
    sort_order: Mapped[int] = mapped_column(Integer, server_default="0")
    use_cases: Mapped[list[str]] = mapped_column(ARRAY(String(200)), server_default="{}")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")

    roles: Mapped[list["SquadRole"]] = relationship(
        back_populates="squad",
        cascade="all, delete-orphan",
        order_by="SquadRole.position",
        lazy="selectin",
    )


class SquadRole(IdMixin, TimestampMixin, Base):
    """Contract: SquadRole (role + default_qty), ordered as in the seed."""

    __tablename__ = "squad_roles"
    __table_args__ = (
        UniqueConstraint("squad_id", "role_id"),
        CheckConstraint("default_qty BETWEEN 1 AND 20", name="default_qty_range"),
    )

    squad_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("squads.id", ondelete="CASCADE"), index=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("service_roles.id", ondelete="RESTRICT"))
    default_qty: Mapped[int] = mapped_column(Integer, server_default="1")
    position: Mapped[int] = mapped_column(Integer, server_default="0")

    squad: Mapped[Squad] = relationship(back_populates="roles")
    role: Mapped[ServiceRole] = relationship(lazy="joined")
