"""Run the NARI backend with Uvicorn."""

import uvicorn

from app.core.config import settings


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.NARI_HOST,
        port=settings.NARI_PORT,
        reload=settings.NARI_ENV == "development",
        workers=settings.NARI_WORKERS,
    )
