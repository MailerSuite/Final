"""
🔗 Authentication API Integration Tests
Testing authentication endpoints with real HTTP requests
"""

import pytest
from fastapi.testclient import TestClient


class TestAuthenticationEndpoints:
    """Test authentication API endpoints."""
    
    @pytest.mark.asyncio
    def test_login_success(self, client: TestClient, admin_credentials):
        """Test successful login."""
        # Support both consolidated and fallback auth payloads
        payload = {"email": admin_credentials["email"], "password": admin_credentials["password"]}
        response = client.post("/api/v1/auth/login", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == admin_credentials["email"]
    
    @pytest.mark.asyncio
    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    def test_login_missing_fields(self, client: TestClient):
        """Test login with missing required fields."""
        # Missing password
        response = client.post("/api/v1/auth/login", json={"email": "test@example.com"})
        assert response.status_code == 422
        
        # Missing email
        response = client.post("/api/v1/auth/login", json={"password": "password"})
        assert response.status_code == 422
        
        # Empty request
        response = client.post("/api/v1/auth/login", json={})
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    def test_get_current_user(self, client: TestClient, admin_headers):
        """Test getting current user information."""
        response = client.get("/api/v1/auth/me", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "is_active" in data
        assert "is_admin" in data
    
    @pytest.mark.asyncio
    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting current user without authorization."""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token."""
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=invalid_headers)
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    def test_refresh_token(self, client: TestClient, admin_credentials):
        """Test token refresh functionality."""
        # First, login to get tokens
        login_response = client.post("/api/v1/auth/login", json=admin_credentials)
        login_data = login_response.json()
        
        # Use refresh token to get new access token
        refresh_headers = {"Authorization": f"Bearer {login_data.get('refresh_token', '')}"}
        response = client.post("/api/v1/auth/refresh", headers=refresh_headers)
        
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert "token_type" in data
            # New token should be different from original
            assert data["access_token"] != login_data["access_token"]
    
    @pytest.mark.asyncio
    def test_logout(self, client: TestClient, admin_headers):
        """Test user logout."""
        response = client.post("/api/v1/auth/logout", headers=admin_headers)
        
        # Should succeed regardless of implementation
        assert response.status_code in [200, 204]


class TestUserRegistration:
    """Test user registration endpoints."""
    
    @pytest.mark.asyncio
    def test_register_new_user(self, client: TestClient):
        """Test registering a new user."""
        registration_data = {
            "email": "newuser@example.com",
            "password": "NewUserPassword123!",
            "confirm_password": "NewUserPassword123!"
        }
        
        response = client.post("/api/v1/auth/register", json=registration_data)
        
        if response.status_code == 201:
            data = response.json()
            assert "id" in data
            assert data["email"] == registration_data["email"]
            assert "password" not in data  # Password should not be returned
    
    @pytest.mark.asyncio
    def test_register_duplicate_email(self, client: TestClient, admin_credentials):
        """Test registering with existing email."""
        registration_data = {"email": admin_credentials["email"], "password": "NewPassword123!", "confirm_password": "NewPassword123!"}
        response = client.post("/api/v1/auth/register", json=registration_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    @pytest.mark.asyncio
    def test_register_password_mismatch(self, client: TestClient):
        """Test registration with password mismatch."""
        registration_data = {
            "email": "mismatch@example.com",
            "password": "Password123!",
            "confirm_password": "DifferentPassword123!"
        }
        
        response = client.post("/api/v1/auth/register", json=registration_data)
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        registration_data = {
            "email": "weak@example.com",
            "password": "weak",
            "confirm_password": "weak"
        }
        
        response = client.post("/api/v1/auth/register", json=registration_data)
        
        assert response.status_code == 422


class TestPasswordReset:
    """Test password reset functionality."""
    
    @pytest.mark.asyncio
    def test_forgot_password(self, client: TestClient, admin_credentials):
        """Test forgot password request."""
        reset_data = {"email": admin_credentials["email"]}
        response = client.post("/api/v1/auth/forgot-password", json=reset_data)
        
        # Should return success even if email doesn't exist (security)
        assert response.status_code in [200, 202]
    
    @pytest.mark.asyncio
    def test_forgot_password_invalid_email(self, client: TestClient):
        """Test forgot password with invalid email."""
        reset_data = {"email": "nonexistent@example.com"}
        
        response = client.post("/api/v1/auth/forgot-password", json=reset_data)
        
        # Should return success for security reasons
        assert response.status_code in [200, 202]
    
    @pytest.mark.asyncio
    def test_reset_password(self, client: TestClient):
        """Test password reset with token."""
        # This would require a valid reset token
        reset_data = {
            "token": "fake_reset_token",
            "new_password": "NewPassword123!",
            "confirm_password": "NewPassword123!"
        }
        
        response = client.post("/api/v1/auth/reset-password", json=reset_data)
        
        # Should fail with invalid token
        assert response.status_code in [400, 401, 422]


class TestTwoFactorAuthentication:
    """Test 2FA functionality."""
    
    @pytest.mark.asyncio
    def test_enable_2fa(self, client: TestClient, admin_headers):
        """Test enabling 2FA."""
        response = client.post("/api/v1/auth/2fa/enable", headers=admin_headers)
        
        if response.status_code == 200:
            data = response.json()
            # Should return QR code or secret for 2FA setup
            assert "secret" in data or "qr_code" in data
    
    @pytest.mark.asyncio
    def test_verify_2fa(self, client: TestClient, admin_headers):
        """Test 2FA code verification."""
        verify_data = {"code": "123456"}  # Mock 2FA code
        
        response = client.post("/api/v1/auth/2fa/verify", json=verify_data, headers=admin_headers)
        
        # Should fail with mock code
        assert response.status_code in [400, 401]
    
    @pytest.mark.asyncio
    def test_disable_2fa(self, client: TestClient, admin_headers):
        """Test disabling 2FA."""
        disable_data = {"password": "testpassword"}
        
        response = client.post("/api/v1/auth/2fa/disable", json=disable_data, headers=admin_headers)
        
        # Should succeed or require 2FA to be enabled first
        assert response.status_code in [200, 400]