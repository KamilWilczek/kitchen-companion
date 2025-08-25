from sqlalchemy.orm import DeclarativeBase
import uuid


def uuid_str():
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass
