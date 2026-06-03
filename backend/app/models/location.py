from datetime import datetime
from typing import Optional
from sqlmodel import Field
from ..db.base import BaseModel

class LocationNode(BaseModel, table=True):
    """Represents a physical location known by NARI."""
    __tablename__ = "location_nodes"
    
    label: str = Field(index=True)  # e.g., "Home", "Gym", "Market"
    name: Optional[str] = Field(default=None, description="Full address or descriptive name")
    latitude: float
    longitude: float
    category: Optional[str] = Field(default="general", index=True) # e.g., "shopping", "fitness", "work"
    radius_meters: float = Field(default=100.0) # Default 100m geofence
    
    archived_at: Optional[datetime] = Field(default=None)
