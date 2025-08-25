from uuid import UUID

from pydantic import BaseModel


class TagIn(BaseModel):
    name: str


class TagOut(TagIn):
    id: UUID

    class Config:
        from_attributes = True
