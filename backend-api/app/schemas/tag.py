from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TagIn(BaseModel):
    name: str = Field(max_length=100)


class TagOut(TagIn):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
