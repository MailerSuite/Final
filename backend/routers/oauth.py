"""
OAuth Router
Handles OAuth authentication with external providers (Microsoft, Google, etc.)
"""

import logging
import os
import secrets
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/oauth", tags=["Authentication"])

# OAuth Configuration
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "your-client-id")
MICROSOFT_CLIENT_SECRET = os.getenv(
    "MICROSOFT_CLIENT_SECRET", "your-client-secret"
)
MICROSOFT_REDIRECT_URI = os.getenv(
    "MICROSOFT_REDIRECT_URI",
    "http://localhost:8000/api/v1/oauth/oauth/microsoft/callback",
)

# OAuth endpoints
MICROSOFT_AUTHORIZE_URL = (
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
)
MICROSOFT_TOKEN_URL = (
    "https://login.microsoftonline.com/common/oauth2/v2.0/token"
)
MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0"

# OAuth scopes
MICROSOFT_SCOPES = [
    "openid",
    "profile",
    "email",
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/Mail.ReadWrite",
]


# Schemas
class OAuthState(BaseModel):
    state: str
    provider: str
    user_id: int | None = None
    redirect_url: str | None = None


class OAuthTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str | None = None
    scope: str
    id_token: str | None = None


class OAuthUserInfo(BaseModel):
    id: str
    email: str
    name: str
    given_name: str | None = None
    family_name: str | None = None
    picture: str | None = None


class OAuthAuthorizationResponse(BaseModel):
    authorization_url: str
    state: str
    provider: str


# In-memory state storage (use Redis in production)
oauth_states: dict[str, OAuthState] = {}


@router.get("/oauth/microsoft/authorize")
async def microsoft_authorize(
    request: Request,
    redirect_url: str | None = None,
    current_user: User = Depends(get_current_user),
) -> OAuthAuthorizationResponse:
    """
    Initiate Microsoft OAuth authorization flow
    """
    try:
        # Generate state parameter for CSRF protection
        state = secrets.token_urlsafe(32)

        # Store state information
        oauth_states[state] = OAuthState(
            state=state,
            provider="microsoft",
            user_id=current_user.id if current_user else None,
            redirect_url=redirect_url,
        )

        # Build authorization URL
        params = {
            "client_id": MICROSOFT_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": MICROSOFT_REDIRECT_URI,
            "scope": " ".join(MICROSOFT_SCOPES),
            "state": state,
            "response_mode": "query",
        }

        authorization_url = f"{MICROSOFT_AUTHORIZE_URL}?{urlencode(params)}"

        return OAuthAuthorizationResponse(
            authorization_url=authorization_url,
            state=state,
            provider="microsoft",
        )

    except Exception as e:
        logger.error(f"Microsoft OAuth authorization failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth authorization failed: {str(e)}",
        )


@router.get("/oauth/microsoft/callback")
async def microsoft_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Microsoft OAuth callback
    """
    try:
        # Check for errors
        if error:
            logger.error(
                f"Microsoft OAuth error: {error} - {error_description}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"OAuth error: {error_description or error}",
            )

        # Validate state parameter
        if not state or state not in oauth_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or missing state parameter",
            )

        oauth_state = oauth_states[state]

        # Validate authorization code
        if not code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing authorization code",
            )

        # Exchange code for tokens
        token_data = {
            "client_id": MICROSOFT_CLIENT_ID,
            "client_secret": MICROSOFT_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": MICROSOFT_REDIRECT_URI,
        }

        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                MICROSOFT_TOKEN_URL,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

        if token_response.status_code != 200:
            logger.error(f"Token exchange failed: {token_response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code for tokens",
            )

        token_json = token_response.json()
        access_token = token_json.get("access_token")

        # Get user information from Microsoft Graph
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                f"{MICROSOFT_GRAPH_URL}/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        if user_response.status_code != 200:
            logger.error(f"Failed to get user info: {user_response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve user information",
            )

        user_info = user_response.json()

        # Clean up state
        del oauth_states[state]

        # Return success response with user info and tokens
        redirect_url = oauth_state.redirect_url or "/"

        # In a real implementation, you would:
        # 1. Store the tokens securely
        # 2. Link the OAuth account to the user
        # 3. Update user's email accounts

        return {
            "success": True,
            "provider": "microsoft",
            "user_info": {
                "id": user_info.get("id"),
                "email": user_info.get("mail")
                or user_info.get("userPrincipalName"),
                "name": user_info.get("displayName"),
                "given_name": user_info.get("givenName"),
                "family_name": user_info.get("surname"),
            },
            "tokens": {
                "access_token": access_token,
                "token_type": token_json.get("token_type"),
                "expires_in": token_json.get("expires_in"),
                "refresh_token": token_json.get("refresh_token"),
                "scope": token_json.get("scope"),
            },
            "message": "Microsoft OAuth authentication successful",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Microsoft OAuth callback failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}",
        )


@router.post("/oauth/microsoft/refresh")
async def microsoft_refresh_token(
    refresh_token: str, current_user: User = Depends(get_current_user)
) -> OAuthTokenResponse:
    """
    Refresh Microsoft OAuth access token
    """
    try:
        token_data = {
            "client_id": MICROSOFT_CLIENT_ID,
            "client_secret": MICROSOFT_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                MICROSOFT_TOKEN_URL,
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

        if response.status_code != 200:
            logger.error(f"Token refresh failed: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to refresh access token",
            )

        token_json = response.json()

        return OAuthTokenResponse(
            access_token=token_json["access_token"],
            token_type=token_json.get("token_type", "bearer"),
            expires_in=token_json["expires_in"],
            refresh_token=token_json.get("refresh_token", refresh_token),
            scope=token_json.get("scope", ""),
            id_token=token_json.get("id_token"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Microsoft token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}",
        )


@router.get("/oauth/microsoft/profile")
async def get_microsoft_profile(
    access_token: str, current_user: User = Depends(get_current_user)
) -> OAuthUserInfo:
    """
    Get Microsoft user profile information
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{MICROSOFT_GRAPH_URL}/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        if response.status_code != 200:
            logger.error(f"Failed to get profile: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve user profile",
            )

        user_info = response.json()

        return OAuthUserInfo(
            id=user_info["id"],
            email=user_info.get("mail") or user_info.get("userPrincipalName"),
            name=user_info.get("displayName", ""),
            given_name=user_info.get("givenName"),
            family_name=user_info.get("surname"),
            picture=None,  # Microsoft Graph doesn't provide picture URL directly
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get Microsoft profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}",
        )


@router.get("/oauth/status")
async def oauth_status(
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Get OAuth integration status for current user
    """
    return {
        "user_id": current_user.id if current_user else None,
        "integrations": {
            "microsoft": {
                "configured": bool(
                    MICROSOFT_CLIENT_ID
                    and MICROSOFT_CLIENT_ID != "your-client-id"
                ),
                "scopes": MICROSOFT_SCOPES,
                "redirect_uri": MICROSOFT_REDIRECT_URI,
            }
        },
        "active_states": len(oauth_states),
    }


@router.delete("/oauth/revoke/{provider}")
async def revoke_oauth_integration(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Revoke OAuth integration for a provider
    """
    if provider not in ["microsoft"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}",
        )

    # In a real implementation, you would:
    # 1. Revoke the tokens with the provider
    # 2. Remove stored credentials from database
    # 3. Disconnect associated email accounts

    return {
        "success": True,
        "provider": provider,
        "message": f"{provider.title()} OAuth integration revoked successfully",
    }
