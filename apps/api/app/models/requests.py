import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, IdMixin, TimestampMixin
from app.models._types import str_enum
from app.models.catalog import ServiceRole, Squad
from app.models.enums import (
    ActivityType,
    BudgetRange,
    ContractType,
    EngagementMode,
    OrgType,
    ProcurementMode,
    RequestStatus,
    RequestType,
    Seniority,
)


class Organization(IdMixin, TimestampMixin, Base):
    """Contract: OrganizationInput (+ org_type)."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(200), index=True)
    org_type: Mapped[OrgType] = mapped_column(str_enum(OrgType, "org_type"))
    department_or_industry: Mapped[str | None] = mapped_column(String(200))
    ntn: Mapped[str | None] = mapped_column(String(20))
    city: Mapped[str | None] = mapped_column(String(80))
    website: Mapped[str | None] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")


class Contact(IdMixin, TimestampMixin, Base):
    """Contract: ContactInput. Reused by email on new requests (createHireRequest description)."""

    __tablename__ = "contacts"
    __table_args__ = (Index("uq_contacts_email_lower", text("lower(email)"), unique=True),)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    designation: Mapped[str | None] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str] = mapped_column(String(20))
    whatsapp: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")

    organization: Mapped[Organization] = relationship(lazy="joined")


class HireRequest(IdMixin, TimestampMixin, Base):
    """Contract: HireRequestCreate / HireRequestSummary / HireRequestDetail."""

    __tablename__ = "hire_requests"
    __table_args__ = (
        CheckConstraint("duration_months BETWEEN 1 AND 36", name="duration_range"),
        CheckConstraint(
            "org_type <> 'GOVT' OR procurement_mode IS NOT NULL", name="govt_procurement_required"
        ),
        CheckConstraint("request_type <> 'SQUAD' OR squad_id IS NOT NULL", name="squad_required"),
        Index("ix_hire_requests_status_created", "status", "created_at"),
    )

    ref_no: Mapped[str] = mapped_column(String(20), unique=True)  # DS-{YYYY}-{seq:04d}
    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"), index=True
    )
    contact_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("contacts.id", ondelete="RESTRICT"), index=True
    )
    org_type: Mapped[OrgType] = mapped_column(str_enum(OrgType, "org_type"))
    request_type: Mapped[RequestType] = mapped_column(str_enum(RequestType, "request_type"))
    squad_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("squads.id", ondelete="SET NULL"))
    duration_months: Mapped[int] = mapped_column(Integer)
    start_date: Mapped[date] = mapped_column(Date)
    engagement_mode: Mapped[EngagementMode] = mapped_column(
        str_enum(EngagementMode, "engagement_mode")
    )
    city: Mapped[str | None] = mapped_column(String(80))
    contract_type: Mapped[ContractType] = mapped_column(str_enum(ContractType, "contract_type"))
    procurement_mode: Mapped[ProcurementMode | None] = mapped_column(
        str_enum(ProcurementMode, "procurement_mode")
    )
    tender_ref: Mapped[str | None] = mapped_column(String(120))
    budget_range: Mapped[BudgetRange | None] = mapped_column(str_enum(BudgetRange, "budget_range"))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[RequestStatus] = mapped_column(
        str_enum(RequestStatus, "request_status"), server_default=RequestStatus.NEW.value
    )
    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")

    organization: Mapped[Organization] = relationship(lazy="joined")
    contact: Mapped[Contact] = relationship(lazy="joined")
    squad: Mapped[Squad | None] = relationship(lazy="joined")
    items: Mapped[list["HireRequestItem"]] = relationship(
        back_populates="hire_request", cascade="all, delete-orphan", lazy="selectin"
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        back_populates="hire_request", lazy="selectin"
    )
    activities: Mapped[list["RequestActivity"]] = relationship(
        back_populates="hire_request",
        cascade="all, delete-orphan",
        order_by="RequestActivity.created_at",
        lazy="selectin",
    )


class HireRequestItem(IdMixin, TimestampMixin, Base):
    """Contract: HireRequestItem."""

    __tablename__ = "hire_request_items"
    __table_args__ = (CheckConstraint("quantity BETWEEN 1 AND 20", name="quantity_range"),)

    hire_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("hire_requests.id", ondelete="CASCADE"), index=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("service_roles.id", ondelete="RESTRICT"))
    quantity: Mapped[int] = mapped_column(Integer)
    seniority: Mapped[Seniority] = mapped_column(str_enum(Seniority, "seniority"))
    skills_note: Mapped[str | None] = mapped_column(String(500))

    hire_request: Mapped[HireRequest] = relationship(back_populates="items")
    role: Mapped[ServiceRole] = relationship(lazy="joined")


class Attachment(IdMixin, TimestampMixin, Base):
    """Contract: Attachment. File lives in the private bucket under `file_key`."""

    __tablename__ = "attachments"

    file_key: Mapped[str] = mapped_column(String(400), unique=True)
    file_name: Mapped[str] = mapped_column(String(200))
    mime_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    hire_request_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("hire_requests.id", ondelete="CASCADE"), index=True
    )

    hire_request: Mapped[HireRequest | None] = relationship(back_populates="attachments")


class RequestActivity(IdMixin, TimestampMixin, Base):
    """Contract: Activity. STATUS_CHANGE rows also feed the public /track timeline (meta.status)."""

    __tablename__ = "request_activities"

    hire_request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("hire_requests.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[ActivityType] = mapped_column(str_enum(ActivityType, "activity_type"))
    body: Mapped[str] = mapped_column(Text)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    meta: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    hire_request: Mapped[HireRequest] = relationship(back_populates="activities")
