from uuid import UUID

from pydantic import AnyUrl, BaseModel, ConfigDict, Field
from pydantic.json_schema import SkipJsonSchema

from app.models.enums import RoleCategory


class ServiceRole(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    title: str
    category: RoleCategory
    description: str
    skills: list[str]
    is_active: bool


class SquadRole(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: ServiceRole
    default_qty: int = Field(ge=1)


class Squad(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    tagline: str
    description: str
    icon: str
    sort_order: int
    is_active: bool
    use_cases: list[str]
    roles: list[SquadRole]


class Error(BaseModel):
    detail: str
    code: str | SkipJsonSchema[None] = None


class TitledItem(BaseModel):
    title: str
    description: str
    icon: str | SkipJsonSchema[None] = None


class Company(BaseModel):
    name: str
    tagline: str
    email: str
    phone: str
    address: str
    whatsapp: str | SkipJsonSchema[None] = None
    ntn: str | SkipJsonSchema[None] = None
    socials: dict[str, str] = Field(default_factory=dict)


class Hero(BaseModel):
    headline: str
    subheadline: str
    primary_cta: str
    secondary_cta: str


class About(BaseModel):
    story: str
    mission: str
    vision: str
    values: list[TitledItem]
    goals: list[str] = Field(default_factory=list)


class Stat(BaseModel):
    label: str
    value: str


class FAQ(BaseModel):
    question: str
    answer: str


class Founder(BaseModel):
    name: str
    title: str
    portrait_alt: str | SkipJsonSchema[None] = None


class TeamMember(BaseModel):
    name: str
    title: str
    bio: str | SkipJsonSchema[None] = None
    photo_url: str | SkipJsonSchema[None] = None


class ProjectCounter(BaseModel):
    label: str
    value: int = Field(ge=0, strict=True)
    suffix: str | SkipJsonSchema[None] = None


class Sponsor(BaseModel):
    name: str
    logo_url: str | SkipJsonSchema[None] = None
    url: AnyUrl | SkipJsonSchema[None] = None


class SiteContent(BaseModel):
    company: Company
    hero: Hero
    about: About
    why_us: list[TitledItem]
    stats: list[Stat]
    process: list[TitledItem]
    faqs: list[FAQ]
    compliance: list[TitledItem]
    founder: Founder | SkipJsonSchema[None] = None
    what_we_do: list[TitledItem] = Field(default_factory=list)
    team: list[TeamMember] = Field(default_factory=list)
    projects: list[ProjectCounter] = Field(default_factory=list)
    sponsors: list[Sponsor] = Field(default_factory=list)
