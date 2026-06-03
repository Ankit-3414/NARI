"""AI related endpoints."""

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from ...ai.intent import intent_engine
from ...ai.llm_client import nim_client
from ...db.session import get_session
from ...schemas.common import success_response, error_response

from ...core.security import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])

from typing import Optional

class IntentRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str
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
        latitude=payload.latitude,
        longitude=payload.longitude,
        active_node_label=payload.active_node_label
    )
    if "error" in result:
        return error_response("AI_CHAT_ERROR", result["error"])
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


