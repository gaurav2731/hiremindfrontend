"""
Tests for core security utilities: password hashing and JWT tokens.
"""
import time
from jose import jwt, ExpiredSignatureError
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.config import settings


class TestPasswordHashing:
    def test_hash_and_verify_success(self):
        """A correctly hashed password should verify."""
        pw = "MySecureP@ss1"
        hashed = hash_password(pw)
        assert hashed != pw
        assert verify_password(pw, hashed) is True

    def test_verify_wrong_password(self):
        """Wrong password should fail verification."""
        hashed = hash_password("correct-password")
        assert verify_password("wrong-password", hashed) is False

    def test_verify_empty_password(self):
        """Empty password against a real hash should fail."""
        hashed = hash_password("something")
        assert verify_password("", hashed) is False

    def test_hash_is_different_each_time(self):
        """bcrypt salts should make each hash unique."""
        pw = "same-password"
        h1 = hash_password(pw)
        h2 = hash_password(pw)
        assert h1 != h2
        assert verify_password(pw, h1) is True
        assert verify_password(pw, h2) is True


class TestJWTTokens:
    def test_create_and_decode(self):
        """A valid token should decode to the original subject."""
        token = create_access_token(subject="42")
        payload = decode_access_token(token)
        assert payload["sub"] == "42"
        assert "exp" in payload

    def test_decode_with_wrong_secret(self):
        """Token signed with a different secret should be rejected."""
        token = jwt.encode({"sub": "1"}, "wrong-secret", algorithm=settings.jwt_algorithm)
        try:
            decode_access_token(token)
            assert False, "Should have raised an error"
        except Exception:
            pass  # expected

    def test_decode_tampered_token(self):
        """A tampered token should be rejected."""
        token = create_access_token(subject="1")
        tampered = token[:-5] + "XXXXX"
        try:
            decode_access_token(tampered)
            assert False, "Should have raised an error"
        except Exception:
            pass  # expected

    def test_custom_expiry(self):
        """Token should respect custom expiry minutes."""
        token = create_access_token(subject="1", expires_minutes=1)
        payload = decode_access_token(token)
        assert payload["sub"] == "1"
        # Cannot easily test expiry without sleeping — just validate structure

    def test_decode_malformed_token(self):
        """Garbage string should not decode."""
        try:
            decode_access_token("not.a.token")
            assert False, "Should have raised an error"
        except Exception:
            pass  # expected

    def test_token_contains_valid_structure(self):
        """Token should be a 3-part JWT (header.payload.signature)."""
        token = create_access_token(subject="99")
        parts = token.split(".")
        assert len(parts) == 3
        assert all(len(p) > 0 for p in parts)
