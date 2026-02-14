from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

engine = create_async_engine(
    get_settings().get_async_db_url(),
    echo=False,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db_engine():
    return engine


async def get_db():
    async with async_session() as session:
        yield session
