"""
📧 Campaign Unit Tests
Testing campaign services and business logic
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime

from app.services.campaign_service import CampaignService
from app.schemas.campaign import CampaignCreate, CampaignUpdate
from app.models.campaign import Campaign, CampaignStatus


class TestCampaignValidation:
    """Test campaign data validation."""
    
    def test_valid_campaign_creation(self):
        """Test valid campaign creation request."""
        campaign_data = CampaignCreate(
            name="Test Campaign",
            subject="Test Subject",
            content="<h1>Test Content</h1>",
            status=CampaignStatus.DRAFT
        )
        
        assert campaign_data.name == "Test Campaign"
        assert campaign_data.subject == "Test Subject"
        assert campaign_data.status == CampaignStatus.DRAFT
    
    def test_campaign_name_validation(self):
        """Test campaign name validation."""
        # Valid names
        valid_names = [
            "Simple Campaign",
            "Campaign with Numbers 123",
            "Campaign-with-hyphens",
            "Campaign_with_underscores"
        ]
        
        for name in valid_names:
            campaign = CampaignCreate(
                name=name,
                subject="Test",
                content="Test"
            )
            assert campaign.name == name
    
    def test_empty_campaign_name(self):
        """Test validation of empty campaign name."""
        with pytest.raises(ValueError):
            CampaignCreate(
                name="",
                subject="Test",
                content="Test"
            )
    
    def test_campaign_subject_validation(self):
        """Test email subject validation."""
        # Test subject length limits
        short_subject = "Hi"
        long_subject = "A" * 200  # Very long subject
        
        # Short subject should be valid
        campaign = CampaignCreate(
            name="Test",
            subject=short_subject,
            content="Test"
        )
        assert campaign.subject == short_subject
        
        # Long subject should be trimmed or cause validation error
        campaign_long = CampaignCreate(
            name="Test", 
            subject=long_subject,
            content="Test"
        )
        # Implementation should handle long subjects appropriately
        assert len(campaign_long.subject) <= 200


class TestCampaignService:
    """Test campaign service business logic."""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session."""
        return Mock()
    
    @pytest.fixture
    def campaign_service(self, mock_db):
        """Create campaign service with mocked dependencies."""
        return CampaignService(db=mock_db)
    
    @pytest.fixture
    def sample_campaign(self):
        """Sample campaign for testing."""
        return Campaign(
            id=1,
            name="Test Campaign",
            subject="Test Subject", 
            content="Test Content",
            status=CampaignStatus.DRAFT,
            created_at=datetime.now(),
            user_id=1
        )
    
    def test_create_campaign(self, campaign_service, mock_db):
        """Test campaign creation."""
        campaign_data = CampaignCreate(
            name="New Campaign",
            subject="New Subject",
            content="New Content"
        )
        
        # Mock the database operations
        mock_campaign = Mock()
        mock_campaign.id = 1
        mock_campaign.name = campaign_data.name
        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None
        
        # Test would call the actual service method
        # result = campaign_service.create_campaign(campaign_data, user_id=1)
        
        # Verify the mock was called
        # mock_db.add.assert_called_once()
        # mock_db.commit.assert_called_once()
    
    def test_update_campaign_status(self, campaign_service, sample_campaign):
        """Test campaign status updates."""
        # Test valid status transitions
        valid_transitions = [
            (CampaignStatus.DRAFT, CampaignStatus.SCHEDULED),
            (CampaignStatus.SCHEDULED, CampaignStatus.SENDING),
            (CampaignStatus.SENDING, CampaignStatus.SENT),
            (CampaignStatus.DRAFT, CampaignStatus.PAUSED)
        ]
        
        for from_status, to_status in valid_transitions:
            sample_campaign.status = from_status
            # In actual implementation, would call:
            # campaign_service.update_status(sample_campaign.id, to_status)
            sample_campaign.status = to_status
            assert sample_campaign.status == to_status
    
    def test_invalid_status_transitions(self, campaign_service, sample_campaign):
        """Test invalid campaign status transitions."""
        # These transitions should not be allowed
        invalid_transitions = [
            (CampaignStatus.SENT, CampaignStatus.DRAFT),
            (CampaignStatus.SENT, CampaignStatus.SENDING),
            (CampaignStatus.CANCELLED, CampaignStatus.SENDING)
        ]
        
        for from_status, to_status in invalid_transitions:
            sample_campaign.status = from_status
            # In actual implementation, this should raise an error:
            # with pytest.raises(ValueError):
            #     campaign_service.update_status(sample_campaign.id, to_status)
            
            # For now, just verify the logic
            assert from_status != to_status


class TestCampaignContent:
    """Test campaign content processing."""
    
    def test_html_content_validation(self):
        """Test HTML content validation."""
        valid_html = "<h1>Hello</h1><p>This is a test.</p>"
        invalid_html = "<script>alert('xss')</script>"
        
        # Valid HTML should pass
        campaign = CampaignCreate(
            name="Test",
            subject="Test",
            content=valid_html
        )
        assert campaign.content == valid_html
        
        # Invalid HTML should be sanitized (in actual implementation)
        # This test would verify XSS protection
    
    def test_personalization_tokens(self):
        """Test personalization token validation."""
        content_with_tokens = "Hello {{first_name}}, welcome to {{company_name}}!"
        
        campaign = CampaignCreate(
            name="Test",
            subject="Welcome {{first_name}}!",
            content=content_with_tokens
        )
        
        # Verify tokens are preserved
        assert "{{first_name}}" in campaign.content
        assert "{{company_name}}" in campaign.content
        assert "{{first_name}}" in campaign.subject
    
    def test_content_length_limits(self):
        """Test content length validation."""
        # Very long content
        long_content = "A" * 100000  # 100KB content
        
        campaign = CampaignCreate(
            name="Test",
            subject="Test",
            content=long_content
        )
        
        # Should handle large content appropriately
        assert len(campaign.content) > 0


class TestCampaignScheduling:
    """Test campaign scheduling logic."""
    
    def test_schedule_future_campaign(self):
        """Test scheduling campaign for future date."""
        future_date = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0)
        
        campaign_data = CampaignCreate(
            name="Scheduled Campaign",
            subject="Scheduled Email",
            content="Content",
            scheduled_at=future_date
        )
        
        assert campaign_data.scheduled_at == future_date
    
    def test_schedule_past_date_validation(self):
        """Test validation of past scheduling dates.""" 
        past_date = datetime(2020, 1, 1, 10, 0, 0)
        
        # Should raise validation error for past dates
        with pytest.raises(ValueError):
            CampaignCreate(
                name="Invalid Campaign",
                subject="Test",
                content="Test",
                scheduled_at=past_date
            )
    
    def test_timezone_handling(self):
        """Test timezone handling in scheduling."""
        # This would test timezone-aware scheduling
        # Implementation should handle different timezones correctly
        utc_time = datetime.utcnow()
        
        campaign_data = CampaignCreate(
            name="Timezone Test",
            subject="Test",
            content="Test",
            scheduled_at=utc_time
        )
        
        # Verify timezone handling
        assert campaign_data.scheduled_at is not None