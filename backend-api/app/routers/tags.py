from fastapi import HTTPException, APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.tag import Tag
from app.schemas.tag import TagIn, TagOut

router = APIRouter()

tags: List[TagOut] = []


@router.get("/", response_model=List[TagOut])
def list_tags(db: Session = Depends(get_db)):
    return db.scalars(select(Tag).order_by(Tag.name.asc())).all()


@router.post("/", response_model=TagOut)
def create_tag(tag: TagIn, db: Session = Depends(get_db)):
    name = tag.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name cannot be empty.")

    existing = db.scalar(select(Tag).where(Tag.name == name))
    if existing:
        raise HTTPException(status_code=400, detail="Tag name already exists.")

    row = Tag(name=name)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{tag_id}", response_model=TagOut)
def rename_tag(tag_id: str, tag: TagIn, db: Session = Depends(get_db)):
    row = db.get(Tag, tag_id)
    if not row:
        raise HTTPException(status_code=404, detail="Tag not found")

    name = tag.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name cannot be empty.")

    duplicate = db.scalar(select(Tag).where(Tag.name == name, Tag.id != tag_id))
    if duplicate:
        raise HTTPException(
            status_code=400, detail="Another tag with this name exists."
        )

    row.name = name
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: str, db: Session = Depends(get_db)):
    row = db.get(Tag, tag_id)
    if not row:
        raise HTTPException(status_code=404, detail="Tag not found")

    if row.recipes and len(row.recipes) > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete tag; it is still assigned to one or more recipes.",
        )

    db.delete(row)
    db.commit()
    return None
