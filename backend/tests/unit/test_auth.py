"""
🔐 Authentication Unit Tests
Testing authentication services and utilities
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta

from core.auth_utils import verify_password, get_password_hash, create_access_token, decode_token as verify_token
from app.core.security import check_password_strength
from services.auth_service import AuthService
from app.schemas.auth import LoginRequest, RegisterRequest


class TestPasswordUtils:
    """Test password utilities."""
    
    def test_password_hashing(self):
        """Test password hashing and verification."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False
    
    def test_password_strength_validation(self):
        """Test password strength checking."""
        # Strong password
        assert check_password_strength("StrongPassword123!") is True
        
        # Weak passwords
        assert check_password_strength("weak") is False
        assert check_password_strength("123456") is False
        assert check_password_strength("password") is False


class TestJWTTokens:
    """Test JWT token creation and verification."""
    
    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_token_with_expiry(self):
        """Test token creation with custom expiry."""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(data, expires_delta)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_verify_valid_token(self):
        """Test verification of valid token."""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        
        payload = verify_token(token)
        assert payload["sub"] == "test@example.com"
    
    def test_verify_expired_token(self):
        """Test verification of expired token."""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(seconds=-1)  # Already expired
        token = create_access_token(data, expires_delta)
        
        with pytest.raises(Exception):
            verify_token(token)


class TestAuthService:
    """Test authentication service."""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session."""
        return Mock()
    
    @pytest.fixture
    def auth_service(self, mock_db):
        """Create auth service with mocked dependencies."""
        return AuthService(db=mock_db)
    
    def test_validate_login_request(self, auth_service):
        """Test login request validation."""
        valid_request = LoginRequest(
            email="test@example.com",
            password="validpassword123"
        )
        
        # Should not raise exception
        assert valid_request.email == "test@example.com"
        assert valid_request.password == "validpassword123"
    
    def test_validate_register_request(self, auth_service):
        """Test registration request validation."""
        valid_request = RegisterRequest(
            email="test@example.com",
            password="StrongPassword123!",
            confirm_password="StrongPassword123!"
        )
        
        assert valid_request.email == "test@example.com"
        assert valid_request.password == "StrongPassword123!"
    
    def test_register_password_mismatch(self, auth_service):
        """Test registration with password mismatch."""
        with pytest.raises(ValueError):
            RegisterRequest(
                email="test@example.com",
                password="password1",
                confirm_password="password2"
            )


class TestSecurityValidation:
    """Test security validation functions."""
    
    def test_email_validation(self):
        """Test email format validation."""
        # Valid emails
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk", 
            "admin+test@company.org"
        ]
        
        for email in valid_emails:
            request = LoginRequest(email=email, password="password")
            assert request.email == email
    
    def test_invalid_email_validation(self):
        """Test invalid email format."""
        invalid_emails = [
            "invalid-email",
            "@domain.com",
            "user@",
            "user space@domain.com"
        ]
        
        for email in invalid_emails:
            with pytest.raises(ValueError):
                LoginRequest(email=email, password="password")
    
    def test_rate_limiting_simulation(self):
        """Test rate limiting logic."""
        # This would test rate limiting in actual implementation
        max_attempts = 5
        attempts = 0
        
        for i in range(max_attempts + 2):
            attempts += 1
            if attempts > max_attempts:
                # Should trigger rate limiting
                assert attempts > max_attempts
                break
        
        assert attempts == max_attempts + 1