from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CategoryOut(BaseModel):
    id: UUID
    name: str
    icon: str | None
    is_system: bool

    model_config = ConfigDict(from_attributes=True)


class CategoryIn(BaseModel):
    name: str = Field(max_length=100)
    icon: str | None = Field(default=None, max_length=10)
