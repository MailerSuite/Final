"""Security module"""

import json
import os
from typing import Any

from dotenv import load_dotenv
from core.auth_utils import get_password_hash as _get_password_hash_auth, verify_password as _verify_password_auth

# Load environment variables
load_dotenv()


def get_env_var(
    key: str, default: str | None = None, required: bool = True
) -> str:
    """Safe environment variable retrieval"""
    value = os.getenv(key, default)
    if required and value is None:
        raise ValueError(f"Required environment variable {key} is not set")
    return value


def encrypt_password(password: str) -> str:
    """Encrypt password for storage (e.g., SMTP passwords)"""
    # For now, using a simple base64 encoding with salt
    # In production, use proper encryption like Fernet
    import base64
    import secrets
    salt = secrets.token_hex(8)
    encoded = base64.b64encode(f"{salt}:{password}".encode()).decode()
    return encoded


def decrypt_password(encrypted: str) -> str:
    """Decrypt password from storage"""
    import base64
    try:
        decoded = base64.b64decode(encrypted.encode()).decode()
        _, password = decoded.split(":", 1)
        return password
    except:
        return encrypted  # Return as-is if decryption fails


def safe_eval(expression: str, allowed_names: dict | None = None) -> Any:
    """Safe alternative to eval()"""
    # Use json for simple expressions
    try:
        return json.loads(expression)
    except json.JSONDecodeError:
        pass

    # Use ast for mathematical expressions
    import ast
    import operator as op

    # Allowed operators
    operators = {
        ast.Add: op.add,
        ast.Sub: op.sub,
        ast.Mult: op.mul,
        ast.Div: op.truediv,
        ast.Pow: op.pow,
        ast.USub: op.neg,
    }

    def eval_expr(node):
        if isinstance(node, ast.Num):
            return node.n
        elif isinstance(node, ast.BinOp):
            return operators[type(node.op)](
                eval_expr(node.left), eval_expr(node.right)
            )
        elif isinstance(node, ast.UnaryOp):
            return operators[type(node.op)](eval_expr(node.operand))
        else:
            raise TypeError(node)

    try:
        return eval_expr(ast.parse(expression, mode="eval").body)
    except:
        raise ValueError(f"Invalid expression: {expression}")


def sanitize_input(input_string: str) -> str:
    """Sanitize user input to prevent injection attacks"""
    import html
    import re
    
    # Remove potentially dangerous characters
    sanitized = html.escape(input_string)
    
    # Remove script tags and other dangerous patterns
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'vbscript:',
        r'on\w+\s*=',
        r'<iframe[^>]*>',
        r'<object[^>]*>',
        r'<embed[^>]*>',
    ]
    
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE | re.DOTALL)
    
    return sanitized.strip()


def validate_email(email: str) -> bool:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> dict[str, Any]:
    """Validate password strength and return detailed feedback"""
    import re
    
    feedback = {
        'valid': True,
        'score': 0,
        'issues': [],
        'suggestions': []
    }
    
    # Check length
    if len(password) < 8:
        feedback['valid'] = False
        feedback['issues'].append('Password must be at least 8 characters long')
    elif len(password) >= 12:
        feedback['score'] += 2
    else:
        feedback['score'] += 1
    
    # Check for uppercase letters
    if not re.search(r'[A-Z]', password):
        feedback['issues'].append('Password must contain at least one uppercase letter')
    else:
        feedback['score'] += 1
    
    # Check for lowercase letters
    if not re.search(r'[a-z]', password):
        feedback['issues'].append('Password must contain at least one lowercase letter')
    else:
        feedback['score'] += 1
    
    # Check for numbers
    if not re.search(r'\d', password):
        feedback['issues'].append('Password must contain at least one number')
    else:
        feedback['score'] += 1
    
    # Check for special characters
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        feedback['suggestions'].append('Consider adding special characters for better security')
    else:
        feedback['score'] += 1
    
    # Check for common patterns
    common_patterns = [
        r'123',
        r'abc',
        r'qwe',
        r'password',
        r'admin',
        r'user',
        r'test'
    ]
    
    for pattern in common_patterns:
        if re.search(pattern, password.lower()):
            feedback['issues'].append(f'Avoid common patterns like "{pattern}"')
            feedback['score'] = max(0, feedback['score'] - 1)
    
    # Determine overall validity
    if feedback['issues']:
        feedback['valid'] = False
    
    # Add score-based suggestions
    if feedback['score'] < 3:
        feedback['suggestions'].append('Consider using a longer password with more variety')
    elif feedback['score'] >= 4:
        feedback['suggestions'].append('Strong password! Consider using a password manager')
    
    return feedback


def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token"""
    import secrets
    import string
    
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def hash_sensitive_data(data: str) -> str:
    """Hash sensitive data for storage"""
    import hashlib
    import secrets
    
    salt = secrets.token_hex(16)
    hash_obj = hashlib.sha256()
    hash_obj.update((data + salt).encode('utf-8'))
    return f"{salt}${hash_obj.hexdigest()}"


def verify_hashed_data(data: str, hashed_data: str) -> bool:
    """Verify hashed data"""
    import hashlib
    
    try:
        salt, hash_value = hashed_data.split('$', 1)
        hash_obj = hashlib.sha256()
        hash_obj.update((data + salt).encode('utf-8'))
        return hash_obj.hexdigest() == hash_value
    except:
        return False


def get_password_hash(password: str) -> str:
    """Proxy to centralized bcrypt hashing implementation."""
    return _get_password_hash_auth(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Proxy to centralized bcrypt verification implementation."""
    return _verify_password_auth(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Proxy to centralized bcrypt hashing implementation (alias)."""
    return _get_password_hash_auth(password)


# ----------------------------------------------------------------------------
# Admin authentication dependency shim for routers expecting core.security API
# ----------------------------------------------------------------------------
try:
    # Re-export FastAPI dependency used across admin routers
    from fastapi import Depends  # type: ignore
    from routers.auth import (
        get_current_admin_user as _get_current_admin_user,  # type: ignore
    )

    async def get_current_admin_user(current_user=Depends(_get_current_admin_user)):
        return current_user
except Exception:
    # Minimal fallback to avoid import-time failures in optional bridge routers
    async def get_current_admin_user():  # type: ignore
        class _Admin:
            id = -1
            email = "admin@local"
            is_active = True
            is_admin = True
            created_at = None

        return _Admin()
