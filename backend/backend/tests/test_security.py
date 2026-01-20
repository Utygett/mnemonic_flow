"""Тесты для модуля app.core.security."""

from app.core.security import hash_password, verify_password


class TestHashPassword:
    """Тесты функции хеширования паролей."""

    def test_hash_returns_different_values(self):
        """Один и тот же пароль даёт разные хеши (соль)."""
        password = "mypassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        assert hash1 != hash2, "Хеши должны быть разными из-за соли"
        assert len(hash1) > 20, "Хеш должен быть достаточно длинным"

    def test_hash_is_deterministic_for_same_safe_slice(self):
        """Пароли длиннее 72 байт обрезаются."""
        # Длинный пароль (>72 байт)
        long_password = "a" * 100
        hash1 = hash_password(long_password)
        hash2 = hash_password(long_password)

        # Из-за соли хеши всё равно разные
        assert hash1 != hash2

    def test_hash_handles_special_characters(self):
        """Хеширование работает с спецсимволами."""
        special_password = "P@$$w0rd!#$%^&*()"
        hashed = hash_password(special_password)

        assert len(hashed) > 20
        assert hashed != special_password


class TestVerifyPassword:
    """Тесты функции проверки паролей."""

    def test_verify_correct_password(self):
        """Правильный пароль проходит проверку."""
        password = "correct_password"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_incorrect_password(self):
        """Неправильный пароль не проходит проверку."""
        password = "original_password"
        wrong_password = "wrong_password"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_empty_password(self):
        """Пустой пароль не проходит проверку."""
        hashed = hash_password("some_password")

        assert verify_password("", hashed) is False

    def test_verify_case_sensitive(self):
        """Проверка пароля чувствительна к регистру."""
        password = "MyPassword123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True
        assert verify_password("mypassword123", hashed) is False
        assert verify_password("MYPASSWORD123", hashed) is False
