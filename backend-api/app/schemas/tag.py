from pydantic import BaseModel

class TagIn(BaseModel):
    name: str

class TagOut(TagIn):
    id: str

    class Config:
        from_attributes = True