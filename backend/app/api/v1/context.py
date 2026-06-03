from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ...schemas.common import success_response, error_response
from ...schemas.context import ContextCreate
from ...services.context_service import context_service
from ...db.session import get_session
from ...core.security import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])

@router.post("", response_model=dict)
async def log_context(payload: ContextCreate):
    """
    Log a raw text context entry.
    This is used for the Context Stream feature.
    """
    try:
        success = await context_service.log_context(text=payload.text, source="api")
        if success:
            return success_response({"message": "Context logged successfully"})
        return error_response("CONTEXT_LOG_FAILED", "Failed to log context")
    except Exception as e:
        return error_response("SERVER_ERROR", str(e))

@router.post("/digest", response_model=dict)
async def digest_context(session: Session = Depends(get_session)):
    """
    Process raw context logs and convert them to long-term semantic knowledge memory.
    """
    try:
        learned = await context_service.digest_context(session)
        return success_response({
            "message": f"Successfully digested context logs. Learned {len(learned)} new concepts.",
            "concepts_learned": learned
        })
    except Exception as e:
        return error_response("DIGEST_FAILED", str(e))
