from sqlalchemy import UniqueConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, uuid_str


class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_tag_user_name"),)
