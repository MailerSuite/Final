"""
SECURITY FIX: Production CORS Configuration
Environment-based CORS settings with enhanced security validation
UNIFIED DOMAIN APPROACH: Using only sgpt.dev for all traffic
"""

import logging
import os
from typing import Any
from urllib.parse import urlparse

from config.settings import settings

logger = logging.getLogger(__name__)


class CORSConfig:
    """SECURITY FIX: Enhanced CORS configuration with unified domain strategy"""

    def __init__(self):
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.debug = settings.DEBUG

    def get_allowed_origins(self) -> list[str]:
        """SECURITY FIX: Get strictly validated allowed origins for unified domain"""

        if self.environment == "production":
            # UNIFIED DOMAIN: Production - only sgpt.dev domains
            production_origins = [
                "https://sgpt.dev",
                "https://www.sgpt.dev",
            ]

            # CRITICAL: Never use wildcard "*" with credentials

            # Allow custom production origins from environment (validated)
            env_origins = os.getenv("CORS_ORIGINS", "")
            if env_origins:
                try:
                    if env_origins.startswith("["):
                        import json

                        custom_origins = json.loads(env_origins)
                    else:
                        custom_origins = [
                            origin.strip() for origin in env_origins.split(",")
                        ]

                    # SECURITY FIX: Validate production origins strictly
                    validated_origins = []
                    for origin in custom_origins:
                        if self._is_valid_production_origin(origin):
                            validated_origins.append(origin)
                        else:
                            logger.warning(
                                f"Rejected invalid production origin: {origin}"
                            )

                    production_origins.extend(validated_origins)

                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(
                        f"Invalid CORS_ORIGINS format in production: {e}"
                    )

            logger.info(f"Production CORS origins: {production_origins}")
            return production_origins

        elif self.environment == "staging":
            # UNIFIED DOMAIN: Staging - sgpt.dev + local testing
            staging_origins = [
                "https://sgpt.dev",
                "http://sgpt.dev",  # For testing without SSL
                "http://localhost:3000",  # Local frontend testing
                "http://localhost:3001",  # Alternative port
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
            ]

            # Allow additional staging origins
            env_origins = os.getenv("CORS_ORIGINS", "")
            if env_origins:
                try:
                    if env_origins.startswith("["):
                        import json

                        custom_origins = json.loads(env_origins)
                    else:
                        custom_origins = [
                            origin.strip() for origin in env_origins.split(",")
                        ]

                    # SECURITY FIX: Validate staging origins
                    validated_origins = []
                    for origin in custom_origins:
                        if self._is_valid_staging_origin(origin):
                            validated_origins.append(origin)
                        else:
                            logger.warning(
                                f"Rejected invalid staging origin: {origin}"
                            )

                    staging_origins.extend(validated_origins)

                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(
                        f"Invalid CORS_ORIGINS format in staging: {e}"
                    )

            logger.info(f"Staging CORS origins: {staging_origins}")
            return staging_origins

        else:
            # Development - local development setup + production domain for testing
            dev_origins = [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:4000",  # Vite dev server (package.json)
                "http://localhost:5173",  # Vite dev server
                "http://localhost:8000",  # Backend server (for same-origin testing)
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3001",
                "http://127.0.0.1:4000",  # Vite dev server (package.json)
                "http://127.0.0.1:5173",
                "http://127.0.0.1:8000",  # Backend server IP (for same-origin testing)
                "https://sgpt.dev",  # For testing with production domain
                "http://sgpt.dev",  # For testing without SSL
            ]

            # Check for custom development origins
            env_origins = os.getenv("CORS_ORIGINS", "")
            if env_origins:
                try:
                    if env_origins.startswith("["):
                        import json

                        custom_origins = json.loads(env_origins)
                    else:
                        custom_origins = [
                            origin.strip() for origin in env_origins.split(",")
                        ]

                    # SECURITY FIX: Validate even development origins
                    validated_origins = []
                    for origin in custom_origins:
                        if self._is_valid_development_origin(origin):
                            validated_origins.append(origin)
                        else:
                            logger.warning(
                                f"Rejected invalid development origin: {origin}"
                            )

                    dev_origins.extend(validated_origins)

                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(
                        f"Invalid CORS_ORIGINS format in development: {e}"
                    )

            logger.info(f"Development CORS origins: {dev_origins}")
            return dev_origins

    def _is_valid_production_origin(self, origin: str) -> bool:
        """UNIFIED DOMAIN: Validate production origins - only allow sgpt.dev"""
        try:
            parsed = urlparse(origin)

            # Must be HTTPS in production
            if parsed.scheme != "https":
                return False

            # Must be sgpt.dev domain
            allowed_domains = ["sgpt.dev", "www.sgpt.dev"]
            if parsed.netloc not in allowed_domains:
                return False

            return True

        except Exception as e:
            logger.error(f"Error validating production origin {origin}: {e}")
            return False

    def _is_valid_staging_origin(self, origin: str) -> bool:
        """UNIFIED DOMAIN: Validate staging origins"""
        try:
            parsed = urlparse(origin)

            # Allow HTTP/HTTPS
            if parsed.scheme not in ["http", "https"]:
                return False

            # Allow sgpt.dev domains and localhost
            allowed_domains = [
                "sgpt.dev",
                "www.sgpt.dev",
                "localhost",
                "127.0.0.1",
            ]
            if parsed.netloc.split(":")[0] not in allowed_domains:
                return False

            return True

        except Exception as e:
            logger.error(f"Error validating staging origin {origin}: {e}")
            return False

    def _is_valid_development_origin(self, origin: str) -> bool:
        """UNIFIED DOMAIN: Validate development origins"""
        try:
            parsed = urlparse(origin)

            # Allow HTTP/HTTPS/WS/WSS
            if parsed.scheme not in ["http", "https", "ws", "wss"]:
                return False

            # Allow localhost, 127.0.0.1, and sgpt.dev for testing
            host = parsed.netloc.split(":")[0]
            allowed_domains = [
                "localhost",
                "127.0.0.1",
                "sgpt.dev",
                "www.sgpt.dev",
            ]

            if host not in allowed_domains:
                return False

            return True

        except Exception as e:
            logger.error(f"Error validating development origin {origin}: {e}")
            return False

    def get_cors_config(self) -> dict[str, Any]:
        """SECURITY FIX: Get secure CORS configuration for unified domain"""
        allowed_origins = self.get_allowed_origins()

        if self.environment == "production":
            return {
                "allow_origins": allowed_origins,
                "allow_credentials": True,
                "allow_methods": [
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "PATCH",
                    "OPTIONS",
                ],
                "allow_headers": [
                    "Accept",
                    "Accept-Language",
                    "Content-Language",
                    "Content-Type",
                    "Authorization",
                    "X-Requested-With",
                    "X-CSRF-Token",
                    "X-Request-ID",
                    "Origin",
                    "Access-Control-Request-Method",
                    "Access-Control-Request-Headers",
                ],
                "expose_headers": [
                    "X-Request-ID",
                    "X-Process-Time",
                    "X-RateLimit-Remaining",
                ],
                "max_age": 86400,  # 24 hours
            }

        elif self.environment == "staging":
            return {
                "allow_origins": allowed_origins,
                "allow_credentials": True,
                "allow_methods": [
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "PATCH",
                    "OPTIONS",
                    "HEAD",
                ],
                "allow_headers": [
                    "Accept",
                    "Accept-Language",
                    "Content-Language",
                    "Content-Type",
                    "Authorization",
                    "X-Requested-With",
                    "X-CSRF-Token",
                    "X-Request-ID",
                    "X-Debug-Info",
                    "Origin",
                    "Access-Control-Request-Method",
                    "Access-Control-Request-Headers",
                ],
                "expose_headers": [
                    "X-Request-ID",
                    "X-Process-Time",
                    "X-RateLimit-Remaining",
                    "X-Debug-Info",
                ],
                "max_age": 3600,  # 1 hour
            }

        else:
            # Development - more permissive but still controlled
            return {
                "allow_origins": allowed_origins,
                "allow_credentials": True,
                "allow_methods": [
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "PATCH",
                    "OPTIONS",
                    "HEAD",
                ],
                "allow_headers": [
                    "Accept",
                    "Accept-Language",
                    "Content-Language",
                    "Content-Type",
                    "Authorization",
                    "X-Requested-With",
                    "X-CSRF-Token",
                    "X-Request-ID",
                    "X-Debug-Info",
                    "Cache-Control",
                    "Origin",
                    "Access-Control-Request-Method",
                    "Access-Control-Request-Headers",
                ],
                "expose_headers": [
                    "X-Request-ID",
                    "X-Process-Time",
                    "X-RateLimit-Remaining",
                    "X-Debug-Info",
                ],
                "max_age": 600,  # 10 minutes
            }

    def validate_cors_security(self) -> dict[str, Any]:
        """SECURITY FIX: Validate CORS configuration security"""
        config = self.get_cors_config()
        issues = []

        # Check for overly permissive configurations
        if "*" in config.get("allow_origins", []):
            issues.append("Wildcard origin '*' detected - security risk")

        if "*" in config.get("allow_methods", []):
            issues.append("Wildcard methods '*' detected - security risk")

        if "*" in config.get("allow_headers", []):
            issues.append("Wildcard headers '*' detected - security risk")

        # Check for insecure origins in production
        if self.environment == "production":
            for origin in config.get("allow_origins", []):
                if origin.startswith("http://"):
                    issues.append(f"HTTP origin in production: {origin}")

        return {"secure": len(issues) == 0, "issues": issues, "config": config}


# SECURITY FIX: Log CORS configuration on startup
def log_cors_security():
    """Log CORS security validation on startup"""
    cors = CORSConfig()
    validation = cors.validate_cors_security()

    if validation["secure"]:
        logger.info("CORS configuration validated - secure")
    else:
        logger.warning("CORS configuration issues detected:")
        for issue in validation["issues"]:
            logger.warning(f"  - {issue}")

    logger.info(f"CORS origins: {validation['config']['allow_origins']}")
    logger.info(f"CORS environment: {cors.environment}")
    logger.info(f"CORS debug mode: {cors.debug}")


# Initialize and validate on import
cors_config = CORSConfig()
log_cors_security()
