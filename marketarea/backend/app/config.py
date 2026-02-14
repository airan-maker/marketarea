from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://marketarea:marketarea1234@localhost:5432/marketarea"
    DATABASE_URL_SYNC: str = "postgresql://marketarea:marketarea1234@localhost:5432/marketarea"

    DATA_GO_KR_API_KEY: str = ""
    SEOUL_OPEN_DATA_API_KEY: str = ""
    KOSIS_API_KEY: str = ""
    USE_SAMPLE_DATA: bool = False

    ALLOWED_ORIGINS: str = "http://localhost:3000,https://*.up.railway.app"
    PORT: int = 8000
    NEXTAUTH_SECRET: str = ""

    @property
    def should_use_sample(self) -> bool:
        """강제 샘플 모드일 때만 True. 개별 키 유무는 각 collector에서 판단."""
        return self.USE_SAMPLE_DATA

    def has_key(self, source: str) -> bool:
        """특정 데이터 소스의 API 키가 있는지 확인."""
        key_map = {
            "data_go_kr": self.DATA_GO_KR_API_KEY,
            "seoul": self.SEOUL_OPEN_DATA_API_KEY,
            "kosis": self.KOSIS_API_KEY,
        }
        return bool(key_map.get(source, ""))

    def get_cors_origins(self) -> list[str]:
        """Parse comma-separated ALLOWED_ORIGINS into list."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    def get_async_db_url(self) -> str:
        """Convert Railway DATABASE_URL (postgres://) to asyncpg format."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    def get_sync_db_url(self) -> str:
        """Get sync DB URL, deriving from DATABASE_URL if needed."""
        if self.DATABASE_URL_SYNC != "postgresql://marketarea:marketarea1234@localhost:5432/marketarea":
            return self.DATABASE_URL_SYNC
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        elif "+asyncpg" in url:
            url = url.replace("+asyncpg", "", 1)
        return url

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
