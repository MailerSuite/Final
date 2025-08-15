"""
Unit tests for Campaign Service
Tests campaign creation, management, and analytics
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from fastapi import HTTPException

from services.campaign_service import CampaignService
from models.base import Campaign, SMTPAccount, EmailTemplate, LeadBase, Session
from schemas.campaigns import CampaignCreate, CampaignResponse


class TestCampaignService:
    """Test Campaign Service business logic"""
    
    @pytest.fixture
    def mock_db_session(self):
        return AsyncMock()

    @pytest.fixture
    def campaign_service(self, mock_db_session):
        return CampaignService(mock_db_session)

    @pytest.fixture
    def mock_session(self):
        session = Mock(spec=Session)
        session.id = "session-123"
        session.user_id = "user-123"
        session.is_active = True
        return session

    @pytest.fixture
    def mock_template(self):
        template = Mock(spec=EmailTemplate)
        template.id = "template-123"
        template.name = "Test Template"
        template.content = "<html><body>Test content</body></html>"
        template.subject = "Test Subject"
        return template

    @pytest.fixture
    def mock_campaign(self):
        campaign = Mock(spec=Campaign)
        campaign.id = "campaign-123"
        campaign.name = "Test Campaign"
        campaign.subject = "Test Subject"
        campaign.sender = "test@example.com"
        campaign.status = "draft"
        campaign.created_at = datetime.now()
        return campaign

    @pytest.fixture
    def mock_lead_base(self):
        lead_base = Mock(spec=LeadBase)
        lead_base.id = "leadbase-123"
        lead_base.name = "Test Lead Base"
        return lead_base

    @pytest.mark.asyncio
    async def test_create_campaign_success(self, campaign_service, mock_db_session, mock_session, mock_template, mock_lead_base):
        """Test successful campaign creation"""
        campaign_data = CampaignCreate(
            name="Test Campaign",
            template_id="template-123",
            subject="Test Subject",
            sender="test@example.com",
            lead_base_ids=["leadbase-123"],
            batch_size=100,
            delay_between_batches=60,
            threads_count=1,
            autostart=False,
            cc=[],
            bcc=[]
        )
        
        # Mock successful lookups
        async def mock_scalar(query):
            query_str = str(query)
            if "sessions" in query_str.lower():
                return mock_session
            elif "templates" in query_str.lower():
                return mock_template
            else:
                return mock_lead_base
        
        mock_db_session.scalar = AsyncMock(side_effect=mock_scalar)
        mock_db_session.scalars = AsyncMock()
        mock_db_session.scalars.return_value.all.return_value = [mock_lead_base]
        mock_db_session.add = Mock()
        mock_db_session.commit = AsyncMock()
        mock_db_session.refresh = AsyncMock()
        
        with patch('models.base.Campaign') as MockCampaign:
            mock_campaign = Mock()
            mock_campaign.id = "campaign-123"
            MockCampaign.return_value = mock_campaign
            
            result = await campaign_service.create_campaign(
                campaign_data=campaign_data,
                session_id="session-123"
            )
            
            mock_db_session.add.assert_called_once()
            mock_db_session.commit.assert_called_once()
            assert isinstance(result, CampaignResponse)

    @pytest.mark.asyncio
    async def test_create_campaign_missing_template(self, campaign_service, mock_db_session, mock_session):
        """Test campaign creation with missing template"""
        campaign_data = CampaignCreate(
            name="Test Campaign",
            template_id="nonexistent-template",
            subject="Test Subject",
            sender="test@example.com",
            lead_base_ids=["leadbase-123"],
            batch_size=100,
            delay_between_batches=60,
            threads_count=1,
            autostart=False,
            cc=[],
            bcc=[]
        )
        
        # Mock session found but template not found
        async def mock_scalar(query):
            query_str = str(query)
            if "sessions" in query_str.lower():
                return mock_session
            else:
                return None
        
        mock_db_session.scalar = AsyncMock(side_effect=mock_scalar)
        
        with pytest.raises(ValueError, match="Template not found"):
            await campaign_service.create_campaign(
                campaign_data=campaign_data,
                session_id="session-123"
            )

    @pytest.mark.asyncio
    async def test_get_campaigns(self, campaign_service, mock_db_session, mock_session):
        """Test retrieving campaigns"""
        mock_campaigns = [
            Mock(spec=Campaign, id="1", name="Campaign 1"),
            Mock(spec=Campaign, id="2", name="Campaign 2")
        ]
        
        mock_db_session.scalar = AsyncMock(return_value=mock_session)
        mock_db_session.scalars = AsyncMock()
        mock_db_session.scalars.return_value.all.return_value = mock_campaigns
        
        result = await campaign_service.get_campaigns(
            session_id="session-123",
            skip=0,
            limit=10
        )
        
        assert len(result.campaigns) == 2
        mock_db_session.scalar.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_campaign_by_id(self, campaign_service, mock_db_session, mock_campaign):
        """Test retrieving campaign by ID"""
        mock_db_session.scalar = AsyncMock(return_value=mock_campaign)
        
        result = await campaign_service.get_campaign(
            campaign_id="campaign-123",
            session_id="session-123"
        )
        
        assert isinstance(result, CampaignResponse)
        assert result.id == "campaign-123"

    @pytest.mark.asyncio
    async def test_start_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test starting a campaign"""
        mock_campaign.status = "draft"
        mock_db_session.scalar = AsyncMock(return_value=mock_campaign)
        mock_db_session.commit = AsyncMock()
        
        with patch.object(campaign_service, '_execute_campaign', return_value=None) as mock_execute:
            result = await campaign_service.start_campaign(
                campaign_id="campaign-123",
                session_id="session-123"
            )
            
            assert result["status"] == "success"
            mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_pause_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test pausing a campaign"""
        mock_campaign.status = "running"
        mock_db_session.scalar = AsyncMock(return_value=mock_campaign)
        mock_db_session.commit = AsyncMock()
        
        result = await campaign_service.pause_campaign(
            campaign_id="campaign-123",
            session_id="session-123"
        )
        
        assert result["status"] == "success"
        assert mock_campaign.status == "paused"
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test stopping a campaign"""
        mock_campaign.status = "running"
        mock_db_session.scalar = AsyncMock(return_value=mock_campaign)
        mock_db_session.commit = AsyncMock()
        
        result = await campaign_service.stop_campaign(
            campaign_id="campaign-123",
            session_id="session-123"
        )
        
        assert result["status"] == "success"
        assert mock_campaign.status == "stopped"
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_campaign_success(self, campaign_service, mock_db_session, mock_campaign):
        """Test deleting a campaign"""
        mock_campaign.status = "draft"
        mock_db_session.scalar = AsyncMock(return_value=mock_campaign)
        mock_db_session.delete = Mock()
        mock_db_session.commit = AsyncMock()
        
        result = await campaign_service.delete_campaign(
            campaign_id="campaign-123",
            session_id="session-123"
        )
        
        assert result["message"] == "Campaign deleted successfully"
        mock_db_session.delete.assert_called_once()
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_campaign_progress(self, campaign_service, mock_db_session, mock_campaign):
        """Test getting campaign progress"""
        mock_campaign.status = "running"
        mock_db_session.scalar = AsyncMock(return_value=mock_campaign)
        
        # Mock campaign stats
        with patch.object(campaign_service, '_update_campaign_stats', return_value=None):
            result = await campaign_service.get_campaign_progress(
                campaign_id="campaign-123",
                session_id="session-123"
            )
            
            assert result.campaign_id == "campaign-123"

    @pytest.mark.asyncio
    async def test_get_campaign_resources(self, campaign_service, mock_db_session, mock_session):
        """Test getting campaign resources"""
        mock_db_session.scalar = AsyncMock(return_value=mock_session)
        mock_db_session.scalars = AsyncMock()
        
        # Mock empty results for all resources
        empty_result = AsyncMock()
        empty_result.all.return_value = []
        mock_db_session.scalars.return_value = empty_result
        
        result = await campaign_service.get_campaign_resources(
            campaign_id="campaign-123",
            session_id="session-123"
        )
        
        assert "templates" in result
        assert "smtp_accounts" in result
        assert "domains" in result
        assert "lead_bases" in result

    @pytest.mark.asyncio
    async def test_run_mock_test(self, campaign_service, mock_db_session, mock_campaign):
        """Test running mock campaign test"""
        mock_campaign.status = "draft"
        mock_db_session.scalar = AsyncMock(return_value=mock_campaign)
        
        with patch.object(campaign_service, '_validate_campaign_resources', return_value=None):
            result = await campaign_service.run_mock_test("campaign-123")
            
            assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_campaign_summary(self, campaign_service, mock_db_session):
        """Test getting campaign summary"""
        mock_db_session.scalars = AsyncMock()
        empty_result = AsyncMock()
        empty_result.all.return_value = []
        mock_db_session.scalars.return_value = empty_result
        
        result = await campaign_service.get_campaign_summary(
            session_id="session-123",
            db=mock_db_session
        )
        
        assert result.total_campaigns == 0
        assert result.active_campaigns == 0

    @pytest.mark.asyncio
    async def test_get_campaign_options(self, campaign_service, mock_db_session):
        """Test getting campaign options"""
        mock_db_session.scalars = AsyncMock()
        empty_result = AsyncMock()
        empty_result.all.return_value = []
        mock_db_session.scalars.return_value = empty_result
        
        result = await campaign_service.get_campaign_options()
        
        assert hasattr(result, 'templates')
        assert hasattr(result, 'smtp_accounts')
        assert hasattr(result, 'domains')

    @pytest.mark.asyncio
    async def test_personalize_email(self, campaign_service):
        """Test email personalization"""
        mock_template = Mock()
        mock_template.subject = "Hello {{name}}"
        mock_template.content = "Dear {{name}}, welcome to {{company}}"
        
        mock_lead = Mock()
        mock_lead.first_name = "John"
        mock_lead.last_name = "Doe"
        mock_lead.email = "john@example.com"
        mock_lead.company = "Test Corp"
        
        result = campaign_service._personalize_email(mock_template, mock_lead)
        
        assert "John" in result["subject"]
        assert "John" in result["content"]
        assert "Test Corp" in result["content"]

    @pytest.mark.asyncio
    async def test_count_recipients(self, campaign_service, mock_db_session):
        """Test counting campaign recipients"""
        mock_db_session.scalar = AsyncMock(return_value=100)
        
        result = await campaign_service._count_recipients(
            lead_base_ids=["leadbase-123"],
            session_id="session-123"
        )
        
        assert result == 100

    @pytest.mark.asyncio
    async def test_update_campaign_stats(self, campaign_service, mock_db_session, mock_campaign):
        """Test updating campaign statistics"""
        mock_db_session.scalar = AsyncMock(return_value=mock_campaign)
        mock_db_session.commit = AsyncMock()
        
        await campaign_service._update_campaign_stats("campaign-123", "email_sent")
        
        mock_db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_campaign_leads(self, campaign_service, mock_db_session):
        """Test getting campaign leads"""
        mock_leads = [
            Mock(id="lead-1", email="user1@example.com"),
            Mock(id="lead-2", email="user2@example.com")
        ]
        
        mock_db_session.scalars = AsyncMock()
        mock_db_session.scalars.return_value.all.return_value = mock_leads
        
        result = await campaign_service._get_campaign_leads(
            campaign_id="campaign-123",
            session_id="session-123"
        )
        
        assert len(result) == 2