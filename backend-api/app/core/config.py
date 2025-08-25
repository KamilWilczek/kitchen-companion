from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = (
        "sqlite:///./dev.db"  # later: "postgresql+psycopg://user:pass@host/db"
    )

    AUTH_BACKEND: str = Field(default="header", pattern="^(header|jwt)$")

    AUTO_PROVISION_USERS: bool = True

    USER_ID_HEADER: str = "X-User-Id"

    class Config:
        env_file = ".env"


settings = Settings()
