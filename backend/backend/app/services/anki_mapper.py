"""
Mapper for converting Anki data to MnemonicFlow models.

This module handles the conversion of Anki notes and cards into
MnemonicFlow Deck, Card, and CardLevel entities.
"""

from __future__ import annotations

import re
import uuid

from sqlalchemy.orm import Session

from app.models.card import Card
from app.models.card_level import CardLevel
from app.models.deck import Deck
from app.models.user_study_group import UserStudyGroup
from app.models.user_study_group_deck import UserStudyGroupDeck
from app.services.anki_parser import AnkiDeck, AnkiNote


class AnkiMapper:
    """
    Maps Anki data to MnemonicFlow models.

    Usage:
        mapper = AnkiMapper(db, user_id)
        deck, cards = mapper.create_deck(anki_deck)
    """

    def __init__(self, db: Session, user_id: uuid.UUID) -> None:
        self.db = db
        self.user_id = user_id

    def create_deck(self, anki_deck: AnkiDeck) -> tuple[Deck, list[Card]]:
        """
        Create a MnemonicFlow deck and cards from Anki data.

        Args:
            anki_deck: Parsed Anki deck

        Returns:
            Tuple of (Deck, list of Card)

        Raises:
            ValueError: If deck cannot be created
        """
        # Get or create user's default study group
        user_group = (
            self.db.query(UserStudyGroup).filter(UserStudyGroup.user_id == self.user_id).first()
        )

        if not user_group:
            user_group = UserStudyGroup(user_id=self.user_id, title_override="My Decks")
            self.db.add(user_group)
            self.db.flush()

        # Create deck
        deck = Deck(
            owner_id=self.user_id,
            title=self._clean_deck_name(anki_deck.name),
            description="Imported from Anki",
            color="#4A6FA5",
        )
        self.db.add(deck)
        self.db.flush()

        # Link deck to user's study group
        link = UserStudyGroupDeck(
            user_group_id=user_group.id,
            deck_id=deck.id,
            order_index=0,
        )
        self.db.add(link)

        # Create cards from notes
        cards = []
        for note in anki_deck.notes:
            card = self._create_card_from_note(note, deck.id, anki_deck)
            if card:
                cards.append(card)

        self.db.commit()
        self.db.refresh(deck)

        return deck, cards

    def _create_card_from_note(
        self,
        note: AnkiNote,
        deck_id: uuid.UUID,
        anki_deck: AnkiDeck,
    ) -> Card | None:
        """
        Create a Card from an AnkiNote.

        Args:
            note: Anki note to convert
            deck_id: Target deck ID
            anki_deck: Full Anki deck for model/media access

        Returns:
            Created Card or None if note has no valid content
        """
        # Extract question and answer from note fields
        question, answer = self._extract_qa_from_note(note, anki_deck)

        # Skip empty cards
        if not question or not question.strip():
            return None

        # Create card title (truncate question)
        title = self._clean_html(question)[:100]
        if not title.strip():
            title = "Imported Card"

        # Create card
        card = Card(
            deck_id=deck_id,
            type="flashcard",
            title=title,
            max_level=1,
            settings=None,
        )
        self.db.add(card)
        self.db.flush()

        # Create card level
        level = CardLevel(
            card_id=card.id,
            level_index=0,
            content={
                "question": self._clean_html(question),
                "answer": self._clean_html(answer),
            },
            question_image_urls=None,
            answer_image_urls=None,
            question_audio_urls=None,
            answer_audio_urls=None,
        )
        self.db.add(level)

        return card

    def _extract_qa_from_note(
        self,
        note: AnkiNote,
        anki_deck: AnkiDeck,
    ) -> tuple[str, str]:
        """
        Extract question and answer from Anki note fields.

        This method handles:
        - Basic model (Front/Back)
        - Custom models (uses field names from model)
        - HTML content cleanup

        Args:
            note: Anki note
            anki_deck: Full Anki deck for model access

        Returns:
            Tuple of (question, answer)
        """
        model = anki_deck.models.get(note.model_id, {})

        # Get field names from model
        field_names = []
        if "flds" in model:
            field_names = [f.get("name", "") for f in model["flds"]]

        # Map fields to names
        fields_dict = {}
        for i, field_value in enumerate(note.fields):
            if i < len(field_names):
                fields_dict[field_names[i]] = field_value
            else:
                fields_dict[f"field_{i}"] = field_value

        # Try to find Front/Back fields
        question = ""
        answer = ""

        # Common field name variations
        question_field_names = ["Front", "Question", "front", "question"]
        answer_field_names = ["Back", "Answer", "back", "answer"]

        for name in question_field_names:
            if name in fields_dict:
                question = fields_dict[name]
                break

        for name in answer_field_names:
            if name in fields_dict:
                answer = fields_dict[name]
                break

        # Fallback: use first two fields
        if not question and len(note.fields) > 0:
            question = note.fields[0]
        if not answer and len(note.fields) > 1:
            answer = note.fields[1]

        return question, answer

    def _clean_deck_name(self, name: str) -> str:
        """Clean and sanitize deck name."""
        # Remove parent deck names (Anki uses :: separator)
        name = name.split("::")[-1].strip()
        # Limit length
        return name[:200] if name else "Imported from Anki"

    @staticmethod
    def _clean_html(text: str) -> str:
        """
        Clean HTML content from Anki fields.

        Removes:
        - HTML tags but preserves line breaks
        - Anki sound tags ([sound:file.mp3])
        - Anki cloze markers

        Preserves:
        - Basic text formatting
        - Line breaks
        """
        if not text:
            return ""

        # Remove Anki sound tags
        text = re.sub(r"\[sound:[^\]]+\]", "", text)

        # Remove HTML comments
        text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)

        # Replace <br> with newlines
        text = re.sub(r"<br\s*/?\s*>", "\n", text, flags=re.IGNORECASE)

        # Replace </div> and </p> with newlines
        text = re.sub(r"</\s*(div|p)\s*>", "\n", text, flags=re.IGNORECASE)

        # Replace <li> with bullets
        text = re.sub(r"<\s*li\s*>", "• ", text, flags=re.IGNORECASE)

        # Remove all other HTML tags
        text = re.sub(r"<[^>]+>", "", text)

        # Decode HTML entities
        text = (
            text.replace("&nbsp;", " ")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&amp;", "&")
            .replace("&quot;", '"')
            .replace("&#39;", "'")
        )

        # Clean up whitespace
        text = re.sub(r"\n{3,}", "\n\n", text)  # Max 2 consecutive newlines
        text = text.strip()

        return text
