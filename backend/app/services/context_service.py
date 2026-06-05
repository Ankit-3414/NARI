from sqlmodel import Session, select
import json
import re
from typing import List

from ..core.constants import EntityType
from ..core.events import get_event_bus
from ..websocket.events import EventNames
from ..models.activity_log import ActivityLog
from ..models.user import User

class ContextService:
    def __init__(self):
        self._lock = None

    @staticmethod
    async def log_context(text: str, source: str = "api") -> bool:
        """
        Logs raw user context to the ActivityLog.
        This is a frictionless entry point for behavioral data.
        """
        # We use emit_ws_event to ensure a standardized envelope that 
        # ActivityService.handle_event can process correctly.
        await get_event_bus().emit_ws_event(
            event=EventNames.CONTEXT_LOGGED.value,
            entity_type=EntityType.CONTEXT.value,
            entity_id=0,  # Context entries don't have a primary ID beyond the log itself
            data={
                "text": text,
                "action": "logged",
                "message": text[:500],
                "source": source
            }
        )
        
        return True

    async def digest_context(self, session: Session) -> List[str]:
        """
        Analyze undigested context logs, extract concepts/facts, and store in semantic memory.
        Returns a list of concept names learned or updated.
        """
        if self._lock is None:
            import asyncio
            self._lock = asyncio.Lock()
        async with self._lock:
            # 1. Fetch user preferences to get last digested log ID
            from .user_service import user_service
            user = user_service.get_default_user(session)
            preferences = {}
            if user.preferences_json:
                try:
                    preferences = json.loads(user.preferences_json)
                except Exception:
                    preferences = {}

            last_digested_id = preferences.get("last_digested_context_id", 0)

            # 2. Fetch context logs after last_digested_id (limit to 100 at a time for safety)
            statement = select(ActivityLog).where(
                ActivityLog.entity_type == EntityType.CONTEXT
            ).where(
                ActivityLog.action == "logged"
            ).where(
                ActivityLog.id > last_digested_id
            ).order_by(ActivityLog.id.asc()).limit(100)

            logs = list(session.exec(statement).all())
            if not logs:
                return []

            # Extract text entries from the logs
            context_texts = []
            max_processed_id = last_digested_id

            for log in logs:
                max_processed_id = max(max_processed_id, log.id)
                if log.payload_json:
                    try:
                        payload = json.loads(log.payload_json)
                        # Support both direct 'text' or envelope 'data.text'
                        text = payload.get("text") or (payload.get("data") and payload["data"].get("text"))
                        if text:
                            context_texts.append(f"- [{log.created_at.strftime('%Y-%m-%d %H:%M:%S')}] {text}")
                    except Exception:
                        # Fallback to message if json parsing fails
                        context_texts.append(f"- [{log.created_at.strftime('%Y-%m-%d %H:%M:%S')}] {log.message}")

            if not context_texts:
                # Update user preference so we don't query empty/malformed logs again
                preferences["last_digested_context_id"] = max_processed_id
                user.preferences_json = json.dumps(preferences)
                session.add(user)
                session.commit()
                return []

            # 3. Call NVIDIA NIM to extract knowledge nodes
            from ..ai.llm_client import nim_client
            client = nim_client._get_client(session)
            if not client:
                raise ValueError("AI Client is offline (API Key not configured).")

            preferred_model = user_service.get_decrypted_setting(session, "ai_model")
            active_model = preferred_model or "meta/llama-3.1-8b-instruct"

            prompt = (
                "You are NARI's backend context parser. Your job is to process a list of raw user behavioral context entries "
                "and extract permanent personal facts, identity definitions, operational rules, goals, habits, or core preferences about the user (Sir/Ankit).\n\n"
                "Here are the raw context logs:\n"
                "----------------------------\n"
                + "\n".join(context_texts) +
                "\n----------------------------\n\n"
                "Format your output ONLY as a valid JSON array of objects. Do not include markdown code fence wrappers, preambles, or conversational filler. Each object in the array must have the following keys:\n"
                "1. \"concept\": The core concept name (e.g. \"User Coffee Preference\", \"Morning Routine Rules\", \"Diet Allergies\"). Keep it concise and clean.\n"
                "2. \"summary\": A clear, actionable summary of the fact, rule, preference, or habit.\n"
                "3. \"confidence\": A confidence float score between 0.0 and 1.0 (e.g., 0.9 for explicit statements, 0.6 for fuzzy observations).\n\n"
                "If no clear permanent preferences, facts, or rules can be derived, return an empty JSON array: []"
            )

            try:
                response = await client.chat.completions.create(
                    model=active_model,
                    messages=[
                        {"role": "system", "content": "You are a precise backend JSON generator. You only output valid JSON arrays. Never wrap your output in ```json or any other text."},
                        {"role": "user", "content": prompt}
                    ]
                )
                raw_response = response.choices[0].message.content.strip()
                
                # Clean possible markdown wrapping if the LLM ignored instructions
                if raw_response.startswith("```"):
                    # strip code fences
                    lines = raw_response.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    raw_response = "\n".join(lines).strip()

                # Robust JSON extraction using regex
                match = re.search(r"(\[.*\])", raw_response, re.DOTALL)
                if match:
                    raw_response = match.group(1)

                learned_items = json.loads(raw_response)
            except Exception as e:
                print(f"DIGESTION LLM ERROR: {e}")
                return []

            learned_concepts = []
            from .semantic_memory import semantic_memory
            
            if isinstance(learned_items, list):
                for item in learned_items:
                    concept = item.get("concept")
                    summary = item.get("summary")
                    confidence = item.get("confidence", 0.5)
                    if concept and summary:
                        # Save/Merge to semantic memory
                        node = semantic_memory.store_knowledge(
                            session, 
                            concept=concept, 
                            summary=summary, 
                            raw_content="\n".join(context_texts),
                            source="context_digest"
                        )
                        # Update confidence if needed
                        node.confidence = float(confidence)
                        session.add(node)
                        learned_concepts.append(concept)

            # 4. Update user preferences with max processed ID
            preferences["last_digested_context_id"] = max_processed_id
            user.preferences_json = json.dumps(preferences)
            session.add(user)
            session.commit()

            # Emit activity event that state was updated
            from .activity_service import activity_service
            activity_service.create(
                session,
                entity_type=EntityType.CONTEXT,
                action="digested",
                message=f"Digested {len(logs)} context entries. Learned {len(learned_concepts)} new concepts.",
                entity_id=0,
                payload={"digested_count": len(logs), "concepts_learned": learned_concepts},
                source="system"
            )

            return learned_concepts


context_service = ContextService()
