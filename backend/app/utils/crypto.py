"""Encryption utilities for at-rest data protection."""

import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet
from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)

# Derive a Fernet-compatible key from NARI_SECRET_KEY
def _get_fernet_key() -> bytes:
    """Derive a 32-byte base64-encoded key from the application secret."""
    key_bytes = settings.NARI_SECRET_KEY.encode()
    # Use SHA-256 to get a consistent 32-byte hash
    hash_bytes = hashlib.sha256(key_bytes).digest()
    return base64.urlsafe_b64encode(hash_bytes)

def encrypt_content(content: str) -> str:
    """Encrypt a string using the application secret."""
    if not content:
        return content
    
    try:
        f = Fernet(_get_fernet_key())
        return f.encrypt(content.encode()).decode()
    except Exception as e:
        logger.critical(f"Cryptographic failure: Encryption failed. {e}")
        raise RuntimeError("Database serialization failed due to secure storage failure.")

def decrypt_content(encrypted_content: str) -> Optional[str]:
    """Decrypt a string using the application secret."""
    if not encrypted_content:
        return encrypted_content
    
    try:
        f = Fernet(_get_fernet_key())
        return f.decrypt(encrypted_content.encode()).decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return None
