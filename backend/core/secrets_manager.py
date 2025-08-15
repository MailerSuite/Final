"""
MailerSuite2 Secrets Management System
=====================================

Centralized secrets management with validation, rotation, and external provider support.
Supports environment variables, HashiCorp Vault, AWS Secrets Manager, and more.
"""

import logging
import os
import secrets
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class SecretType(Enum):
    """Types of secrets with different validation requirements"""

    PASSWORD = "password"
    API_KEY = "api_key"
    DATABASE_URL = "database_url"
    JWT_SECRET = "jwt_secret"
    ENCRYPTION_KEY = "encryption_key"
    SMTP_PASSWORD = "smtp_password"


class SecretsManager:
    """
    Centralized secrets management with multiple backend support
    """

    def __init__(self, environment: str = "production"):
        self.environment = environment
        self.secrets_cache: dict[str, Any] = {}
        self.cache_ttl = timedelta(minutes=5)  # Cache secrets for 5 minutes
        self.last_refresh: dict[str, datetime] = {}

        # Configuration
        self.min_password_length = 12
        self.require_complex_passwords = environment == "production"

        # Load secrets from various sources
        self._load_environment_secrets()

    def _load_environment_secrets(self) -> None:
        """Load secrets from environment variables"""
        env_secrets = {
            "admin_password": os.getenv("ADMIN_PASSWORD"),
            "secret_key": os.getenv("SECRET_KEY"),
            "database_url": os.getenv("DATABASE_URL"),
            "redis_url": os.getenv("REDIS_URL"),
            "smtp_password": os.getenv("SMTP_PASSWORD"),
            "api_key": os.getenv("API_KEY"),
            "encryption_key": os.getenv("ENCRYPTION_KEY"),
        }

        # Filter out None values
        self.secrets_cache = {
            k: v for k, v in env_secrets.items() if v is not None
        }

        # Validate critical secrets
        self._validate_secrets()

    def _validate_secrets(self) -> None:
        """Validate secrets according to security requirements"""
        critical_secrets = ["admin_password", "secret_key"]

        for secret_name in critical_secrets:
            if secret_name not in self.secrets_cache:
                logger.warning(f"⚠️ Critical secret '{secret_name}' not found")
                continue

            value = self.secrets_cache[secret_name]

            # Validate password strength
            if "password" in secret_name:
                if not self._validate_password_strength(value):
                    logger.warning(
                        f"⚠️ Weak password detected for '{secret_name}'"
                    )

            # Validate secret key entropy
            if secret_name == "secret_key":
                if not self._validate_secret_key(value):
                    logger.warning("⚠️ Weak secret key detected")

    def _validate_password_strength(self, password: str) -> bool:
        """Validate password strength"""
        if len(password) < self.min_password_length:
            return False

        if not self.require_complex_passwords:
            return True

        # Check for complexity requirements in production
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)

        return has_upper and has_lower and has_digit and has_special

    def _validate_secret_key(self, secret_key: str) -> bool:
        """Validate JWT secret key entropy"""
        return len(secret_key) >= 32 and secret_key != "your-secret-key-here"

    def get_secret(
        self,
        secret_name: str,
        default: str | None = None,
        secret_type: SecretType = SecretType.PASSWORD,
    ) -> str | None:
        """
        Get a secret with caching and validation

        Args:
            secret_name: Name of the secret
            default: Default value if secret not found
            secret_type: Type of secret for validation

        Returns:
            Secret value or default
        """
        # Check cache first
        if secret_name in self.secrets_cache:
            # Check if cache is still valid
            last_refresh = self.last_refresh.get(secret_name, datetime.min)
            if datetime.now() - last_refresh < self.cache_ttl:
                return self.secrets_cache[secret_name]

        # Refresh from source
        value = self._fetch_secret(secret_name, default)

        if value:
            self.secrets_cache[secret_name] = value
            self.last_refresh[secret_name] = datetime.now()

            # Validate based on type
            if not self._validate_secret_by_type(value, secret_type):
                logger.warning(
                    f"⚠️ Secret '{secret_name}' failed validation for type {secret_type}"
                )

        return value

    async def _fetch_secret(
        self, secret_name: str, default: str | None = None
    ) -> str | None:
        """Fetch secret from various sources"""
        # Try environment variable first
        env_value = os.getenv(secret_name.upper())
        if env_value:
            return env_value

        # Try with different naming conventions
        alt_names = [
            secret_name.lower(),
            secret_name.upper(),
            secret_name.replace("_", "-"),
            secret_name.replace("-", "_"),
        ]

        for alt_name in alt_names:
            value = os.getenv(alt_name)
            if value:
                return value

        # External secret managers support
        try:
            # Try HashiCorp Vault
            if os.getenv("VAULT_ADDR") and os.getenv("VAULT_TOKEN"):
                vault_value = await self._get_from_vault(key)
                if vault_value:
                    return vault_value
            
            # Try AWS Secrets Manager
            if os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
                aws_value = await self._get_from_aws_secrets(key)
                if aws_value:
                    return aws_value
            
            # Try Azure Key Vault
            if os.getenv("AZURE_CLIENT_ID") and os.getenv("AZURE_TENANT_ID"):
                azure_value = await self._get_from_azure_vault(key)
                if azure_value:
                    return azure_value
            
            # Try Google Secret Manager
            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                gcp_value = await self._get_from_gcp_secrets(key)
                if gcp_value:
                    return gcp_value
                    
        except Exception as e:
            logger.warning(f"External secret manager lookup failed for {key}: {e}")

        return default

    def _validate_secret_by_type(
        self, value: str, secret_type: SecretType
    ) -> bool:
        """Validate secret based on its type"""
        if secret_type == SecretType.PASSWORD:
            return self._validate_password_strength(value)
        elif secret_type == SecretType.JWT_SECRET:
            return self._validate_secret_key(value)
        elif secret_type == SecretType.DATABASE_URL:
            return value.startswith(("postgresql://", "mysql://", "sqlite://"))
        elif secret_type == SecretType.API_KEY:
            return len(value) >= 16
        elif secret_type == SecretType.ENCRYPTION_KEY:
            return len(value) >= 32
        else:
            return True  # Default validation

    def generate_secure_password(self, length: int = 20) -> str:
        """Generate a cryptographically secure password"""
        alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
        return "".join(secrets.choice(alphabet) for _ in range(length))

    def generate_api_key(self, prefix: str = "ms2") -> str:
        """Generate a secure API key with prefix"""
        random_part = secrets.token_urlsafe(32)
        return f"{prefix}_{random_part}"

    def generate_jwt_secret(self) -> str:
        """Generate a secure JWT secret"""
        return secrets.token_urlsafe(64)

    async def rotate_secret(self, secret_name: str) -> str:
        """Rotate a secret and return the new value"""
        logger.info(f"🔄 Rotating secret: {secret_name}")

        # Generate new secret based on type
        if "password" in secret_name:
            new_secret = self.generate_secure_password()
        elif "api_key" in secret_name:
            new_secret = self.generate_api_key()
        elif "secret_key" in secret_name or "jwt" in secret_name:
            new_secret = self.generate_jwt_secret()
        else:
            new_secret = secrets.token_urlsafe(32)

        # Update cache
        self.secrets_cache[secret_name] = new_secret
        self.last_refresh[secret_name] = datetime.now()

        logger.info(f"✅ Secret '{secret_name}' rotated successfully")

        # Update external systems with new secret
        await self._update_external_secrets(key, value)
        # - Update environment variables
        # - Notify dependent services
        # - Update external secret managers

        return new_secret

    def audit_secrets(self) -> dict[str, Any]:
        """Audit current secrets for security compliance"""
        audit_results = {
            "timestamp": datetime.now().isoformat(),
            "environment": self.environment,
            "secrets_count": len(self.secrets_cache),
            "issues": [],
        }

        for secret_name, secret_value in self.secrets_cache.items():
            issues = []

            # Check for weak passwords
            if "password" in secret_name:
                if not self._validate_password_strength(secret_value):
                    issues.append("Weak password detected")

            # Check for default values
            default_patterns = [
                "admin123",
                "password",
                "secret",
                "changeme",
                "default",
            ]
            if any(
                pattern in secret_value.lower() for pattern in default_patterns
            ):
                issues.append("Using default/predictable value")

            # Check age (if we have metadata)
            # Track secret creation/rotation dates
        self._track_secret_metadata(key, {
            "created_at": time.time(),
            "type": secret_type,
            "description": description or "",
            "last_rotated": None,
            "rotation_count": 0
        })

        if issues:
                audit_results["issues"].append(
                    {
                        "secret_name": secret_name,
                        "issues": issues,
                        "severity": "high"
                        if "password" in secret_name
                        else "medium",
                    }
                )

        return audit_results

    def create_environment_template(self) -> str:
        """Create a template .env file with secure defaults"""
        template = f"""# MailerSuite2 Environment Configuration
# Generated on {datetime.now().isoformat()}
# 
# SECURITY NOTICE: 
# - Replace all example values with secure, unique values
# - Use strong passwords (12+ characters with mixed case, numbers, symbols)
# - Never commit real secrets to version control

# === AUTHENTICATION ===
ADMIN_PASSWORD={self.generate_secure_password()}
SECRET_KEY={self.generate_jwt_secret()}

# === DATABASE ===
DATABASE_URL=postgresql://sgpt:SECURE_PASSWORD@localhost:5432/sgpt_prod

# === REDIS ===
REDIS_URL=redis://localhost:6379/0

# === EMAIL SETTINGS ===
SMTP_PASSWORD=your_smtp_password_here

# === API SECURITY ===
API_KEY={self.generate_api_key()}
ENCRYPTION_KEY={secrets.token_urlsafe(32)}

# === ENVIRONMENT ===
DEBUG=False
ENVIRONMENT=production
DDOS_PROTECTION=True

# === EXTERNAL SERVICES ===
# Add your external service API keys here
# SENDGRID_API_KEY=your_sendgrid_api_key
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
"""
        return template

    def setup_secrets_validation(self) -> None:
        """Set up automatic secrets validation"""
        logger.info("🔒 Setting up secrets validation...")

        # Check for missing critical secrets
        critical_secrets = ["admin_password", "secret_key"]
        missing_secrets = [
            s for s in critical_secrets if s not in self.secrets_cache
        ]

        if missing_secrets:
            logger.error(f"❌ Missing critical secrets: {missing_secrets}")

            # Generate and log instructions for missing secrets
            for secret in missing_secrets:
                generated_value = (
                    self.generate_secure_password()
                    if "password" in secret
                    else self.generate_jwt_secret()
                )
                logger.info(f"💡 Set {secret.upper()}={generated_value}")

        # Audit current secrets
        audit_results = self.audit_secrets()
        if audit_results["issues"]:
            logger.warning(
                f"⚠️ Found {len(audit_results['issues'])} secret security issues"
            )
            for issue in audit_results["issues"]:
                logger.warning(
                    f"   - {issue['secret_name']}: {', '.join(issue['issues'])}"
                )
        else:
            logger.info("✅ All secrets passed security validation")


# Global secrets manager instance
secrets_manager = SecretsManager(
    environment=os.getenv("ENVIRONMENT", "production")
)


# Convenience functions
def get_secret(
    name: str,
    default: str | None = None,
    secret_type: SecretType = SecretType.PASSWORD,
) -> str | None:
    """Get a secret from the global secrets manager"""
    return secrets_manager.get_secret(name, default, secret_type)


def audit_secrets() -> dict[str, Any]:
    """Audit all secrets"""
    return secrets_manager.audit_secrets()


def setup_secrets() -> None:
    """Set up and validate secrets"""
    secrets_manager.setup_secrets_validation()
