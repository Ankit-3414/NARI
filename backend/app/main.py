"""FastAPI application entrypoint for NARI."""

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.v1.router import api_router
from .websocket.handlers import router as ws_router
from .core.config import settings
from .core.errors import NariError
from .core.events import setup_event_listeners
from .core.logging import get_logger, setup_logging
from .db.session import init_db
from .schemas.common import error_response
from .scheduler.manager import scheduler_manager

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Prepare runtime dependencies for the app."""
    setup_logging()
    init_db()
    setup_event_listeners()
    scheduler_manager.start()
    logger.info("NARI backend started")
    yield
    scheduler_manager.stop()
    logger.info("NARI backend stopped")


def create_app() -> FastAPI:
    """Create and configure the FastAPI app."""
    app = FastAPI(
        title=settings.NARI_APP_NAME,
        version=settings.NARI_VERSION,
        lifespan=lifespan,
    )

    # SECURE: Implement strict CORS lockdown
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
            "http://192.168.1.100",
            "http://192.168.1.100:3000",
            "http://localhost",
            "http://127.0.0.1"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")
    app.include_router(ws_router)
    register_exception_handlers(app)
    return app


def register_exception_handlers(app: FastAPI) -> None:
    """Register handlers that preserve the NARI response contract."""

    @app.exception_handler(NariError)
    async def nari_exception_handler(
        request: Request,
        exc: NariError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(exc.code, exc.message),
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request,
        exc: HTTPException,
    ) -> JSONResponse:
        detail: Any = exc.detail
        code = "SERVER_ERROR"
        message = "Unexpected server error"

        if isinstance(detail, dict):
            code = str(detail.get("code", code))
            message = str(detail.get("message", message))
        elif exc.status_code == 401:
            code = "UNAUTHORIZED"
            message = "Missing or invalid API key"
        elif exc.status_code == 404:
            code = "NOT_FOUND"
            message = "Resource not found"
        elif isinstance(detail, str):
            message = detail

        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(code, message),
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_response("VALIDATION_ERROR", "Request validation failed"),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled exception")
        return JSONResponse(
            status_code=500,
            content=error_response("SERVER_ERROR", "Unexpected server error"),
        )


app = create_app()
