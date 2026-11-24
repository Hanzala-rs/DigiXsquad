from app.schemas.catalog import SiteContent
from scripts.seed import load


def test_legacy_site_content_remains_valid() -> None:
    legacy = load("site-content.json")
    for field in ("founder", "what_we_do", "team", "projects", "sponsors"):
        del legacy[field]

    content = SiteContent.model_validate(legacy)

    assert content.model_dump(mode="json", exclude_unset=True, exclude_none=True) == legacy
