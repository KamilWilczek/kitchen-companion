from typing import List
from uuid import UUID

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.tag import Tag
from app.models.user import User
from app.schemas.tag import TagIn, TagOut
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter()

tags: List[TagOut] = []


@router.get("/", response_model=list[TagOut])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Tag]:
    return list(
        db.scalars(
            select(Tag).where(Tag.user_id == current_user.id).order_by(Tag.name.asc())
        ).all()
    )


@router.post("/", response_model=TagOut)
def create_tag(
    tag: TagIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Tag:
    name = tag.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name cannot be empty.")

    existing = db.scalar(
        select(Tag).where(Tag.user_id == current_user.id, Tag.name == name)
    )
    if existing:
        raise HTTPException(status_code=400, detail="Tag name already exists.")

    row = Tag(name=name, user_id=current_user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{tag_id}", response_model=TagOut)
def rename_tag(
    tag_id: UUID,
    tag: TagIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Tag:
    row = db.scalar(select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id))
    if not row:
        raise HTTPException(status_code=404, detail="Tag not found")

    name = tag.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name cannot be empty.")

    duplicate = db.scalar(
        select(Tag).where(
            Tag.user_id == current_user.id,
            Tag.name == name,
            Tag.id != tag_id,
        )
    )
    if duplicate:
        raise HTTPException(
            status_code=400, detail="Another tag with this name exists."
        )

    row.name = name
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    row = db.scalar(select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user.id))
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
