from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="ACADEMY_",
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: Literal["dev", "prod"] = "prod"

    @field_validator("env", mode="before")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return {"development": "dev", "production": "prod"}.get(value, value)

    @property
    def is_development(self) -> bool:
        return self.env == "dev"
