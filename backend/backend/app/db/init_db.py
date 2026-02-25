# Import all models to register them with SQLAlchemy
from app.db.base import Base
from app.db.session import engine
from app.models.card import Card  # noqa: F401
from app.models.card_card_tag import CardCardTag  # noqa: F401
from app.models.card_level import CardLevel  # noqa: F401
from app.models.card_progress import CardProgress  # noqa: F401
from app.models.card_review_history import CardReviewHistory  # noqa: F401
from app.models.card_tag import CardTag  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.deck import Deck  # noqa: F401
from app.models.study_group import StudyGroup  # noqa: F401
from app.models.study_group_deck import StudyGroupDeck  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_learning_settings import UserLearningSettings  # noqa: F401
from app.models.user_study_group import UserStudyGroup  # noqa: F401
from app.models.user_study_group_deck import UserStudyGroupDeck  # noqa: F401


def init_db():
    """Создаёт все таблицы в БД"""
    Base.metadata.create_all(bind=engine)
