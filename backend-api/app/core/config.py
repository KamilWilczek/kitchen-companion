from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    DATABASE_URL: str = "sqlite:///./dev.db"
    AUTH_BACKEND: str = Field(default="header", pattern="^(header|jwt)$")
    AUTO_PROVISION_USERS: bool = True
    USER_ID_HEADER: str = "X-User-Id"

    SECRET_KEY: str = Field(..., validation_alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


settings = Settings()
