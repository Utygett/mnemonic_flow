# -*- coding: utf-8 -*-

import uuid
from datetime import datetime

from backend.database import SessionLocal
from backend.models import CardModel

db = SessionLocal()
print("Фотосинтез")

test_card = CardModel(
    id=str(uuid.uuid4()),
    term="Фотосинтез",
    levels=["ывадыжавы", "адыалываы", "ваыаывадол"],
    current_level=1,
    next_review=datetime.now(),
    streak=3,
    deck_id="1",
    card_type="flashcard",
    last_reviewed=datetime.now(),
)

db.add(test_card)
db.commit()
db.close()
print("Тестовая карточка добавлена")
