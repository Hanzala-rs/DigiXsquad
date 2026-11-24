import httpx
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.config import REPO_ROOT

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


class TurnstileSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", extra="ignore")

    turnstile_secret_key: SecretStr


async def verify_turnstile(token: str) -> bool:
    if not token or len(token) > 2048:
        return False

    settings = TurnstileSettings()  # type: ignore[call-arg]  # Loaded from the environment.
    secret = settings.turnstile_secret_key.get_secret_value()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(SITEVERIFY_URL, data={"secret": secret, "response": token})
            response.raise_for_status()
            result = response.json()
    except (httpx.HTTPError, ValueError):
        return False

    return isinstance(result, dict) and result.get("success") is True
