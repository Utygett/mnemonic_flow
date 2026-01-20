import app.models  # noqa: F401 - чтобы все модели были зарегистрированы
from app.db.base import Base
from app.db.session import engine


def init_db():
    """Создаёт все таблицы в БД"""
    Base.metadata.create_all(bind=engine)
