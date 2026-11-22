"""Contract diff (AGENTS.md rule 3): implemented API vs packages/contract/openapi.yaml.

For every operation FastAPI exposes (prefix /api/v1 stripped) the contract must have the same
path + method + operationId. For every named response/request schema the app exposes, property
names, `required` and enums must match the contract schema of the same name. Operations the
contract has but the app doesn't yet are listed as pending, not errors (built phase by phase).

    uv run python -m scripts.check_contract     # exits 1 on mismatch
"""

import json
import sys
from typing import Any

import yaml

from app.core.config import REPO_ROOT
from app.main import app

PREFIX = "/api/v1"
METHODS = {"get", "post", "put", "patch", "delete"}
# FastAPI's own validation-error schemas: the contract models the 422 body separately.
IGNORED_SCHEMAS = {"HTTPValidationError", "ValidationError"}


def operations(spec: dict[str, Any], strip: str = "") -> dict[tuple[str, str], str]:
    out: dict[tuple[str, str], str] = {}
    for path, item in spec.get("paths", {}).items():
        p = path[len(strip) :] if strip and path.startswith(strip) else path
        for method, op in item.items():
            if method in METHODS:
                out[(method.upper(), p)] = op.get("operationId", "")
    return out


def shape(schema: dict[str, Any], schemas: dict[str, Any]) -> dict[str, Any]:
    """Comparable view of an object schema: properties, required, enum values."""
    if "$ref" in schema:
        schema = schemas[schema["$ref"].rsplit("/", 1)[-1]]
    props = schema.get("properties", {})

    def enum_of(s: dict[str, Any]) -> list[Any] | None:
        if "$ref" in s:
            s = schemas.get(s["$ref"].rsplit("/", 1)[-1], {})
        for key in ("anyOf", "oneOf"):
            for sub in s.get(key, []):
                e = enum_of(sub)
                if e:
                    return e
        return sorted(s["enum"]) if "enum" in s else None

    return {
        "properties": sorted(props),
        "required": sorted(schema.get("required", [])),
        "enums": {k: e for k, v in props.items() if (e := enum_of(v))},
        "enum": sorted(schema["enum"]) if "enum" in schema else None,
    }


def main() -> int:
    contract = yaml.safe_load((REPO_ROOT / "packages/contract/openapi.yaml").read_text("utf-8"))
    generated = app.openapi()
    (REPO_ROOT / "packages/contract/openapi.generated.json").write_text(
        json.dumps(generated, indent=2) + "\n", encoding="utf-8"
    )

    errors: list[str] = []
    want = operations(contract)
    have = operations(generated, strip=PREFIX)

    for key, op_id in sorted(have.items()):
        method, path = key
        if not path.startswith("/") or key not in want:
            errors.append(f"{method} {PREFIX}{path}: not in the contract")
        elif op_id != want[key]:
            errors.append(f"{method} {path}: operationId {op_id!r} != contract {want[key]!r}")

    c_schemas = contract.get("components", {}).get("schemas", {})
    g_schemas = generated.get("components", {}).get("schemas", {})
    for name in sorted(set(g_schemas) - IGNORED_SCHEMAS):
        if name not in c_schemas:
            continue  # inline in the contract (e.g. health response); checked via its operation
        a, b = shape(g_schemas[name], g_schemas), shape(c_schemas[name], c_schemas)
        if a != b:
            errors.append(f"schema {name}: app {a} != contract {b}")

    pending = sorted(set(want) - set(have))
    print(f"contract: {len(have)} implemented, {len(pending)} pending")
    for e in errors:
        print(f"  ✗ {e}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
