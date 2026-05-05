"""Application-specific errors raised from services and mapped to HTTP responses."""

from __future__ import annotations

from typing import Any


class AppError(Exception):
    """
    Base exception for expected business-rule failures.

    Handlers convert this to a stable JSON shape; callers in services should
    raise `AppError` (or a subclass) instead of returning error dicts.
    """

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        code: str = "APP_ERROR",
        details: Any = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details
