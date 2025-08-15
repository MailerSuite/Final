"""
📧 Campaign API Integration Tests 
Testing campaign management endpoints with real HTTP requests
"""

import pytest
from fastapi.testclient import TestClient


class TestCampaignCRUD:
    """Test Campaign CRUD operations."""
    
    @pytest.mark.asyncio
    def test_create_campaign(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test creating a new campaign."""
        response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_campaign_data["name"]
        assert data["subject"] == sample_campaign_data["subject"]
        assert data["content"] == sample_campaign_data["content"]
        assert "id" in data
        assert "created_at" in data
    
    @pytest.mark.asyncio
    def test_create_campaign_unauthorized(self, client: TestClient, sample_campaign_data):
        """Test creating campaign without authentication."""
        response = client.post("/api/v1/campaigns/", json=sample_campaign_data)
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    def test_list_campaigns(self, client: TestClient, admin_headers):
        """Test listing user campaigns."""
        response = client.get("/api/v1/campaigns/", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "items" in data  # Depending on pagination
    
    @pytest.mark.asyncio
    def test_get_campaign_by_id(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test getting specific campaign by ID."""
        # First create a campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Then get it by ID
            get_response = client.get(
                f"/api/v1/campaigns/{campaign_id}",
                headers=admin_headers
            )
            
            assert get_response.status_code == 200
            data = get_response.json()
            assert data["id"] == campaign_id
            assert data["name"] == sample_campaign_data["name"]
    
    @pytest.mark.asyncio
    def test_get_nonexistent_campaign(self, client: TestClient, admin_headers):
        """Test getting campaign that doesn't exist."""
        response = client.get("/api/v1/campaigns/99999", headers=admin_headers)
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    def test_update_campaign(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test updating an existing campaign."""
        # First create a campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Update the campaign
            update_data = {
                "name": "Updated Campaign Name",
                "subject": "Updated Subject"
            }
            
            update_response = client.put(
                f"/api/v1/campaigns/{campaign_id}",
                json=update_data,
                headers=admin_headers
            )
            
            assert update_response.status_code == 200
            data = update_response.json()
            assert data["name"] == update_data["name"]
            assert data["subject"] == update_data["subject"]
    
    @pytest.mark.asyncio
    def test_delete_campaign(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test deleting a campaign."""
        # First create a campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Delete the campaign
            delete_response = client.delete(
                f"/api/v1/campaigns/{campaign_id}",
                headers=admin_headers
            )
            
            assert delete_response.status_code in [200, 204]
            
            # Verify it's deleted
            get_response = client.get(
                f"/api/v1/campaigns/{campaign_id}",
                headers=admin_headers
            )
            assert get_response.status_code == 404


class TestCampaignOperations:
    """Test campaign operations like sending, scheduling, etc."""
    
    @pytest.mark.asyncio
    def test_send_test_email(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test sending test email."""
        # First create a campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Send test email
            test_data = {
                "test_emails": ["test@example.com", "test2@example.com"]
            }
            
            response = client.post(
                f"/api/v1/campaigns/{campaign_id}/test",
                json=test_data,
                headers=admin_headers
            )
            
            assert response.status_code in [200, 202]  # Accepted for processing
    
    @pytest.mark.asyncio
    def test_schedule_campaign(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test scheduling a campaign."""
        # Create campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Schedule the campaign
            schedule_data = {
                "scheduled_at": "2025-12-01T10:00:00Z"
            }
            
            response = client.post(
                f"/api/v1/campaigns/{campaign_id}/schedule",
                json=schedule_data,
                headers=admin_headers
            )
            
            assert response.status_code in [200, 202]
    
    @pytest.mark.asyncio
    def test_send_campaign(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test sending a campaign immediately."""
        # Create campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Send the campaign
            response = client.post(
                f"/api/v1/campaigns/{campaign_id}/send",
                headers=admin_headers
            )
            
            assert response.status_code in [200, 202]  # Accepted for processing
    
    @pytest.mark.asyncio
    def test_pause_campaign(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test pausing a campaign."""
        # Create and start sending campaign first
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Pause the campaign
            response = client.post(
                f"/api/v1/campaigns/{campaign_id}/pause",
                headers=admin_headers
            )
            
            assert response.status_code in [200, 400]  # 400 if not in sendable state
    
    @pytest.mark.asyncio
    def test_resume_campaign(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test resuming a paused campaign."""
        # Create campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Resume the campaign
            response = client.post(
                f"/api/v1/campaigns/{campaign_id}/resume",
                headers=admin_headers
            )
            
            assert response.status_code in [200, 400]  # 400 if not paused
    
    @pytest.mark.asyncio
    def test_clone_campaign(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test cloning an existing campaign."""
        # Create original campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Clone the campaign
            response = client.post(
                f"/api/v1/campaigns/{campaign_id}/clone",
                headers=admin_headers
            )
            
            assert response.status_code == 201
            cloned_data = response.json()
            assert cloned_data["id"] != campaign_id
            assert cloned_data["name"] != sample_campaign_data["name"]  # Should be modified
            assert "Copy" in cloned_data["name"] or "Clone" in cloned_data["name"]


class TestCampaignAnalytics:
    """Test campaign analytics endpoints."""
    
    @pytest.mark.asyncio
    def test_get_campaign_analytics(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test getting campaign analytics."""
        # Create campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Get analytics
            response = client.get(
                f"/api/v1/campaigns/{campaign_id}/analytics",
                headers=admin_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "sent_count" in data
            assert "open_rate" in data
            assert "click_rate" in data
    
    @pytest.mark.asyncio
    def test_get_campaign_opens(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test getting campaign open tracking data."""
        # Create campaign
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Get opens data
            response = client.get(
                f"/api/v1/campaigns/{campaign_id}/opens",
                headers=admin_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list) or "items" in data
    
    @pytest.mark.asyncio
    def test_get_campaign_clicks(self, client: TestClient, admin_headers, sample_campaign_data):
        """Test getting campaign click tracking data."""
        # Create campaign  
        create_response = client.post(
            "/api/v1/campaigns/",
            json=sample_campaign_data,
            headers=admin_headers
        )
        
        if create_response.status_code == 201:
            campaign_id = create_response.json()["id"]
            
            # Get clicks data
            response = client.get(
                f"/api/v1/campaigns/{campaign_id}/clicks",
                headers=admin_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list) or "items" in data


class TestCampaignValidation:
    """Test campaign validation and error handling."""
    
    @pytest.mark.asyncio
    def test_create_campaign_missing_fields(self, client: TestClient, admin_headers):
        """Test creating campaign with missing required fields."""
        incomplete_data = {"name": "Test Campaign"}  # Missing subject and content
        
        response = client.post(
            "/api/v1/campaigns/",
            json=incomplete_data,
            headers=admin_headers
        )
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    def test_create_campaign_invalid_data(self, client: TestClient, admin_headers):
        """Test creating campaign with invalid data."""
        invalid_data = {
            "name": "",  # Empty name
            "subject": "A" * 300,  # Too long subject
            "content": "<script>alert('xss')</script>"  # Potentially harmful content
        }
        
        response = client.post(
            "/api/v1/campaigns/",
            json=invalid_data,
            headers=admin_headers
        )
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    def test_operation_on_nonexistent_campaign(self, client: TestClient, admin_headers):
        """Test operations on non-existent campaign."""
        nonexistent_id = 99999
        
        # Try to send non-existent campaign
        response = client.post(
            f"/api/v1/campaigns/{nonexistent_id}/send",
            headers=admin_headers
        )
        
        assert response.status_code == 404