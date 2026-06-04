"""Run the NARI backend with Uvicorn."""

import uvicorn

from app.core.config import settings


if __name__ == "__main__":
    is_dev = settings.NARI_ENV == "development"
    uvicorn.run(
        "app.main:app",
        host=settings.NARI_HOST,
        port=settings.NARI_PORT,
        reload=is_dev and settings.NARI_WORKERS == 1,
        workers=settings.NARI_WORKERS if not is_dev else 1,
    )
