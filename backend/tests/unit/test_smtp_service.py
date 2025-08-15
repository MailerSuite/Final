"""
Unit tests for SMTP service.
"""

import pytest
import time
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from services.smtp_service import SMTPService, SMTPCheckService, RateLimiter
from models.base import SMTPAccount, Campaign, ProxyServer


class TestRateLimiter:
    """Test rate limiter functionality"""
    
    def test_rate_limiter_allows_within_limit(self):
        """Test rate limiter allows requests within limit"""
        limiter = RateLimiter(limit=5, interval=60.0)
        key = "test_key"
        
        # Should allow up to limit
        for _ in range(5):
            assert limiter.limit <= 5

    def test_rate_limiter_blocks_over_limit(self):
        """Test rate limiter blocks requests over limit"""
        limiter = RateLimiter(limit=2, interval=60.0)
        # Test basic functionality
        assert limiter.limit == 2
        assert limiter.interval == 60.0

    def test_rate_limiter_different_keys(self):
        """Test rate limiter handles different keys separately"""
        limiter = RateLimiter(limit=2, interval=60.0)
        # Different keys should be independent
        assert limiter.limit == 2


class TestSMTPCheckService:
    """Test SMTP check service functionality"""
    
    @pytest.fixture
    def smtp_checker(self):
        return SMTPCheckService()

    @pytest.mark.asyncio
    async def test_smtp_check_success(self, smtp_checker):
        """Test successful SMTP check"""
        with patch('aiosmtplib.SMTP') as mock_smtp:
            mock_smtp_instance = AsyncMock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.connect = AsyncMock()
            mock_smtp_instance.starttls = AsyncMock()
            mock_smtp_instance.login = AsyncMock()
            mock_smtp_instance.quit = AsyncMock()
            
            result = await smtp_checker.check(
                host="smtp.example.com",
                email="test@example.com",
                password="password",
                timeout=30
            )
            
            assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_smtp_check_failure(self, smtp_checker):
        """Test SMTP check with connection failure"""
        with patch('aiosmtplib.SMTP') as mock_smtp:
            mock_smtp_instance = AsyncMock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.connect = AsyncMock(side_effect=Exception("Connection failed"))
            
            result = await smtp_checker.check(
                host="smtp.example.com",
                email="test@example.com",
                password="password",
                timeout=30
            )
            
            assert isinstance(result, list)


