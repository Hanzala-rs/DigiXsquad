"""Enums mirroring `components.schemas` in packages/contract/openapi.yaml (names and values)."""

from enum import StrEnum


class OrgType(StrEnum):
    GOVT = "GOVT"
    PRIVATE = "PRIVATE"


class RequestType(StrEnum):
    SINGLE_ROLE = "SINGLE_ROLE"
    SQUAD = "SQUAD"
    CUSTOM_TEAM = "CUSTOM_TEAM"


class Seniority(StrEnum):
    JUNIOR = "JUNIOR"
    MID = "MID"
    SENIOR = "SENIOR"
    LEAD = "LEAD"


class EngagementMode(StrEnum):
    ONSITE = "ONSITE"
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"


class ContractType(StrEnum):
    MONTHLY = "MONTHLY"
    PROJECT = "PROJECT"


class ProcurementMode(StrEnum):
    DIRECT = "DIRECT"
    RFQ = "RFQ"
    OPEN_TENDER = "OPEN_TENDER"
    FRAMEWORK = "FRAMEWORK"
    NOT_SURE = "NOT_SURE"


class BudgetRange(StrEnum):
    PKR_UNDER_200K = "PKR_UNDER_200K"
    PKR_200K_500K = "PKR_200K_500K"
    PKR_500K_1M = "PKR_500K_1M"
    PKR_1M_3M = "PKR_1M_3M"
    PKR_3M_PLUS = "PKR_3M_PLUS"
    NOT_SURE = "NOT_SURE"


class RequestStatus(StrEnum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    PROPOSAL_SENT = "PROPOSAL_SENT"
    NEGOTIATION = "NEGOTIATION"
    WON = "WON"
    LOST = "LOST"
    ON_HOLD = "ON_HOLD"


class RoleCategory(StrEnum):
    DEVELOPMENT = "DEVELOPMENT"
    DIGITAL_MEDIA = "DIGITAL_MEDIA"
    DATA_AI = "DATA_AI"
    IT_SUPPORT = "IT_SUPPORT"
    DIGITAL_MARKETING = "DIGITAL_MARKETING"
    MANAGEMENT = "MANAGEMENT"


class UserRole(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SALES = "SALES"
    OPS = "OPS"


class Availability(StrEnum):
    AVAILABLE = "AVAILABLE"
    ON_ENGAGEMENT = "ON_ENGAGEMENT"
    NOTICE_PERIOD = "NOTICE_PERIOD"
    INACTIVE = "INACTIVE"


class EngagementStatus(StrEnum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    TERMINATED = "TERMINATED"


class ActivityType(StrEnum):
    NOTE = "NOTE"
    STATUS_CHANGE = "STATUS_CHANGE"
    ASSIGNMENT = "ASSIGNMENT"
    EMAIL = "EMAIL"
    SYSTEM = "SYSTEM"
