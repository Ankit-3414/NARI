from pydantic import BaseModel, Field

class ContextCreate(BaseModel):
    """Schema for creating a new context log entry."""
    text: str = Field(..., description="The raw text to log", min_length=1, max_length=500)
