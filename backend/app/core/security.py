# Compatibility shim for tests expecting `app.core.security`
from core.security import (
    get_password_hash,
    verify_password,
    hash_password,
    validate_password_strength,
)

# Provide a boolean checker matching unit test expectations

def check_password_strength(password: str) -> bool:
    """Return True if password is considered strong, else False.
    Criteria: length>=8, contains uppercase, lowercase, digit, and special char.
    """
    import re

    if not isinstance(password, str):
        return False
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True
