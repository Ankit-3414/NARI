"""Tag serialization and deserialization utilities."""

import json
from typing import Any


def encode_tags(tags: list[str] | None) -> str | None:
    """Encode list of tags to a JSON string representation."""
    if tags is None:
        return None
    return json.dumps(tags)


def decode_tags(tags_json: str | None) -> list[str]:
    """Decode a tag JSON string to a list of strings."""
    if not tags_json:
        return []
    try:
        return list(json.loads(tags_json))
    except (json.JSONDecodeError, TypeError):
        return []