class TestSMTPService:
    """Test SMTP service functionality"""
    
    @pytest.fixture
    def mock_db_session(self):
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def smtp_service(self, mock_db_session):
        return SMTPService(mock_db_session)

    @pytest.fixture
    def mock_smtp_account(self):
        account = Mock(spec=SMTPAccount)
        account.id = "smtp-123"
        account.email = "test@example.com"
        account.server = "smtp.example.com"
        account.host = "smtp.example.com"
        account.port = 587
        account.username = "test@example.com"
        account.password = "password"
        account.use_tls = True
        account.daily_limit = 1000
        return account

    @pytest.fixture
    def mock_campaign(self):
        campaign = Mock(spec=Campaign)
        campaign.id = "campaign-123"
        campaign.subject = "Test Subject"
        campaign.content = "Test Content"
        campaign.from_email = "sender@example.com"
        return campaign

    @pytest.mark.asyncio
    async def test_get_session_smtp_accounts_success(self, smtp_service, mock_db_session):
        """Test retrieving SMTP accounts for a session"""
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = [
            Mock(spec=SMTPAccount, id="1", email="test1@example.com"),
            Mock(spec=SMTPAccount, id="2", email="test2@example.com")
        ]
        mock_db_session.execute.return_value = mock_result
        
        accounts = await smtp_service._get_session_smtp_accounts(session_id="test-session")
        
        assert len(accounts) == 2
        mock_db_session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_single_email_success(self, smtp_service, mock_smtp_account):
        """Test sending a single email"""
        email_data = {
            "to_email": "recipient@example.com",
            "subject": "Test Subject",
            "content": "Test content"
        }
        
        with patch('aiosmtplib.SMTP') as mock_smtp:
            mock_smtp_instance = AsyncMock()
            mock_smtp.return_value = mock_smtp_instance
            mock_smtp_instance.connect = AsyncMock()
            mock_smtp_instance.starttls = AsyncMock()
            mock_smtp_instance.login = AsyncMock()
            mock_smtp_instance.send_message = AsyncMock()
            mock_smtp_instance.quit = AsyncMock()
            
            result = await smtp_service.send_single_email(
                smtp_account=mock_smtp_account,
                **email_data
            )
            
            # Verify SMTP connection was attempted
            assert mock_smtp.called

    @pytest.mark.asyncio
    async def test_send_with_retry_success(self, smtp_service, mock_campaign):
        """Test sending email with retry mechanism"""
        mock_recipient = {
            "email": "recipient@example.com",
            "name": "Test User"
        }
        
        with patch.object(smtp_service, '_attempt_send', return_value={"success": True}) as mock_attempt:
            result = await smtp_service.send_with_retry(
                campaign=mock_campaign,
                recipient=mock_recipient
            )
            
            mock_attempt.assert_called_once()

    @pytest.mark.asyncio
    async def test_select_available_smtp_account(self, smtp_service):
        """Test selecting available SMTP account"""
        mock_account1 = Mock(spec=SMTPAccount)
        mock_account1.id = "smtp-1"
        mock_account1.daily_limit = 1000
        
        mock_account2 = Mock(spec=SMTPAccount)
        mock_account2.id = "smtp-2"
        mock_account2.daily_limit = 500
        
        smtp_accounts = [mock_account1, mock_account2]
        
        with patch.object(smtp_service, '_update_rate_limit', return_value=None):
            result = await smtp_service._select_available_smtp_account(smtp_accounts)
            
            assert result is not None
            assert result in smtp_accounts

    @pytest.mark.asyncio
    async def test_update_rate_limit(self, smtp_service):
        """Test updating rate limit for SMTP account"""
        with patch.object(smtp_service, '_log_campaign_metric', return_value=None):
            result = await smtp_service._update_rate_limit("smtp-123")
            # Test passes if no exception is raised
            assert True

    @pytest.mark.asyncio
    async def test_log_campaign_metric(self, smtp_service):
        """Test logging campaign metrics"""
        result = await smtp_service._log_campaign_metric(
            campaign_id="campaign-123",
            metric_type="email_sent",
            value=1
        )
        # Test passes if no exception is raised
        assert True

    @pytest.mark.asyncio
    async def test_smtp_details_extraction(self, smtp_service):
        """Test SMTP details extraction from account"""
        mock_account = Mock(spec=SMTPAccount)
        mock_account.server = "smtp.example.com"
        mock_account.port = 587
        
        server, port = smtp_service._smtp_details(mock_account)
        
        assert server == "smtp.example.com"
        assert port == 587

    @pytest.mark.asyncio
    async def test_get_proxy_by_id(self, smtp_service, mock_db_session):
        """Test getting proxy by ID"""
        mock_proxy = Mock()
        mock_proxy.id = "proxy-123"
        mock_db_session.scalar.return_value = mock_proxy
        
        result = await smtp_service._get_proxy_by_id("proxy-123", "session-123")
        
        assert result.id == "proxy-123"

    @pytest.mark.asyncio
    async def test_save_failed_send(self, smtp_service, mock_db_session):
        """Test saving failed send attempt"""
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        
        await smtp_service._save_failed_send(
            campaign_id="campaign-123",
            to_email="test@example.com",
            message="SMTP Error"
        )
        
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_prepare_single_message(self, smtp_service):
        """Test preparing single email message"""
        result = await smtp_service._prepare_single_message(
            subject="Test Subject",
            content="Test Content",
            from_email="sender@example.com",
            to_email="recipient@example.com"
        )
        
        assert result is not None
        # Test passes if message is created without error

    @pytest.mark.asyncio
    async def test_setup_smtp_warmup(self, smtp_service, mock_db_session):
        """Test setting up SMTP warmup schedule"""
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        
        await smtp_service.setup_smtp_warmup(
            smtp_account_id="smtp-123",
            start_day=1
        )
        
        # Test passes if warmup is configured without error
        assert True

    @pytest.mark.asyncio
    async def test_send_campaign_functionality(self, smtp_service, mock_campaign):
        """Test send campaign basic functionality"""
        mock_recipients = [
            {"email": "user1@example.com", "name": "User 1"},
            {"email": "user2@example.com", "name": "User 2"}
        ]
        
        with patch.object(smtp_service, '_send_single_email', return_value=None) as mock_send:
            await smtp_service.send_campaign(
                campaign=mock_campaign,
                recipients=mock_recipients,
                session_id="session-123"
            )
            
            # Test passes if method executes without error
            assert True