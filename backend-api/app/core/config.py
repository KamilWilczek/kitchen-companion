from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    ENVIRONMENT: str = Field(default="dev", pattern="^(dev|prod)$")

    DATABASE_URL: str = "sqlite:///./dev.db"
    AUTH_BACKEND: str = Field(default="header", pattern="^(header|jwt)$")
    AUTO_PROVISION_USERS: bool = True
    USER_ID_HEADER: str = "X-User-Id"

    SECRET_KEY: str = Field(..., validation_alias="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "*"
    RATE_LIMIT_ENABLED: bool = True

    @property
    def is_dev(self) -> bool:
        return self.ENVIRONMENT == "dev"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
