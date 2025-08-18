from fastapi import HTTPException, APIRouter
from typing import List
from uuid import uuid4

from app.core.db import tags, recipes
from app.schemas.tag import TagIn, TagOut

router = APIRouter()

tags: List[TagOut] = []

@router.post("/tags", response_model=TagOut)
def create_tag(tag: TagIn):
    new_tag = {"id": str(uuid4()), **tag.model_dump()}
    tags.append(new_tag)

    return new_tag

@router.get("/tags", response_model=List[TagOut])
def list_tags():
    return tags

@router.put("/tags/{tag_id}", response_model=TagOut)
def rename_tag(tag_id: str, tag: TagIn):
    for t in tags:
        if t["id"] == tag_id:
            t["name"] = tag.name

            return t
        
    raise HTTPException(status_code=404, detail="Tag not found")

@router.delete("/tags/{tag_id}", status_code=204)
def delete_tag(tag_id: str):
    for r in recipes:
        if tag_id in r["tag_ids"]:
            raise HTTPException(status_code=400, detail="Cannot delete tag, it is still assigned to one or more recipes")
    
    for i, t in enumerate(tags):
        if t["id"] == tag_id:
            tags.pop(i)

            return {"detail:" "Tag deleted"}
        
    raise HTTPException(status_code=404, detail="Tag not found")