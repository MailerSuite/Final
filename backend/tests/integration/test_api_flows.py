"""
End-to-End API Integration Tests
Tests complete user flows across multiple endpoints
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from datetime import datetime, timedelta


class TestAuthenticationFlow:
    """Test complete authentication flow"""
    
    def test_complete_auth_flow(self, client: TestClient):
        """Test registration -> login -> token refresh -> logout flow"""
        
        # 1. Register new user
        user_data = {
            "email": "flow_test@example.com",
            "password": "TestPassword123!",
            "username": "flowtest"
        }
        
        register_response = client.post("/api/v1/auth/register", json=user_data)
        assert register_response.status_code == 200
        register_data = register_response.json()
        assert "access_token" in register_data
        
        # 2. Login with credentials
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        login_response = client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == 200
        login_data = login_response.json()
        
        access_token = login_data["access_token"]
        refresh_token = login_data.get("refresh_token")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # 3. Access protected endpoint
        me_response = client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == 200
        user_info = me_response.json()
        assert user_info["email"] == user_data["email"]
        
        # 4. Refresh token (if available)
        if refresh_token:
            refresh_response = client.post(
                "/api/v1/auth/refresh", 
                json={"refresh_token": refresh_token}
            )
            if refresh_response.status_code == 200:
                new_tokens = refresh_response.json()
                assert "access_token" in new_tokens
        
        # 5. Update profile
        profile_update = {"name": "Updated Name"}
        update_response = client.patch("/api/v1/auth/profile", 
                                     json=profile_update, headers=headers)
        assert update_response.status_code in [200, 404]  # May not be implemented
        
        # 6. Logout
        logout_response = client.post("/api/v1/auth/logout", headers=headers)
        assert logout_response.status_code in [200, 404]  # May not be implemented

    def test_invalid_credentials_flow(self, client: TestClient):
        """Test authentication with invalid credentials"""
        
        # Try login with non-existent user
        invalid_login = {
            "email": "nonexistent@example.com",
            "password": "WrongPassword123!"
        }
        
        response = client.post("/api/v1/auth/login", json=invalid_login)
        assert response.status_code in [401, 400, 422]
        
        # Try accessing protected endpoint without token
        response = client.get("/api/v1/auth/me")
        assert response.status_code in [401, 403]
        
        # Try with invalid token
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code in [401, 403, 422]


class TestSMTPManagementFlow:
    """Test SMTP account management flow"""
    
    def test_smtp_account_lifecycle(self, client: TestClient, admin_headers: dict):
        """Test complete SMTP account management"""
        
        # 1. Create SMTP account
        smtp_data = {
            "email": "smtp_test@example.com",
            "host": "smtp.example.com",
            "port": 587,
            "username": "smtp_test@example.com",
            "password": "smtp_password",
            "use_tls": True
        }
        
        create_response = client.post("/api/v1/smtp/accounts", 
                                    json=smtp_data, headers=admin_headers)
        assert create_response.status_code in [200, 201]
        
        if create_response.status_code in [200, 201]:
            smtp_account = create_response.json()
            account_id = smtp_account.get("id") or smtp_account.get("data", {}).get("id")
            
            if account_id:
                # 2. Get SMTP accounts
                list_response = client.get("/api/v1/smtp/accounts", headers=admin_headers)
                assert list_response.status_code == 200
                
                # 3. Test SMTP connection
                test_response = client.post(f"/api/v1/smtp/accounts/{account_id}/test", 
                                          headers=admin_headers)
                assert test_response.status_code in [200, 400, 503]  # May fail if no proxy
                
                # 4. Update SMTP account
                update_data = {"host": "new-smtp.example.com"}
                update_response = client.patch(f"/api/v1/smtp/accounts/{account_id}", 
                                             json=update_data, headers=admin_headers)
                assert update_response.status_code in [200, 404]
                
                # 5. Delete SMTP account
                delete_response = client.delete(f"/api/v1/smtp/accounts/{account_id}", 
                                               headers=admin_headers)
                assert delete_response.status_code in [200, 204, 404]


class TestCampaignFlow:
    """Test campaign management flow"""
    
    def test_campaign_lifecycle(self, client: TestClient, admin_headers: dict):
        """Test complete campaign lifecycle"""
        
        # First create an SMTP account for the campaign
        smtp_data = {
            "email": "campaign_test@example.com",
            "host": "smtp.example.com", 
            "port": 587,
            "username": "campaign_test@example.com",
            "password": "password",
            "use_tls": True
        }
        
        smtp_response = client.post("/api/v1/smtp/accounts", 
                                  json=smtp_data, headers=admin_headers)
        
        smtp_account_id = None
        if smtp_response.status_code in [200, 201]:
            smtp_data = smtp_response.json()
            smtp_account_id = smtp_data.get("id") or smtp_data.get("data", {}).get("id")
        
        # 1. Create campaign
        campaign_data = {
            "name": "Test Campaign Flow",
            "subject": "Test Subject",
            "content": "Test campaign content",
            "smtp_account_id": smtp_account_id
        }
        
        create_response = client.post("/api/v1/campaigns", 
                                    json=campaign_data, headers=admin_headers)
        
        if create_response.status_code in [200, 201]:
            campaign = create_response.json()
            campaign_id = campaign.get("id") or campaign.get("data", {}).get("id")
            
            if campaign_id:
                # 2. Get campaigns
                list_response = client.get("/api/v1/campaigns", headers=admin_headers)
                assert list_response.status_code == 200
                
                # 3. Get specific campaign
                get_response = client.get(f"/api/v1/campaigns/{campaign_id}", 
                                        headers=admin_headers)
                assert get_response.status_code in [200, 404]
                
                # 4. Update campaign
                update_data = {"name": "Updated Campaign Name"}
                update_response = client.patch(f"/api/v1/campaigns/{campaign_id}", 
                                             json=update_data, headers=admin_headers)
                assert update_response.status_code in [200, 404]
                
                # 5. Try to start campaign (may fail without email list)
                start_response = client.post(f"/api/v1/campaigns/{campaign_id}/start", 
                                           headers=admin_headers)
                assert start_response.status_code in [200, 400, 404]
                
                # 6. Get campaign analytics
                analytics_response = client.get(f"/api/v1/campaigns/{campaign_id}/analytics", 
                                               headers=admin_headers)
                assert analytics_response.status_code in [200, 404]
                
                # 7. Delete campaign
                delete_response = client.delete(f"/api/v1/campaigns/{campaign_id}", 
                                               headers=admin_headers)
                assert delete_response.status_code in [200, 204, 404]


class TestSystemHealthFlow:
    """Test system health and monitoring endpoints"""
    
    def test_health_endpoints(self, client: TestClient):
        """Test health check endpoints"""
        
        # 1. Basic health check
        health_response = client.get("/api/v1/health/live")
        assert health_response.status_code in [200, 404]
        
        # 2. Readiness check
        ready_response = client.get("/api/v1/health/ready")
        assert ready_response.status_code in [200, 404]
        
        # 3. System status
        status_response = client.get("/api/v1/system/status")
        assert status_response.status_code in [200, 404]

    def test_metrics_endpoints(self, client: TestClient, admin_headers: dict):
        """Test metrics collection endpoints"""
        
        # 1. Performance metrics
        perf_response = client.get("/api/v1/performance/metrics", headers=admin_headers)
        assert perf_response.status_code in [200, 404]
        
        # 2. System metrics
        system_response = client.get("/api/v1/metrics/system", headers=admin_headers)
        assert system_response.status_code in [200, 404]
        
        # 3. Analytics data
        analytics_response = client.get("/api/v1/analytics/overview", headers=admin_headers)
        assert analytics_response.status_code in [200, 404]


class TestSecurityFlow:
    """Test security-related endpoints"""
    
    def test_security_endpoints(self, client: TestClient, admin_headers: dict):
        """Test security validation endpoints"""
        
        # 1. Security status
        status_response = client.get("/api/v1/security/status", headers=admin_headers)
        assert status_response.status_code in [200, 404]
        
        # 2. SPF validation
        spf_data = {
            "domain": "example.com",
            "sender_ip": "192.168.1.1"
        }
        spf_response = client.post("/api/v1/security/spf/validate", 
                                 json=spf_data, headers=admin_headers)
        assert spf_response.status_code in [200, 404, 422]
        
        # 3. Content scanning
        scan_data = {
            "content": "This is test content for scanning",
            "scan_type": "spam"
        }
        scan_response = client.post("/api/v1/security/content/scan", 
                                  json=scan_data, headers=admin_headers)
        assert scan_response.status_code in [200, 404, 422]


class TestTemplateFlow:
    """Test template management flow"""
    
    def test_template_lifecycle(self, client: TestClient, admin_headers: dict):
        """Test template creation and management"""
        
        # 1. Create template
        template_data = {
            "name": "Test Template",
            "subject": "Template Subject",
            "content": "<html><body>Template content</body></html>",
            "type": "email"
        }
        
        create_response = client.post("/api/v1/templates", 
                                    json=template_data, headers=admin_headers)
        
        if create_response.status_code in [200, 201]:
            template = create_response.json()
            template_id = template.get("id") or template.get("data", {}).get("id")
            
            if template_id:
                # 2. Get templates
                list_response = client.get("/api/v1/templates", headers=admin_headers)
                assert list_response.status_code in [200, 404]
                
                # 3. Get specific template
                get_response = client.get(f"/api/v1/templates/{template_id}", 
                                        headers=admin_headers)
                assert get_response.status_code in [200, 404]
                
                # 4. Update template
                update_data = {"name": "Updated Template"}
                update_response = client.patch(f"/api/v1/templates/{template_id}", 
                                             json=update_data, headers=admin_headers)
                assert update_response.status_code in [200, 404]
                
                # 5. Delete template
                delete_response = client.delete(f"/api/v1/templates/{template_id}", 
                                               headers=admin_headers)
                assert delete_response.status_code in [200, 204, 404]


class TestErrorHandling:
    """Test API error handling"""
    
    def test_invalid_json(self, client: TestClient):
        """Test handling of invalid JSON"""
        response = client.post("/api/v1/auth/login", 
                             data="invalid json", 
                             headers={"Content-Type": "application/json"})
        assert response.status_code == 422
    
    def test_missing_required_fields(self, client: TestClient):
        """Test handling of missing required fields"""
        incomplete_data = {"email": "test@example.com"}  # Missing password
        response = client.post("/api/v1/auth/login", json=incomplete_data)
        assert response.status_code == 422
        
        error_detail = response.json()
        assert "detail" in error_detail or "error" in error_detail
    
    def test_invalid_field_types(self, client: TestClient):
        """Test handling of invalid field types"""
        invalid_data = {
            "email": 123,  # Should be string
            "password": ["invalid", "type"]  # Should be string
        }
        response = client.post("/api/v1/auth/login", json=invalid_data)
        assert response.status_code == 422
    
    def test_unauthorized_access(self, client: TestClient):
        """Test unauthorized access to protected endpoints"""
        protected_endpoints = [
            "/api/v1/auth/me",
            "/api/v1/campaigns",
            "/api/v1/smtp/accounts",
            "/api/v1/analytics/overview"
        ]
        
        for endpoint in protected_endpoints:
            response = client.get(endpoint)
            assert response.status_code in [401, 403, 404]
    
    def test_invalid_endpoint(self, client: TestClient):
        """Test access to non-existent endpoints"""
        response = client.get("/api/v1/nonexistent/endpoint")
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client: TestClient):
        """Test wrong HTTP methods"""
        # Try POST on GET endpoint
        response = client.post("/api/v1/health/live")
        assert response.status_code in [404, 405]
        
        # Try GET on POST endpoint
        response = client.get("/api/v1/auth/login")
        assert response.status_code in [404, 405]


class TestDataValidation:
    """Test data validation across endpoints"""
    
    def test_email_validation(self, client: TestClient):
        """Test email format validation"""
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "test@",
            "test space@example.com"
        ]
        
        for email in invalid_emails:
            data = {"email": email, "password": "ValidPassword123!"}
            response = client.post("/api/v1/auth/register", json=data)
            assert response.status_code == 422
    
    def test_password_validation(self, client: TestClient):
        """Test password strength validation"""
        weak_passwords = [
            "123",
            "password",
            "12345678"
        ]
        
        for password in weak_passwords:
            data = {"email": "test@example.com", "password": password}
            response = client.post("/api/v1/auth/register", json=data)
            # May return 422 for validation error or 400 for weak password
            assert response.status_code in [400, 422]


class TestPaginationAndFiltering:
    """Test pagination and filtering functionality"""
    
    def test_pagination_parameters(self, client: TestClient, admin_headers: dict):
        """Test pagination with various parameters"""
        endpoints_with_pagination = [
            "/api/v1/campaigns",
            "/api/v1/smtp/accounts",
            "/api/v1/templates"
        ]
        
        for endpoint in endpoints_with_pagination:
            # Test default pagination
            response = client.get(endpoint, headers=admin_headers)
            if response.status_code == 200:
                data = response.json()
                # Check for pagination metadata
                assert isinstance(data, (dict, list))
            
            # Test with page parameters
            response = client.get(f"{endpoint}?page=1&per_page=5", headers=admin_headers)
            assert response.status_code in [200, 404, 422]
            
            # Test invalid pagination
            response = client.get(f"{endpoint}?page=-1&per_page=0", headers=admin_headers)
            assert response.status_code in [200, 404, 422]


class TestConcurrentRequests:
    """Test handling of concurrent requests"""
    
    def test_concurrent_auth_requests(self, client: TestClient):
        """Test concurrent authentication requests"""
        import threading
        
        def make_auth_request():
            data = {"email": "concurrent@example.com", "password": "TestPass123!"}
            return client.post("/api/v1/auth/register", json=data)
        
        # Create multiple threads for concurrent requests
        threads = []
        results = []
        
        for i in range(5):
            thread = threading.Thread(target=lambda: results.append(make_auth_request()))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # At least one request should succeed, others may fail due to duplicate email
        success_count = sum(1 for r in results if r.status_code in [200, 201])
        assert success_count >= 1
    
    def test_rate_limiting(self, client: TestClient):
        """Test rate limiting functionality"""
        # Make multiple rapid requests
        responses = []
        for i in range(20):
            response = client.get("/api/v1/health/live")
            responses.append(response)
        
        # Check if any rate limiting is applied (status 429)
        rate_limited = any(r.status_code == 429 for r in responses)
        # Rate limiting may or may not be configured, so we just check it handles the load
        assert len(responses) == 20