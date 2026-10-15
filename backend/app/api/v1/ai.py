"""AI related endpoints."""

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from ...ai.intent import intent_engine
from ...ai.llm_client import nim_client
from ...db.session import get_session
from ...schemas.common import success_response, error_response

from fastapi import APIRouter, Depends, HTTPException, status
from ...core.config import settings
from ...core.security import verify_api_key


def verify_ai_enabled():
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "AI_DISABLED",
                "message": "AI Co-pilot services are currently disabled on this server."
            }
        )

router = APIRouter(dependencies=[Depends(verify_api_key), Depends(verify_ai_enabled)])


from typing import Optional

class IntentRequest(BaseModel):
    text: str

from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    active_node_label: Optional[str] = None

@router.post("/intent", response_model=dict)
async def get_intent(payload: IntentRequest):
    """Get structured suggestions from natural language text."""
    suggestions = intent_engine.get_suggestions(payload.text)
    return success_response({"suggestions": suggestions})

@router.post("/chat", response_model=dict)
async def ai_chat(payload: ChatRequest, session: Session = Depends(get_session)):
    """Send a message to the AI and execute tools."""
    result = await nim_client.chat(
        session,
        payload.message,
        history=payload.history,
        latitude=payload.latitude,
        longitude=payload.longitude,
        active_node_label=payload.active_node_label
    )
    if "error" in result:
        return error_response("AI_CHAT_ERROR", result["error"])

    # Reasonably log directive to ActivityLog for behavioral grounding
    try:
        from ...services.activity_service import activity_service
        from ...core.constants import EntityType
        from ...services.user_service import user_service
        user = user_service.get_default_user(session)
        activity_service.log(
            session,
            EntityType.USER,
            user.id,
            "copilot_interaction",
            f"Directive: {payload.message[:160]}"
        )
    except Exception:
        pass

    return success_response(result)


@router.get("/context", response_model=dict)
async def get_ai_context(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    active_node_label: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get the active context representation compiled for the LLM."""
    from ...ai.context_builder import context_builder
    context = context_builder.build_context_window(
        session,
        latitude=latitude,
        longitude=longitude,
        active_node_label=active_node_label
    )
    return success_response({"context": context})


