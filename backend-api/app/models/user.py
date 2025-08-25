from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, uuid_str


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    email: Mapped[str | None]
