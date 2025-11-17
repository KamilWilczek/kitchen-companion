from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TagIn(BaseModel):
    name: str


class TagOut(TagIn):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
