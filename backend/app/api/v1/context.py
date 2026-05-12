from fastapi import APIRouter, Depends, HTTPException
from ...schemas.common import success_response, error_response
from ...schemas.context import ContextCreate
from ...services.context_service import context_service

router = APIRouter()

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
