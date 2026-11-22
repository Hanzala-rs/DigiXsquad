import json
from pathlib import Path

from app.main import app

if __name__ == "__main__":
    repository = Path(__file__).resolve().parents[3]
    destination = repository / "packages" / "contract" / "openapi.generated.json"
    destination.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
