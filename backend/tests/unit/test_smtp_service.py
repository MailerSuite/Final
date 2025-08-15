"""
Unit tests for SMTP Service
Tests business logic, error handling, rate limiting, and proxy integration
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from fastapi import HTTPException

from services.smtp_service import SMTPService, RateLimiter, SMTPCheckService
from services.proxy_service import ProxyUnavailableError
from models.base import SMTPAccount, ProxyServer, Campaign


class TestRateLimiter:
    """Test rate limiter functionality"""
    
    @pytest.mark.asyncio
    async def test_rate_limiter_allows_within_limit(self):
        """Test that requests within limit are allowed"""
        limiter = RateLimiter(limit=5, interval=60.0)
        
        # Should allow 5 requests without delay
        for i in range(5):
            await limiter.acquire("test_key")
        
        # This should work without timing out
        assert True

    @pytest.mark.asyncio
    async def test_rate_limiter_blocks_over_limit(self):
        """Test that requests over limit are delayed"""
        limiter = RateLimiter(limit=2, interval=1.0)
        
        # First two requests should be immediate
        await limiter.acquire("test_key")
        await limiter.acquire("test_key")
        
        # Third request should be delayed
        start_time = asyncio.get_event_loop().time()
        await limiter.acquire("test_key")
        end_time = asyncio.get_event_loop().time()
        
        # Should have been delayed by close to the interval
        assert end_time - start_time >= 0.8  # Allow some timing variance

    @pytest.mark.asyncio
    async def test_rate_limiter_different_keys(self):
        """Test that different keys have separate limits"""
        limiter = RateLimiter(limit=1, interval=60.0)
        
        await limiter.acquire("key1")
        await limiter.acquire("key2")  # Should not be blocked
        
        assert True


class TestSMTPCheckService:
    """Test SMTP checking functionality"""
    
    @pytest.fixture
    def smtp_checker(self):
        return SMTPCheckService(ports=[25, 587, 465])

    @pytest.mark.asyncio
    async def test_smtp_check_success(self, smtp_checker):
        """Test successful SMTP authentication check"""
        results = await smtp_checker.check("smtp.gmail.com", "test@gmail.com", "good", timeout=30)
        
        assert len(results) == 3
        for result in results:
            assert result["success"] is True
            assert "port" in result
            assert "response_time" in result

    @pytest.mark.asyncio
    async def test_smtp_check_failure(self, smtp_checker):
        """Test failed SMTP authentication check"""
        results = await smtp_checker.check("smtp.gmail.com", "test@gmail.com", "bad", timeout=30)
        
        assert len(results) == 3
        for result in results:
            assert result["success"] is False
            assert result["error"] == "AUTH_FAILED"
            assert "port" in result


class TestSMTPService:
    """Test SMTP Service business logic"""
    
    @pytest.fixture
    def mock_db_session(self):
        return AsyncMock()

    @pytest.fixture
    def smtp_service(self, mock_db_session):
        with patch('services.smtp_service.ProxyService'):
            with patch('services.smtp_service.OAuthService'):
                return SMTPService(mock_db_session)

    @pytest.fixture
    def mock_smtp_account(self):
        account = Mock(spec=SMTPAccount)
        account.id = "test-account-id"
        account.email = "test@example.com"
        account.host = "smtp.example.com"
        account.port = 587
        account.use_tls = True
        account.username = "test@example.com"
        account.password = "test_password"
        account.daily_limit = 1000
        account.hourly_limit = 100
        account.is_active = True
        account.is_oauth = False
        return account

    @pytest.fixture
    def mock_proxy_server(self):
        proxy = Mock(spec=ProxyServer)
        proxy.id = "test-proxy-id"
        proxy.host = "proxy.example.com"
        proxy.port = 1080
        proxy.username = "proxy_user"
        proxy.password = "proxy_pass"
        proxy.protocol = "SOCKS5"
        proxy.is_active = True
        return proxy

    @pytest.fixture
    def mock_campaign(self):
        campaign = Mock(spec=Campaign)
        campaign.id = "test-campaign-id"
        campaign.name = "Test Campaign"
        campaign.subject = "Test Subject"
        campaign.content = "Test content"
        campaign.status = "active"
        campaign.user_id = "test-user-id"
        return campaign

    @pytest.mark.asyncio
    async def test_get_smtp_accounts_success(self, smtp_service, mock_db_session):
        """Test retrieving SMTP accounts"""
        # Mock database query
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = [
            Mock(spec=SMTPAccount, id="1", email="test1@example.com"),
            Mock(spec=SMTPAccount, id="2", email="test2@example.com")
        ]
        mock_db_session.execute.return_value = mock_result
        
        accounts = await smtp_service.get_smtp_accounts(user_id="test-user")
        
        assert len(accounts) == 2
        mock_db_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_smtp_account_success(self, smtp_service, mock_db_session):
        """Test creating SMTP account"""
        account_data = {
            "email": "test@example.com",
            "host": "smtp.example.com",
            "port": 587,
            "username": "test@example.com",
            "password": "test_password",
            "use_tls": True
        }
        
        # Mock successful creation
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()
        
        with patch('models.base.SMTPAccount') as MockSMTPAccount:
            mock_account = Mock()
            MockSMTPAccount.return_value = mock_account
            
            result = await smtp_service.create_smtp_account(
                user_id="test-user",
                **account_data
            )
            
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_with_proxy_success(self, smtp_service, mock_smtp_account, mock_proxy_server):
        """Test sending email with proxy"""
        with patch.object(smtp_service.proxy_service, 'get_proxy_for_user', return_value=mock_proxy_server):
            with patch('aiosmtplib.SMTP') as mock_smtp:
                mock_smtp_instance = AsyncMock()
                mock_smtp.return_value = mock_smtp_instance
                mock_smtp_instance.connect = AsyncMock()
                mock_smtp_instance.starttls = AsyncMock()
                mock_smtp_instance.login = AsyncMock()
                mock_smtp_instance.send_message = AsyncMock()
                mock_smtp_instance.quit = AsyncMock()
                
                result = await smtp_service.send_email(
                    smtp_account=mock_smtp_account,
                    to_email="recipient@example.com",
                    subject="Test Subject",
                    content="Test content",
                    user_id="test-user"
                )
                
                assert result["success"] is True
                mock_smtp_instance.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_email_proxy_unavailable(self, smtp_service, mock_smtp_account):
        """Test sending email when proxy is unavailable"""
        with patch.object(smtp_service.proxy_service, 'get_proxy_for_user', 
                         side_effect=ProxyUnavailableError("No proxy available")):
            
            with pytest.raises(HTTPException) as exc_info:
                await smtp_service.send_email(
                    smtp_account=mock_smtp_account,
                    to_email="recipient@example.com",
                    subject="Test Subject",
                    content="Test content",
                    user_id="test-user"
                )
            
            assert exc_info.value.status_code == 503
            assert "proxy" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_send_email_rate_limit_exceeded(self, smtp_service, mock_smtp_account):
        """Test sending email when rate limit is exceeded"""
        # Mock rate limiter to simulate exceeded limit
        with patch.object(smtp_service.account_limiter, 'acquire', 
                         side_effect=asyncio.TimeoutError("Rate limit exceeded")):
            
            with pytest.raises(HTTPException) as exc_info:
                await smtp_service.send_email(
                    smtp_account=mock_smtp_account,
                    to_email="recipient@example.com",
                    subject="Test Subject",
                    content="Test content",
                    user_id="test-user"
                )
            
            assert exc_info.value.status_code == 429

    @pytest.mark.asyncio
    async def test_send_email_smtp_authentication_failed(self, smtp_service, mock_smtp_account, mock_proxy_server):
        """Test sending email with SMTP authentication failure"""
        with patch.object(smtp_service.proxy_service, 'get_proxy_for_user', return_value=mock_proxy_server):
            with patch('aiosmtplib.SMTP') as mock_smtp:
                mock_smtp_instance = AsyncMock()
                mock_smtp.return_value = mock_smtp_instance
                mock_smtp_instance.connect = AsyncMock()
                mock_smtp_instance.starttls = AsyncMock()
                mock_smtp_instance.login = AsyncMock(side_effect=Exception("Authentication failed"))
                
                result = await smtp_service.send_email(
                    smtp_account=mock_smtp_account,
                    to_email="recipient@example.com",
                    subject="Test Subject",
                    content="Test content",
                    user_id="test-user"
                )
                
                assert result["success"] is False
                assert "error" in result

    @pytest.mark.asyncio
    async def test_validate_smtp_account_success(self, smtp_service, mock_smtp_account, mock_proxy_server):
        """Test SMTP account validation"""
        with patch.object(smtp_service.proxy_service, 'get_proxy_for_user', return_value=mock_proxy_server):
            with patch('aiosmtplib.SMTP') as mock_smtp:
                mock_smtp_instance = AsyncMock()
                mock_smtp.return_value = mock_smtp_instance
                mock_smtp_instance.connect = AsyncMock()
                mock_smtp_instance.starttls = AsyncMock()
                mock_smtp_instance.login = AsyncMock()
                mock_smtp_instance.quit = AsyncMock()
                
                result = await smtp_service.validate_smtp_account(mock_smtp_account, "test-user")
                
                assert result["valid"] is True
                mock_smtp_instance.login.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_account_statistics(self, smtp_service, mock_db_session):
        """Test getting account statistics"""
        # Mock database queries for statistics
        mock_result = AsyncMock()
        mock_result.scalar.return_value = 150  # emails sent today
        mock_db_session.execute.return_value = mock_result
        
        stats = await smtp_service.get_account_statistics(
            account_id="test-account-id",
            user_id="test-user"
        )
        
        assert "emails_sent_today" in stats
        assert "emails_sent_this_hour" in stats
        assert "success_rate" in stats
        mock_db_session.execute.assert_called()

    @pytest.mark.asyncio
    async def test_bulk_send_emails(self, smtp_service, mock_smtp_account, mock_proxy_server):
        """Test bulk email sending"""
        recipients = [
            {"email": "user1@example.com", "name": "User 1"},
            {"email": "user2@example.com", "name": "User 2"},
            {"email": "user3@example.com", "name": "User 3"}
        ]
        
        with patch.object(smtp_service.proxy_service, 'get_proxy_for_user', return_value=mock_proxy_server):
            with patch.object(smtp_service, 'send_email', return_value={"success": True}) as mock_send:
                
                results = await smtp_service.bulk_send_emails(
                    smtp_account=mock_smtp_account,
                    recipients=recipients,
                    subject="Bulk Test Subject",
                    content="Bulk test content",
                    user_id="test-user"
                )
                
                assert len(results) == 3
                assert mock_send.call_count == 3
                assert all(result["success"] for result in results)

    @pytest.mark.asyncio
    async def test_delete_smtp_account_with_campaigns(self, smtp_service, mock_db_session):
        """Test deleting SMTP account that has associated campaigns"""
        # Mock finding campaigns using this account
        mock_result = AsyncMock()
        mock_result.scalar.return_value = 2  # 2 campaigns using this account
        mock_db_session.execute.return_value = mock_result
        
        with pytest.raises(HTTPException) as exc_info:
            await smtp_service.delete_smtp_account(
                account_id="test-account-id",
                user_id="test-user"
            )
        
        assert exc_info.value.status_code == 400
        assert "campaigns" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_update_smtp_account_success(self, smtp_service, mock_db_session):
        """Test updating SMTP account"""
        # Mock finding the account
        mock_account = Mock(spec=SMTPAccount)
        mock_account.user_id = "test-user"
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_account
        mock_db_session.execute.return_value = mock_result
        
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()
        
        update_data = {
            "host": "new-smtp.example.com",
            "port": 465,
            "use_tls": True
        }
        
        result = await smtp_service.update_smtp_account(
            account_id="test-account-id",
            user_id="test-user",
            **update_data
        )
        
        assert mock_account.host == "new-smtp.example.com"
        assert mock_account.port == 465
        mock_db_session.commit.assert_called_once()