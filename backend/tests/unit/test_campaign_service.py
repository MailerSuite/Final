"""
Unit tests for Campaign Service
Tests campaign creation, management, scheduling, and analytics
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from fastapi import HTTPException

from services.campaign_service import CampaignService
from models.base import Campaign, SMTPAccount, User
from models.email_lists import EmailList
from schemas.campaigns import CampaignCreate, CampaignUpdate


class TestCampaignService:
    """Test Campaign Service business logic"""
    
    @pytest.fixture
    def mock_db_session(self):
        return AsyncMock()

    @pytest.fixture
    def campaign_service(self, mock_db_session):
        return CampaignService(mock_db_session)

    @pytest.fixture
    def mock_user(self):
        user = Mock(spec=User)
        user.id = "550e8400-e29b-41d4-a716-446655440010"
        user.email = "sarah.martinez@ecommerce-platform.com"
        user.username = "sarah_marketing"
        user.full_name = "Sarah Martinez"
        user.company = "E-Commerce Platform Inc."
        user.plan_type = "enterprise"
        user.is_active = True
        user.created_at = datetime.utcnow() - timedelta(days=180)
        user.last_login = datetime.utcnow() - timedelta(hours=2)
        user.campaigns_sent = 47
        user.total_emails_sent = 125000
        return user

    @pytest.fixture
    def mock_campaign(self):
        campaign = Mock(spec=Campaign)
        campaign.id = "550e8400-e29b-41d4-a716-446655440000"
        campaign.name = "Holiday Flash Sale 2025"
        campaign.subject = "🎄 24-Hour Flash Sale: 60% Off Everything!"
        campaign.sender = "promotions@retailstore.com"
        campaign.content = "<html><head><title>Holiday Sale</title></head><body><h1>60% OFF Everything!</h1><p>One day only! Don't miss out on our biggest sale of the year.</p></body></html>"
        campaign.status = "draft"
        campaign.session_id = "test-session-123"
        campaign.template_id = "550e8400-e29b-41d4-a716-446655440001"
        campaign.created_at = datetime.utcnow()
        campaign.scheduled_at = None
        campaign.batch_size = 250
        campaign.delay_between_batches = 45
        campaign.threads_count = 10
        campaign.autostart = False
        return campaign

    @pytest.fixture
    def mock_smtp_account(self):
        account = Mock(spec=SMTPAccount)
        account.id = "test-smtp-id"
        account.email = "test@example.com"
        account.is_active = True
        account.daily_limit = 1000
        account.hourly_limit = 100
        return account

    @pytest.fixture
    def mock_email_list(self):
        email_list = Mock(spec=EmailList)
        email_list.id = "test-list-id"
        email_list.name = "Test List"
        email_list.contact_count = 500
        email_list.is_active = True
        return email_list

    @pytest.mark.asyncio
    async def test_create_campaign_success(self, campaign_service, mock_db_session, mock_user):
        """Test successful campaign creation"""
        campaign_data = CampaignCreate(
            name="Black Friday Mega Sale 2025",
            template_id="550e8400-e29b-41d4-a716-446655440000",
            subject="🔥 75% OFF Everything - Limited Time Only!",
            sender="sales@ecommerce-store.com",
            lead_base_ids=["550e8400-e29b-41d4-a716-446655440001"],
            batch_size=200,
            delay_between_batches=30,
            threads_count=8,
            autostart=False,
            retry_limit=5
        )
        
        # Mock database operations
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()
        
        # Mock the session and template queries
        mock_session = Mock()
        mock_session.id = "test-session-123"
        mock_session.user_id = "550e8400-e29b-41d4-a716-446655440010"
        
        mock_template = Mock()
        mock_template.id = "550e8400-e29b-41d4-a716-446655440000"
        mock_template.name = "Black Friday Template"
        mock_template.content = "<html><body>Black Friday Sale!</body></html>"
        mock_template.user_id = "550e8400-e29b-41d4-a716-446655440010"
        
        # Mock database scalar to return different results for session and template queries
        async def mock_scalar(query):
            query_str = str(query)
            if "sessions" in query_str.lower():
                return mock_session
            else:
                return mock_template
        
        mock_db_session.scalar = AsyncMock(side_effect=mock_scalar)
        
        with patch('models.base.Campaign') as MockCampaign:
            mock_campaign = Mock()
            mock_campaign.id = "550e8400-e29b-41d4-a716-446655440555"
            MockCampaign.return_value = mock_campaign
            
            result = await campaign_service.create_campaign(
                campaign_data=campaign_data,
                session_id="test-session-123"
            )
            
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()
            assert result.id == "550e8400-e29b-41d4-a716-446655440555"

    @pytest.mark.asyncio
    async def test_create_campaign_invalid_smtp_account(self, campaign_service, mock_db_session):
        """Test campaign creation with invalid SMTP account"""
        campaign_data = CampaignCreate(
            name="Failed Test Campaign 2025",
            template_id="550e8400-e29b-41d4-a716-446655440099",
            subject="❌ This Should Fail - Invalid Configuration",
            sender="invalid@nonexistent-domain.com",
            lead_base_ids=["550e8400-e29b-41d4-a716-446655440002"],
            batch_size=50,
            delay_between_batches=120,
            threads_count=3,
            autostart=False
        )
        
        # Mock SMTP account not found
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db_session.execute.return_value = mock_result
        
        with pytest.raises(HTTPException) as exc_info:
            await campaign_service.create_campaign(
                campaign_data=campaign_data,
                user_id="test-user-id"
            )
        
        assert exc_info.value.status_code == 404
        assert "smtp" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_get_campaigns_with_pagination(self, campaign_service, mock_db_session):
        """Test retrieving campaigns with pagination"""
        # Mock paginated results
        mock_campaigns = [
            Mock(spec=Campaign, id="1", name="Campaign 1"),
            Mock(spec=Campaign, id="2", name="Campaign 2"),
            Mock(spec=Campaign, id="3", name="Campaign 3")
        ]
        
        mock_result = AsyncMock()
        mock_result.scalars.return_value.all.return_value = mock_campaigns
        mock_db_session.execute.return_value = mock_result
        
        # Mock count query
        mock_count_result = AsyncMock()
        mock_count_result.scalar.return_value = 10
        
        with patch.object(mock_db_session, 'execute', side_effect=[mock_result, mock_count_result]):
            result = await campaign_service.get_campaigns(
                user_id="test-user-id",
                page=1,
                per_page=3
            )
            
            assert len(result["campaigns"]) == 3
            assert result["total"] == 10
            assert result["page"] == 1
            assert result["per_page"] == 3

    @pytest.mark.asyncio
    async def test_start_campaign_success(self, campaign_service, mock_db_session, mock_campaign, mock_smtp_account, mock_email_list):
        """Test starting a campaign"""
        mock_campaign.status = "draft"
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        
        # Mock SMTP account and email list validation
        with patch.object(campaign_service, '_validate_smtp_account', return_value=mock_smtp_account):
            with patch.object(campaign_service, '_validate_email_list', return_value=mock_email_list):
                with patch.object(campaign_service, '_start_campaign_task') as mock_start_task:
                    mock_db_session.commit = AsyncMock()
                    
                    result = await campaign_service.start_campaign(
                        campaign_id="test-campaign-id",
                        user_id="test-user-id"
                    )
                    
                    assert mock_campaign.status == "running"
                    mock_start_task.assert_called_once()
                    mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_start_campaign_already_running(self, campaign_service, mock_db_session, mock_campaign):
        """Test starting a campaign that's already running"""
        mock_campaign.status = "running"
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        
        with pytest.raises(HTTPException) as exc_info:
            await campaign_service.start_campaign(
                campaign_id="test-campaign-id",
                user_id="test-user-id"
            )
        
        assert exc_info.value.status_code == 400
        assert "already" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_pause_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test pausing a running campaign"""
        mock_campaign.status = "running"
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        mock_db_session.commit = AsyncMock()
        
        result = await campaign_service.pause_campaign(
            campaign_id="test-campaign-id",
            user_id="test-user-id"
        )
        
        assert mock_campaign.status == "paused"
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test stopping a campaign"""
        mock_campaign.status = "running"
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        mock_db_session.commit = AsyncMock()
        
        with patch.object(campaign_service, '_stop_campaign_task') as mock_stop_task:
            result = await campaign_service.stop_campaign(
                campaign_id="test-campaign-id",
                user_id="test-user-id"
            )
            
            assert mock_campaign.status == "stopped"
            mock_stop_task.assert_called_once()
            mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test updating campaign details"""
        mock_campaign.status = "draft"
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()
        
        update_data = CampaignUpdate(
            name="Updated Campaign",
            subject="Updated Subject",
            content="Updated content"
        )
        
        result = await campaign_service.update_campaign(
            campaign_id="test-campaign-id",
            user_id="test-user-id",
            campaign_data=update_data
        )
        
        assert mock_campaign.name == "Updated Campaign"
        assert mock_campaign.subject == "Updated Subject"
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_running_campaign_fails(self, campaign_service, mock_db_session, mock_campaign):
        """Test that updating a running campaign fails"""
        mock_campaign.status = "running"
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        
        update_data = CampaignUpdate(name="Updated Campaign")
        
        with pytest.raises(HTTPException) as exc_info:
            await campaign_service.update_campaign(
                campaign_id="test-campaign-id",
                user_id="test-user-id",
                campaign_data=update_data
            )
        
        assert exc_info.value.status_code == 400
        assert "running" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_delete_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test deleting a campaign"""
        mock_campaign.status = "draft"
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        mock_db_session.delete = AsyncMock()
        mock_db_session.commit = AsyncMock()
        
        result = await campaign_service.delete_campaign(
            campaign_id="test-campaign-id",
            user_id="test-user-id"
        )
        
        mock_db_session.delete.assert_called_once_with(mock_campaign)
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_running_campaign_fails(self, campaign_service, mock_db_session, mock_campaign):
        """Test that deleting a running campaign fails"""
        mock_campaign.status = "running"
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        
        with pytest.raises(HTTPException) as exc_info:
            await campaign_service.delete_campaign(
                campaign_id="test-campaign-id",
                user_id="test-user-id"
            )
        
        assert exc_info.value.status_code == 400
        assert "running" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_schedule_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test scheduling a campaign"""
        mock_campaign.status = "draft"
        scheduled_time = datetime.utcnow() + timedelta(hours=1)
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        mock_db_session.commit = AsyncMock()
        
        with patch.object(campaign_service, '_schedule_campaign_task') as mock_schedule:
            result = await campaign_service.schedule_campaign(
                campaign_id="test-campaign-id",
                user_id="test-user-id",
                scheduled_at=scheduled_time
            )
            
            assert mock_campaign.status == "scheduled"
            assert mock_campaign.scheduled_at == scheduled_time
            mock_schedule.assert_called_once()
            mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_schedule_campaign_past_time_fails(self, campaign_service, mock_db_session, mock_campaign):
        """Test scheduling a campaign for past time fails"""
        mock_campaign.status = "draft"
        past_time = datetime.utcnow() - timedelta(hours=1)
        
        # Mock finding campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        
        with pytest.raises(HTTPException) as exc_info:
            await campaign_service.schedule_campaign(
                campaign_id="test-campaign-id",
                user_id="test-user-id",
                scheduled_at=past_time
            )
        
        assert exc_info.value.status_code == 400
        assert "past" in str(exc_info.value.detail).lower()

    @pytest.mark.asyncio
    async def test_get_campaign_analytics(self, campaign_service, mock_db_session):
        """Test getting campaign analytics"""
        # Mock analytics data
        mock_analytics = {
            "emails_sent": 1000,
            "emails_delivered": 950,
            "emails_opened": 300,
            "emails_clicked": 50,
            "bounces": 20,
            "unsubscribes": 5
        }
        
        with patch.object(campaign_service, '_calculate_campaign_metrics', return_value=mock_analytics):
            result = await campaign_service.get_campaign_analytics(
                campaign_id="test-campaign-id",
                user_id="test-user-id"
            )
            
            assert result["emails_sent"] == 1000
            assert result["delivery_rate"] == 0.95  # 950/1000
            assert result["open_rate"] == 0.316  # 300/950 (delivered)
            assert result["click_rate"] == 0.167  # 50/300 (opened)

    @pytest.mark.asyncio
    async def test_clone_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test cloning a campaign"""
        # Mock finding original campaign
        mock_result = AsyncMock()
        mock_result.scalar_one_or_none.return_value = mock_campaign
        mock_db_session.execute.return_value = mock_result
        
        # Mock creating new campaign
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()
        
        with patch('models.base.Campaign') as MockCampaign:
            mock_new_campaign = Mock()
            mock_new_campaign.id = "cloned-campaign-id"
            mock_new_campaign.name = "Test Campaign (Copy)"
            MockCampaign.return_value = mock_new_campaign
            
            result = await campaign_service.clone_campaign(
                campaign_id="test-campaign-id",
                user_id="test-user-id",
                new_name="Test Campaign (Copy)"
            )
            
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()
            assert result.id == "cloned-campaign-id"

    @pytest.mark.asyncio
    async def test_get_campaign_recipients(self, campaign_service, mock_db_session):
        """Test getting campaign recipients"""
        # Mock recipients data
        mock_recipients = [
            {"email": "user1@example.com", "status": "sent", "sent_at": datetime.utcnow()},
            {"email": "user2@example.com", "status": "delivered", "delivered_at": datetime.utcnow()},
            {"email": "user3@example.com", "status": "opened", "opened_at": datetime.utcnow()}
        ]
        
        mock_result = AsyncMock()
        mock_result.all.return_value = mock_recipients
        mock_db_session.execute.return_value = mock_result
        
        result = await campaign_service.get_campaign_recipients(
            campaign_id="test-campaign-id",
            user_id="test-user-id",
            page=1,
            per_page=10
        )
        
        assert len(result["recipients"]) == 3
        assert result["recipients"][0]["email"] == "user1@example.com"

    @pytest.mark.asyncio
    async def test_validate_campaign_limits(self, campaign_service, mock_db_session, mock_user):
        """Test campaign limits validation"""
        # Mock user has reached campaign limit
        mock_result = AsyncMock()
        mock_result.scalar.return_value = 10  # User has 10 campaigns
        mock_db_session.execute.return_value = mock_result
        
        # Mock plan limits
        with patch.object(campaign_service, '_get_plan_limits', return_value={"max_campaigns": 5}):
            with pytest.raises(HTTPException) as exc_info:
                await campaign_service._validate_campaign_limits("test-user-id")
            
            assert exc_info.value.status_code == 400
            assert "limit" in str(exc_info.value.detail).lower()