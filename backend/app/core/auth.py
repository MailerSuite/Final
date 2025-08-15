# Compatibility shim for tests expecting `app.core.auth`
from core.auth_utils import (
    get_password_hash,
    verify_password,
    create_access_token,
)

# Provide a simple verify_token shim for tests
from core.auth_utils import decode_token as _decode_token

def verify_token(token: str) -> dict:
    """Compatibility function used by tests to validate JWT tokens.
    Returns decoded payload or raises ValueError on invalid token.
    """
    return _decode_token(token)
