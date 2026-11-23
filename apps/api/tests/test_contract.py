from scripts import check_contract


def test_implemented_routes_match_contract() -> None:
    assert check_contract.main() == 0


def test_operations_strip_prefix() -> None:
    spec = {"paths": {"/api/v1/squads": {"get": {"operationId": "listSquads"}, "parameters": []}}}
    assert check_contract.operations(spec, strip="/api/v1") == {("GET", "/squads"): "listSquads"}


def test_shape_detects_enum_and_required_drift() -> None:
    contract = {"type": "object", "required": ["a"], "properties": {"a": {"enum": ["X", "Y"]}}}
    drifted = {"type": "object", "required": [], "properties": {"a": {"enum": ["X"]}}}
    assert check_contract.shape(contract, {}) != check_contract.shape(drifted, {})
