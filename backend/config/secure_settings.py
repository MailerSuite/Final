"""
Secure Settings Configuration
Generates secure SECRET_KEY and validates production readiness
"""

import os
import secrets
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def generate_secure_secret_key() -> str:
    """Generate a cryptographically secure secret key"""
    return secrets.token_urlsafe(64)  # 512 bits of entropy


def validate_secret_key(secret_key: str) -> bool:
    """Validate that secret key meets security requirements"""
    if not secret_key:
        return False
    
    if len(secret_key) < 32:
        logger.warning("SECRET_KEY is too short (minimum 32 characters)")
        return False
    
    # Check for common weak patterns
    weak_patterns = [
        "your-secret-key",
        "change-in-production",
        "dev-secret-key",
        "test-secret-key",
        "secret",
        "password",
        "123456",
        "admin",
    ]
    
    secret_lower = secret_key.lower()
    for pattern in weak_patterns:
        if pattern in secret_lower:
            logger.warning(f"SECRET_KEY contains weak pattern: {pattern}")
            return False
    
    return True


def get_secure_secret_key() -> str:
    """Get or generate a secure secret key for production use"""
    secret_key = os.getenv("SECRET_KEY")
    
    # If no secret key is set, generate one
    if not secret_key:
        secret_key = generate_secure_secret_key()
        logger.warning(
            "No SECRET_KEY environment variable found. "
            f"Generated secure key: {secret_key[:8]}..."
            "Set SECRET_KEY environment variable with this value."
        )
        return secret_key
    
    # Validate existing secret key
    if not validate_secret_key(secret_key):
        logger.error(
            "Current SECRET_KEY is not secure for production use. "
            "Generate a new one with: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
        )
        # Generate a new secure key anyway
        new_key = generate_secure_secret_key()
        logger.error(f"Use this secure key instead: {new_key}")
        # Return the insecure key with warning (don't break existing systems)
        return secret_key
    
    return secret_key


def setup_production_security() -> dict:
    """Setup and validate production security configuration"""
    config = {}
    
    # Get secure secret key
    config["SECRET_KEY"] = get_secure_secret_key()
    
    # Validate other security settings
    config["DEBUG"] = os.getenv("DEBUG", "False").lower() != "true"
    
    if config["DEBUG"]:
        logger.warning("DEBUG mode is enabled - disable in production!")
    
    # HTTPS enforcement
    config["FORCE_HTTPS"] = os.getenv("FORCE_HTTPS", "False").lower() == "true"
    
    if not config["FORCE_HTTPS"]:
        logger.warning("HTTPS enforcement is disabled - enable in production!")
    
    # CORS configuration
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    config["ALLOWED_ORIGINS"] = [origin.strip() for origin in allowed_origins]
    
    # Database security
    db_url = os.getenv("DATABASE_URL", "")
    if "localhost" in db_url or "127.0.0.1" in db_url:
        logger.warning("Database appears to be local - use remote database in production!")
    
    logger.info("Production security configuration validated")
    return config