"""User and settings service."""

import json
from typing import Any

from sqlmodel import Session, select
from ..core.errors import NariError
from ..models.user import User
from ..utils.crypto import encrypt_content, decrypt_content

class UserService:
    """Service to handle user profile and secure settings."""

    DEFAULT_USERNAME = "default_user"

    def get_default_user(self, session: Session) -> User:
        """Get or create the default single user."""
        user = session.exec(select(User).where(User.username == self.DEFAULT_USERNAME)).first()
        if not user:
            # Create a default user
            user = User(
                username=self.DEFAULT_USERNAME,
                display_name="NARI User",
                api_key_hash="hashed_by_system",  # placeholder, unused currently for internal auth
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        return user

    def get_settings(self, session: Session) -> dict[str, Any]:
        """Retrieve user settings, including AI provider keys (masked)."""
        user = self.get_default_user(session)
        preferences = {}
        if user.preferences_json:
            try:
                preferences = json.loads(user.preferences_json)
            except Exception:
                preferences = {}

        # Mask sensitive keys for frontend display
        for key in ["nvidia_api_key", "groq_api_key", "anthropic_api_key"]:
            if key in preferences:
                val = decrypt_content(preferences[key])
                if val and len(val) > 8:
                    preferences[f"{key}_masked"] = f"{key[:5]}...{val[-4:]}"
                    preferences[f"has_{key}"] = True
                else:
                    preferences[f"has_{key}"] = False
                del preferences[key]
            else:
                preferences[f"has_{key}"] = False
            
        return preferences

    def update_settings(self, session: Session, new_settings: dict[str, Any]) -> dict[str, Any]:
        """Update user settings, securely encrypting sensitive keys."""
        ALLOWED_KEYS = {
            "nvidia_api_key",
            "groq_api_key",
            "anthropic_api_key",
            "ai_model",
            "weather_city",
            "weather_temp",
            "weather_condition",
        }
        
        # Filter input to prevent Mass Assignment
        filtered_settings = {
            key: val
            for key, val in new_settings.items()
            if key in ALLOWED_KEYS
        }
        
        user = self.get_default_user(session)
        
        preferences = {}
        if user.preferences_json:
            try:
                preferences = json.loads(user.preferences_json)
            except Exception:
                preferences = {}

        # Handle sensitive keys explicitly
        for key in ["nvidia_api_key", "groq_api_key", "anthropic_api_key"]:
            if key in filtered_settings:
                raw_key = filtered_settings.pop(key)
                if raw_key and raw_key.strip():
                    # Encrypt before saving
                    preferences[key] = encrypt_content(raw_key.strip())
                elif raw_key == "":
                    # Allow clearing the key
                    if key in preferences:
                        del preferences[key]

        # Merge remaining settings
        preferences.update(filtered_settings)

        user.preferences_json = json.dumps(preferences)
        session.add(user)
        session.commit()
        
        return self.get_settings(session)

    def get_decrypted_setting(self, session: Session, key: str) -> str | None:
        """Retrieve a raw, decrypted setting strictly for backend use."""
        user = self.get_default_user(session)
        if not user.preferences_json:
            return None
        try:
            preferences = json.loads(user.preferences_json)
        except Exception:
            return None
            
        value = preferences.get(key)
        if not value:
            return None
            
        # These keys are known to be encrypted
        if key in ["nvidia_api_key", "anthropic_api_key", "groq_api_key"]:
            return decrypt_content(value)
            
        return value

user_service = UserService()
