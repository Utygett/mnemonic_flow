"""
Anki .apkg file parser.

Anki .apkg format:
- ZIP archive containing SQLite database (collection.anki2 or collection.anki21)
- media JSON file with media file mappings
- Media files (images, audio)
"""

from __future__ import annotations

import io
import json
import sqlite3
import zipfile
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AnkiNote:
    """Represents an Anki note (flashcard content)."""

    id: int
    fields: list[str]  # Fields separated by \x1f
    tags: list[str]
    model_id: int
    guid: str


@dataclass
class AnkiCard:
    """Represents an Anki card (link between note and template)."""

    id: int
    note_id: int
    ord: int  # Template ordinal


@dataclass
class AnkiDeck:
    """Represents a parsed Anki deck."""

    name: str
    notes: list[AnkiNote] = field(default_factory=list)
    cards: list[AnkiCard] = field(default_factory=list)
    models: dict[int, dict[str, Any]] = field(default_factory=dict)
    media_map: dict[str, bytes] = field(default_factory=dict)  # filename -> content


class ApkgParseError(Exception):
    """Raised when parsing .apkg file fails."""

    pass


class ApkgParser:
    """
    Parser for Anki .apkg files.

    Usage:
        parser = ApkgParser(file_data)
        deck = parser.parse()
    """

    def __init__(self, file_data: bytes) -> None:
        self.file_data = file_data
        self._zip_file: zipfile.ZipFile | None = None
        self._db_conn: sqlite3.Connection | None = None
        self._media_map: dict[str, str] = {}  # number -> filename

    def parse(self) -> AnkiDeck:
        """Parse the .apkg file and return an AnkiDeck."""
        self._extract_zip()
        self._parse_media_map()
        self._open_database()
        return self._parse_deck()

    def _extract_zip(self) -> None:
        """Extract and validate the ZIP archive."""
        try:
            self._zip_file = zipfile.ZipFile(io.BytesIO(self.file_data))
        except zipfile.BadZipFile as e:
            raise ApkgParseError(f"Invalid ZIP file: {e}")

        # Find the Anki database file
        db_files = [
            name for name in self._zip_file.namelist() if name.endswith((".anki2", ".anki21"))
        ]
        if not db_files:
            raise ApkgParseError("No Anki database file found (.anki2 or .anki21)")

    def _parse_media_map(self) -> None:
        """Parse the media JSON file."""
        if not self._zip_file:
            raise ApkgParseError("ZIP file not initialized")

        try:
            media_json_bytes = self._zip_file.read("media")
            media_json = json.loads(media_json_bytes.decode("utf-8"))
            # media_json maps numbers to filenames
            self._media_map = {str(k): v for k, v in media_json.items()}
        except KeyError:
            # No media file in this package
            self._media_map = {}
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            raise ApkgParseError(f"Invalid media JSON: {e}")

    def _open_database(self) -> None:
        """Open the SQLite database from the .anki2 file."""
        if not self._zip_file:
            raise ApkgParseError("ZIP file not initialized")

        # Find the database file
        db_files = [
            name for name in self._zip_file.namelist() if name.endswith((".anki2", ".anki21"))
        ]
        if not db_files:
            raise ApkgParseError("No database file found")

        db_file = db_files[0]

        try:
            db_data = self._zip_file.read(db_file)
            # Create in-memory database from the binary file data
            # Use backup method to load binary database into memory
            source_conn = sqlite3.connect(":memory:", check_same_thread=False)
            # Write the binary data to a temporary file and then restore
            import tempfile

            with tempfile.NamedTemporaryFile(delete=False, suffix=".anki2") as tmp_file:
                tmp_file.write(db_data)
                tmp_file.flush()
                # Now connect to the temp file and backup to memory
                try:
                    disk_conn = sqlite3.connect(tmp_file.name, check_same_thread=False)
                    disk_conn.backup(source_conn)
                    disk_conn.close()
                finally:
                    import os

                    try:
                        os.unlink(tmp_file.name)
                    except OSError:
                        pass
            self._db_conn = source_conn
        except Exception as e:
            raise ApkgParseError(f"Failed to open database: {e}")

    def _parse_deck(self) -> AnkiDeck:
        """Parse notes, cards, and models from the database."""
        if not self._db_conn:
            raise ApkgParseError("Database not initialized")

        cursor = self._db_conn.cursor()

        # Get deck name from collection
        try:
            cursor.execute("SELECT decks FROM col")
            col_data = cursor.fetchone()
            if col_data and col_data[0]:
                decks_json = json.loads(col_data[0])
                # Get first deck name
                deck_name = next(iter(decks_json.values()), {}).get("name", "Imported from Anki")
            else:
                deck_name = "Imported from Anki"
        except (json.JSONDecodeError, StopIteration):
            deck_name = "Imported from Anki"

        # Get models from collection
        try:
            cursor.execute("SELECT models FROM col")
            col_data = cursor.fetchone()
            models = {}
            if col_data and col_data[0]:
                models_json = json.loads(col_data[0])
                for model_id, model_data in models_json.items():
                    models[int(model_id)] = model_data
        except (json.JSONDecodeError, ValueError):
            models = {}

        # Parse notes
        notes = []
        try:
            cursor.execute("SELECT id, guid, mid, flds, tags FROM notes")
            for row in cursor.fetchall():
                note_id, guid, model_id, fields, tags = row
                # Fields are separated by \x1f
                field_list = fields.split("\x1f")
                # Tags are space-separated (may also be in "tag1 tag2" format)
                tag_list = [t for t in tags.split() if t] if tags else []
                notes.append(
                    AnkiNote(
                        id=note_id,
                        guid=guid,
                        model_id=model_id,
                        fields=field_list,
                        tags=tag_list,
                    )
                )
        except Exception as e:
            raise ApkgParseError(f"Failed to parse notes: {e}")

        # Parse cards
        cards = []
        try:
            cursor.execute("SELECT id, nid, ord FROM cards")
            for row in cursor.fetchall():
                card_id, note_id, ord = row
                cards.append(AnkiCard(id=card_id, note_id=note_id, ord=ord))
        except Exception as e:
            raise ApkgParseError(f"Failed to parse cards: {e}")

        # Load media files into memory
        media_files = {}
        if self._zip_file:
            for number, filename in self._media_map.items():
                try:
                    media_data = self._zip_file.read(str(number))
                    media_files[filename] = media_data
                except KeyError:
                    # Media file referenced but not present in archive
                    pass

        cursor.close()
        self._db_conn.close()

        return AnkiDeck(
            name=deck_name,
            notes=notes,
            cards=cards,
            models=models,
            media_map=media_files,
        )

    def __del__(self) -> None:
        """Clean up database connection."""
        if self._db_conn:
            self._db_conn.close()
        if self._zip_file:
            self._zip_file.close()
