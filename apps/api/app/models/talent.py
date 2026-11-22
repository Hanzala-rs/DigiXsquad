import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, IdMixin, TimestampMixin
from app.models._types import str_enum
from app.models.catalog import ServiceRole
from app.models.enums import Availability, EngagementStatus, Seniority
from app.models.requests import Attachment, HireRequest


class Talent(IdMixin, TimestampMixin, Base):
    """Contract: Talent. `monthly_cost` is internal (hidden from SALES, AGENTS.md RBAC)."""

    __tablename__ = "talents"
    __table_args__ = (
        Index("uq_talents_email_lower", text("lower(email)"), unique=True),
        CheckConstraint("experience_years BETWEEN 0 AND 50", name="experience_range"),
        CheckConstraint("monthly_cost IS NULL OR monthly_cost >= 0", name="monthly_cost_positive"),
    )

    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str] = mapped_column(String(20))
    primary_role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("service_roles.id", ondelete="RESTRICT"), index=True
    )
    seniority: Mapped[Seniority] = mapped_column(str_enum(Seniority, "seniority"))
    skills: Mapped[list[str]] = mapped_column(ARRAY(String(60)), server_default="{}")
    experience_years: Mapped[Decimal] = mapped_column(Numeric(4, 1))
    availability: Mapped[Availability] = mapped_column(
        str_enum(Availability, "availability"), index=True
    )
    monthly_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    city: Mapped[str | None] = mapped_column(String(80))
    cv_attachment_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("attachments.id", ondelete="SET NULL")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")

    primary_role: Mapped[ServiceRole] = relationship(lazy="joined")
    cv_attachment: Mapped[Attachment | None] = relationship()


class Engagement(IdMixin, TimestampMixin, Base):
    """Contract: Engagement. A won request turned into a contract (renewals: renewed_from_id)."""

    __tablename__ = "engagements"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="dates_ordered"),
        CheckConstraint("monthly_fee >= 0", name="monthly_fee_positive"),
        Index("ix_engagements_status_end_date", "status", "end_date"),
    )

    hire_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("hire_requests.id", ondelete="RESTRICT"), index=True
    )
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    monthly_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), server_default="PKR")
    status: Mapped[EngagementStatus] = mapped_column(
        str_enum(EngagementStatus, "engagement_status"),
        server_default=EngagementStatus.ACTIVE.value,
    )
    renewed_from_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("engagements.id", ondelete="SET NULL")
    )
    # Set by the daily renewal-reminder job so each engagement is reminded once.
    renewal_reminded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    hire_request: Mapped[HireRequest] = relationship(lazy="joined")
    assignments: Mapped[list["EngagementAssignment"]] = relationship(
        back_populates="engagement", cascade="all, delete-orphan", lazy="selectin"
    )


class EngagementAssignment(IdMixin, TimestampMixin, Base):
    """Contract: Assignment (talent placed on an engagement in a role)."""

    __tablename__ = "engagement_assignments"
    __table_args__ = (
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="dates_ordered"),
    )

    engagement_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("engagements.id", ondelete="CASCADE"), index=True
    )
    talent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("talents.id", ondelete="RESTRICT"), index=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("service_roles.id", ondelete="RESTRICT"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)

    engagement: Mapped[Engagement] = relationship(back_populates="assignments")
    talent: Mapped[Talent] = relationship(lazy="joined")
    role: Mapped[ServiceRole] = relationship(lazy="joined")
