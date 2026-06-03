from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class LocationBase(BaseModel):
    label: str
    name: Optional[str] = None
    latitude: float
    longitude: float
    category: Optional[str] = "general"
    radius_meters: float = 100.0

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    label: Optional[str] = None
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None
    radius_meters: Optional[float] = None

class LocationRead(LocationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime] = None

    class Config:
        from_attributes = True
