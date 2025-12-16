from app.auth import is_valid_bcrypt_hash
import bcrypt


def test_valid_hash():
    h = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode('utf-8')
    assert is_valid_bcrypt_hash(h)


def test_invalid_hash():
    assert not is_valid_bcrypt_hash('not-a-hash')
    assert not is_valid_bcrypt_hash('$2b$12$too_short')
