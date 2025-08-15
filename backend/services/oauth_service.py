"""
OAuth Service - Basic implementation for SMTP OAuth authentication
"""

import logging
import os

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class OAuthService:
    """Basic OAuth service for SMTP authentication"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_valid_access_token(
        self, client_id: str, refresh_token: str = ""
    ) -> str | None:
        """Get valid access token - environment-based implementation"""
        # For now, use environment variables for OAuth tokens
        # Future: Implement proper OAuth2 flow with refresh tokens

        oauth_token = os.getenv(f"OAUTH_TOKEN_{client_id.upper()}")
        if oauth_token:
            logger.info(
                f"Using environment OAuth token for client {client_id}"
            )
            return oauth_token

        # If no environment token, check for generic OAuth token
        generic_token = os.getenv("OAUTH_ACCESS_TOKEN")
        if generic_token:
            logger.info("Using generic OAuth access token")
            return generic_token

        logger.warning("No OAuth token found in environment variables")
        return None

    def generate_xoauth2_string(self, email: str, access_token: str) -> str:
        """Generate XOAUTH2 string for SMTP authentication"""
        import base64

        auth_string = f"user={email}\x01auth=Bearer {access_token}\x01\x01"
        return base64.b64encode(auth_string.encode()).decode()
