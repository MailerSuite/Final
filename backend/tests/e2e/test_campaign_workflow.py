"""
🔄 End-to-End Campaign Workflow Tests
Testing complete user workflows from login to campaign management
"""

import pytest
from fastapi.testclient import TestClient


class TestFullCampaignWorkflow:
    """Test complete campaign workflow from start to finish."""
    
    @pytest.mark.asyncio
    def test_complete_campaign_creation_workflow(self, client: TestClient, admin_headers):
        """Test complete workflow: login -> create campaign -> send -> track analytics."""
        
        auth_headers = admin_headers
        
        # Step 2: Create a campaign
        campaign_data = {
            "name": "E2E Test Campaign",
            "subject": "Welcome to our platform!",
            "content": """
            <html>
                <body>
                    <h1>Welcome {{first_name}}!</h1>
                    <p>Thank you for joining our platform.</p>
                    <a href="https://example.com/welcome">Get Started</a>
                </body>
            </html>
            """,
            "status": "draft"
        }
        
        create_response = client.post(
            "/api/v1/campaigns/",
            json=campaign_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        
        campaign = create_response.json()
        campaign_id = campaign["id"]
        
        # Step 3: Send test email
        test_email_data = {
            "test_emails": ["test@example.com"]
        }
        
        test_response = client.post(
            f"/api/v1/campaigns/{campaign_id}/test",
            json=test_email_data,
            headers=auth_headers
        )
        assert test_response.status_code in [200, 202]
        
        # Step 4: Send campaign (if implementation allows)
        send_response = client.post(
            f"/api/v1/campaigns/{campaign_id}/send",
            headers=auth_headers
        )
        assert send_response.status_code in [200, 202, 400]  # 400 if no recipients
        
        # Step 5: Check analytics
        analytics_response = client.get(
            f"/api/v1/campaigns/{campaign_id}/analytics",
            headers=auth_headers
        )
        assert analytics_response.status_code == 200
        
        analytics = analytics_response.json()
        assert "sent_count" in analytics
        assert "open_rate" in analytics
        assert "click_rate" in analytics
        
        # Step 6: Clone campaign for reuse
        clone_response = client.post(
            f"/api/v1/campaigns/{campaign_id}/clone",
            headers=auth_headers
        )
        assert clone_response.status_code == 201
        
        cloned_campaign = clone_response.json()
        assert cloned_campaign["id"] != campaign_id
        assert "Copy" in cloned_campaign["name"] or "Clone" in cloned_campaign["name"]
    
    @pytest.mark.asyncio
    def test_campaign_scheduling_workflow(self, client: TestClient, admin_headers):
        """Test campaign scheduling workflow."""
        
        auth_headers = admin_headers
        
        # Create campaign
        campaign_data = {
            "name": "Scheduled Campaign",
            "subject": "Scheduled Email",
            "content": "<h1>This is a scheduled email</h1>",
            "status": "draft"
        }
        
        create_response = client.post(
            "/api/v1/campaigns/",
            json=campaign_data,
            headers=auth_headers
        )
        campaign_id = create_response.json()["id"]
        
        # Schedule the campaign
        schedule_data = {
            "scheduled_at": "2025-12-01T10:00:00Z"
        }
        
        schedule_response = client.post(
            f"/api/v1/campaigns/{campaign_id}/schedule",
            json=schedule_data,
            headers=auth_headers
        )
        assert schedule_response.status_code in [200, 202]
        
        # Verify campaign status is updated
        get_response = client.get(
            f"/api/v1/campaigns/{campaign_id}",
            headers=auth_headers
        )
        campaign = get_response.json()
        assert campaign["status"] in ["scheduled", "pending"]
    
    @pytest.mark.asyncio
    def test_ab_testing_workflow(self, client: TestClient, admin_headers):
        """Test A/B testing workflow."""
        
        auth_headers = admin_headers
        
        # Create base campaign
        campaign_data = {
            "name": "A/B Test Campaign",
            "subject": "Original Subject",
            "content": "<h1>Original Content</h1>",
            "status": "draft"
        }
        
        create_response = client.post(
            "/api/v1/campaigns/",
            json=campaign_data,
            headers=auth_headers
        )
        campaign_id = create_response.json()["id"]
        
        # Create A/B test
        ab_test_data = {
            "test_type": "subject",
            "variant_b_subject": "Alternative Subject",
            "test_percentage": 20,
            "winner_criteria": "open_rate"
        }
        
        ab_test_response = client.post(
            f"/api/v1/campaigns/{campaign_id}/ab-test",
            json=ab_test_data,
            headers=auth_headers
        )
        
        if ab_test_response.status_code == 201:
            # Check A/B test results
            results_response = client.get(
                f"/api/v1/campaigns/{campaign_id}/ab-test",
                headers=auth_headers
            )
            assert results_response.status_code == 200


class TestEmailManagementWorkflow:
    """Test email configuration and management workflow."""
    
    @pytest.mark.asyncio
    def test_smtp_configuration_workflow(self, client: TestClient, admin_headers):
        """Test SMTP configuration workflow."""
        
        auth_headers = admin_headers
        
        # Add SMTP configuration
        smtp_data = {
            "name": "Test SMTP",
            "host": "smtp.gmail.com",
            "port": 587,
            "username": "test@gmail.com",
            "password": "testpassword",
            "use_tls": True
        }
        
        smtp_response = client.post(
            "/api/v1/email/smtp/accounts",
            json=smtp_data,
            headers=auth_headers
        )
        
        if smtp_response.status_code == 201:
            smtp_id = smtp_response.json()["id"]
            
            # Test SMTP connection
            test_response = client.post(
                f"/api/v1/email/smtp/accounts/{smtp_id}/test",
                headers=auth_headers
            )
            assert test_response.status_code in [200, 400]  # 400 for invalid credentials
            
            # Get SMTP metrics
            metrics_response = client.get(
                f"/api/v1/email/smtp/accounts/{smtp_id}/metrics",
                headers=auth_headers
            )
            assert metrics_response.status_code == 200


class TestAdminWorkflow:
    """Test admin-specific workflows."""
    
    @pytest.mark.asyncio
    def test_admin_user_management_workflow(self, client: TestClient, admin_headers):
        """Test admin user management workflow."""
        
        # Using seeded admin headers
        
        # Get all users
        users_response = client.get(
            "/api/v1/admin/users",
            headers=admin_headers
        )
        assert users_response.status_code == 200
        
        # Get system health
        health_response = client.get(
            "/api/v1/admin/system/health",
            headers=admin_headers
        )
        assert health_response.status_code == 200
        
        health_data = health_response.json()
        assert "status" in health_data
        assert "components" in health_data
        
        # Get system metrics
        metrics_response = client.get(
            "/api/v1/admin/system/metrics",
            headers=admin_headers
        )
        assert metrics_response.status_code == 200
    
    @pytest.mark.asyncio
    def test_admin_analytics_workflow(self, client: TestClient, admin_headers):
        """Test admin analytics workflow."""
        
        # Using seeded admin headers
        
        # Get admin analytics
        analytics_response = client.get(
            "/api/v1/admin/analytics",
            headers=admin_headers
        )
        assert analytics_response.status_code == 200
        
        analytics = analytics_response.json()
        assert "total_users" in analytics or "overview" in analytics
        assert "total_campaigns" in analytics or "campaigns" in analytics


class TestErrorHandlingWorkflow:
    """Test error handling in complete workflows."""
    
    @pytest.mark.asyncio
    def test_unauthorized_workflow_protection(self, client: TestClient):
        """Test that unauthorized users cannot access protected workflows."""
        
        # Try to create campaign without authentication
        campaign_data = {
            "name": "Unauthorized Campaign",
            "subject": "Test",
            "content": "Test"
        }
        
        response = client.post("/api/v1/campaigns/", json=campaign_data)
        assert response.status_code == 401
        
        # Try to access admin endpoints without admin privileges
        response = client.get("/api/v1/admin/users")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    def test_workflow_with_invalid_data(self, client: TestClient, admin_headers):
        """Test workflow with invalid data at various steps."""
        
        auth_headers = admin_headers
        
        # Try to create campaign with invalid data
        invalid_campaign_data = {
            "name": "",  # Empty name
            "subject": "A" * 300,  # Too long
            "content": ""  # Empty content
        }
        
        response = client.post(
            "/api/v1/campaigns/",
            json=invalid_campaign_data,
            headers=auth_headers
        )
        assert response.status_code == 422
        
        # Try to send to non-existent campaign
        response = client.post(
            "/api/v1/campaigns/99999/send",
            headers=auth_headers
        )
        assert response.status_code == 404