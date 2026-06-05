"""Web Push Service for PWA Push Notifications."""

import base64
import json
import httpx
from typing import Any, List
from sqlmodel import Session
from cryptography.hazmat.primitives.asymmetric import ec
from pywebpush import webpush, WebPushException

from ..core.logging import get_logger
from .user_service import user_service

logger = get_logger(__name__)

class PushService:
    def _generate_vapid_keys(self) -> tuple[str, str]:
        """Generate standard SECP256R1 VAPID public/private keys using Cryptography."""
        private_key = ec.generate_private_key(ec.SECP256R1())
        
        # Private key bytes
        private_bytes = private_key.private_numbers().private_value.to_bytes(32, byteorder='big')
        vapid_private = base64.urlsafe_b64encode(private_bytes).decode('utf-8').rstrip('=')
        
        # Public key uncompressed point representation (\x04 prefix + 32-byte X + 32-byte Y)
        public_numbers = private_key.public_key().public_numbers()
        x = public_numbers.x.to_bytes(32, byteorder='big')
        y = public_numbers.y.to_bytes(32, byteorder='big')
        public_bytes = b'\x04' + x + y
        vapid_public = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')
        
        return vapid_public, vapid_private

    def get_or_create_vapid_keys(self, session: Session) -> tuple[str, str]:
        """Fetch or create VAPID keys for Web Push, stored in user preferences."""
        user = user_service.get_default_user(session)
        preferences = {}
        if user.preferences_json:
            try:
                preferences = json.loads(user.preferences_json)
            except Exception:
                preferences = {}
        
        vapid_public = preferences.get("vapid_public_key")
        vapid_private = preferences.get("vapid_private_key")
        
        if not vapid_public or not vapid_private:
            vapid_public, vapid_private = self._generate_vapid_keys()
            preferences["vapid_public_key"] = vapid_public
            preferences["vapid_private_key"] = vapid_private
            user.preferences_json = json.dumps(preferences)
            session.add(user)
            session.commit()
            session.refresh(user)
            logger.info("Generated new Web Push VAPID keys securely.")
            
        return vapid_public, vapid_private

    def get_public_key(self, session: Session) -> str:
        """Get the VAPID public key to send to the browser."""
        pub_key, _ = self.get_or_create_vapid_keys(session)
        return pub_key

    def register_subscription(self, session: Session, subscription: dict[str, Any]) -> None:
        """Register a browser push subscription, storing it in user preferences."""
        if not subscription or "endpoint" not in subscription:
            return
            
        user = user_service.get_default_user(session)
        preferences = {}
        if user.preferences_json:
            try:
                preferences = json.loads(user.preferences_json)
            except Exception:
                preferences = {}
                
        subs = preferences.get("web_push_subscriptions", [])
        
        # Avoid duplicates
        subs = [s for s in subs if s.get("endpoint") != subscription["endpoint"]]
        subs.append(subscription)
        
        # Cap at 5 active browser subscriptions to prevent bloat
        if len(subs) > 5:
            subs = subs[-5:]
            
        preferences["web_push_subscriptions"] = subs
        user.preferences_json = json.dumps(preferences)
        session.add(user)
        session.commit()
        logger.info(f"Registered Web Push subscription. Total active endpoints: {len(subs)}")

    async def send_push_notification(self, session: Session, title: str, body: str, url: str = None) -> bool:
        """Send a push notification payload to all registered browser subscriptions."""
        user = user_service.get_default_user(session)
        preferences = {}
        if user.preferences_json:
            try:
                preferences = json.loads(user.preferences_json)
            except Exception:
                preferences = {}
                
        subs = preferences.get("web_push_subscriptions", [])
        if not subs:
            logger.debug("No web push subscriptions registered.")
            return False
            
        vapid_public, vapid_private = self.get_or_create_vapid_keys(session)
        
        payload = {
            "title": title,
            "body": body,
            "url": url or "/"
        }
        
        payload_str = json.dumps(payload)
        failed_endpoints = []
        sent_count = 0
        
        # Process subscriptions
        for sub in subs:
            try:
                webpush(
                    subscription_info=sub,
                    data=payload_str,
                    vapid_private_key=vapid_private,
                    vapid_claims={"sub": "mailto:admin@nari.local"},
                    ttl=86400  # 24 hours TTL
                )
                sent_count += 1
            except WebPushException as e:
                # 410 Gone or 404 Not Found means subscription expired or was deleted by host
                if e.response is not None and e.response.status_code in [404, 410]:
                    failed_endpoints.append(sub.get("endpoint"))
                logger.warning(f"Failed to push message to endpoint {sub.get('endpoint')[:40]}...: {e}")
            except Exception as e:
                logger.error(f"Unexpected Web Push failure: {e}")
                
        # Clean up stale subscriptions if any failed with 410/404
        if failed_endpoints:
            subs = [s for s in subs if s.get("endpoint") not in failed_endpoints]
            preferences["web_push_subscriptions"] = subs
            user.preferences_json = json.dumps(preferences)
            session.add(user)
            session.commit()
            logger.info(f"Cleaned up {len(failed_endpoints)} expired Web Push subscriptions.")
            
        return sent_count > 0

push_service = PushService()
