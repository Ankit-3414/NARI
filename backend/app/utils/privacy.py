"""Privacy and PII redaction utilities."""

import json
import re
from typing import Any

DEFAULT_SENSITIVE_FIELDS = {
    "title",
    "name",
    "description",
    "content_markdown",
    "notes",
    "goal_text",
    "summary",
    "message",
    "payload",
    "tags",
    "text",
    "note",
    "observation",
}

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")
CREDIT_CARD_REGEX = re.compile(r"\b(?:\d[ -]*?){13,16}\b")


def redact_pii(data: Any, sensitive_fields: set[str] = DEFAULT_SENSITIVE_FIELDS) -> Any:
    """
    Recursively redact sensitive fields from a data structure.
    
    If a key matches sensitive_fields, its value is replaced with a 
    redaction marker including the original length.
    """
    if isinstance(data, dict):
        return {
            key: (
                redact_pii(value, sensitive_fields)
                if key not in sensitive_fields
                else _redact_value(value)
            )
            for key, value in data.items()
        }
    elif isinstance(data, list):
        return [redact_pii(item, sensitive_fields) for item in data]
    return data


def _redact_value(value: Any) -> str:
    """Format a redaction marker for a value."""
    if value is None:
        return None
    # Use str() to get length even for non-string types
    return f"[REDACTED:{len(str(value))} chars]"


def redact_json_payload(
    payload: dict[str, Any] | None,
    sensitive_fields: set[str] = DEFAULT_SENSITIVE_FIELDS
) -> str | None:
    """Redact a dictionary and return it as a JSON string."""
    if payload is None:
        return None
    return json.dumps(redact_pii(payload, sensitive_fields))


def redact_text_pii(text: str) -> str:
    """Mask email addresses, phone numbers, and credit cards with redaction markers from raw text."""
    if not text:
        return text
    
    text = EMAIL_REGEX.sub("[REDACTED:EMAIL]", text)
    text = PHONE_REGEX.sub("[REDACTED:PHONE]", text)
    text = CREDIT_CARD_REGEX.sub("[REDACTED:CARD]", text)
    return text
