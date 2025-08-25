from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = (
        "sqlite:///./dev.db"  # later: "postgresql+psycopg://user:pass@host/db"
    )

    class Config:
        env_file = ".env"


settings = Settings()
