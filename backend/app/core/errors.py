"""Application-level errors."""


class NariError(Exception):
    """Error raised by services and rendered as the NARI error envelope."""

    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)
