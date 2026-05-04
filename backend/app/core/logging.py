"""Structured logging setup."""

import logging
import sys
from datetime import datetime
from .config import settings


def setup_logging():
    """Configure structured logging for the application."""
    log_level = getattr(logging, settings.NARI_LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance."""
    return logging.getLogger(name)