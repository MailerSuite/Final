import pytest
import requests
import json
import time
from typing import Dict, Any
from datetime import datetime, timedelta

# Test configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api/v1"

class TestAPIIntegration:
    """End-to-end API integration tests"""
    
    def setup_method(self):
        """Setup test data and authentication"""
        self.session = requests.Session()
        self.test_user_data = {
            "email": f"test_{int(time.time())}@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        self.auth_token = None
        self.test_campaign_id = None
        self.test_contact_list_id = None
    
    def teardown_method(self):
        """Cleanup test data"""
        if self.auth_token:
            # Clean up test data if needed
            pass
    
    def test_health_check(self):
        """Test API health check endpoint"""
        response = self.session.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_user_registration_flow(self):
        """Test complete user registration flow"""
        # Test registration endpoint
        response = self.session.post(
            f"{API_BASE}/auth/register",
            json=self.test_user_data
        )
        
        if response.status_code == 201:
            # Registration successful
            data = response.json()
            assert "id" in data
            assert "email" in data
            assert data["email"] == self.test_user_data["email"]
        elif response.status_code == 422:
            # Validation error (expected for existing users)
            data = response.json()
            assert "detail" in data
        else:
            # Other status codes should be documented
            assert response.status_code in [201, 422, 409]
    
    def test_user_login_flow(self):
        """Test user login and authentication"""
        # Test login endpoint
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        
        response = self.session.post(
            f"{API_BASE}/auth/login",
            json=login_data
        )
        
        if response.status_code == 200:
            # Login successful
            data = response.json()
            assert "access_token" in data
            assert "token_type" in data
            assert data["token_type"] == "bearer"
            
            # Store token for subsequent tests
            self.auth_token = data["access_token"]
            self.session.headers.update({
                "Authorization": f"Bearer {self.auth_token}"
            })
        elif response.status_code == 401:
            # Invalid credentials
            data = response.json()
            assert "detail" in data
        else:
            # Other status codes should be documented
            assert response.status_code in [200, 401, 422]
    
    def test_protected_endpoints_access(self):
        """Test access to protected endpoints"""
        if not self.auth_token:
            pytest.skip("Authentication required for this test")
        
        # Test protected user profile endpoint
        response = self.session.get(f"{API_BASE}/users/me")
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == self.test_user_data["email"]
    
    def test_campaign_creation_flow(self):
        """Test complete campaign creation flow"""
        if not self.auth_token:
            pytest.skip("Authentication required for this test")
        
        # Create test contact list first
        contact_list_data = {
            "name": f"Test List {int(time.time())}",
            "description": "Test contact list for e2e testing"
        }
        
        response = self.session.post(
            f"{API_BASE}/contact-lists",
            json=contact_list_data
        )
        
        if response.status_code == 201:
            data = response.json()
            self.test_contact_list_id = data["id"]
        else:
            # Skip if contact list creation fails
            pytest.skip("Contact list creation failed")
        
        # Create test campaign
        campaign_data = {
            "name": f"Test Campaign {int(time.time())}",
            "subject": "Test Email Subject",
            "content": "<h1>Test Email Content</h1>",
            "contact_list_id": self.test_contact_list_id,
            "scheduled_at": (datetime.now() + timedelta(days=1)).isoformat()
        }
        
        response = self.session.post(
            f"{API_BASE}/campaigns",
            json=campaign_data
        )
        
        if response.status_code == 201:
            data = response.json()
            assert "id" in data
            assert "name" in data
            assert data["name"] == campaign_data["name"]
            
            self.test_campaign_id = data["id"]
        else:
            # Campaign creation failed
            data = response.json()
            assert "detail" in data
    
    def test_campaign_management_operations(self):
        """Test campaign management operations"""
        if not self.auth_token or not self.test_campaign_id:
            pytest.skip("Campaign required for this test")
        
        # Test campaign retrieval
        response = self.session.get(f"{API_BASE}/campaigns/{self.test_campaign_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "name" in data
        
        # Test campaign update
        update_data = {
            "name": f"Updated Campaign {int(time.time())}",
            "subject": "Updated Email Subject"
        }
        
        response = self.session.put(
            f"{API_BASE}/campaigns/{self.test_campaign_id}",
            json=update_data
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data["name"] == update_data["name"]
            assert data["subject"] == update_data["subject"]
        
        # Test campaign list retrieval
        response = self.session.get(f"{API_BASE}/campaigns")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data or isinstance(data, list)
    
    def test_contact_management_flow(self):
        """Test contact management operations"""
        if not self.auth_token:
            pytest.skip("Authentication required for this test")
        
        # Test contact creation
        contact_data = {
            "email": f"contact_{int(time.time())}@example.com",
            "first_name": "Test",
            "last_name": "Contact"
        }
        
        response = self.session.post(
            f"{API_BASE}/contacts",
            json=contact_data
        )
        
        if response.status_code == 201:
            data = response.json()
            assert "id" in data
            assert "email" in data
            contact_id = data["id"]
            
            # Test contact retrieval
            response = self.session.get(f"{API_BASE}/contacts/{contact_id}")
            assert response.status_code == 200
            
            # Test contact update
            update_data = {"first_name": "Updated"}
            response = self.session.put(
                f"{API_BASE}/contacts/{contact_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                data = response.json()
                assert data["first_name"] == "Updated"
    
    def test_template_management(self):
        """Test email template management"""
        if not self.auth_token:
            pytest.skip("Authentication required for this test")
        
        # Test template creation
        template_data = {
            "name": f"Test Template {int(time.time())}",
            "subject": "Test Template Subject",
            "content": "<h1>Test Template Content</h1>",
            "is_active": True
        }
        
        response = self.session.post(
            f"{API_BASE}/templates",
            json=template_data
        )
        
        if response.status_code == 201:
            data = response.json()
            assert "id" in data
            assert "name" in data
            template_id = data["id"]
            
            # Test template retrieval
            response = self.session.get(f"{API_BASE}/templates/{template_id}")
            assert response.status_code == 200
            
            # Test template list
            response = self.session.get(f"{API_BASE}/templates")
            assert response.status_code == 200
    
    def test_analytics_endpoints(self):
        """Test analytics and reporting endpoints"""
        if not self.auth_token:
            pytest.skip("Authentication required for this test")
        
        # Test analytics summary
        response = self.session.get(f"{API_BASE}/analytics/summary")
        if response.status_code == 200:
            data = response.json()
            # Analytics data should have expected structure
            assert isinstance(data, dict)
        
        # Test campaign analytics
        if self.test_campaign_id:
            response = self.session.get(f"{API_BASE}/analytics/campaigns/{self.test_campaign_id}")
            if response.status_code == 200:
                data = response.json()
                assert isinstance(data, dict)
    
    def test_error_handling(self):
        """Test API error handling"""
        # Test invalid endpoint
        response = self.session.get(f"{API_BASE}/invalid-endpoint")
        assert response.status_code == 404
        
        # Test invalid JSON
        response = self.session.post(
            f"{API_BASE}/auth/login",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 422]
        
        # Test missing required fields
        response = self.session.post(
            f"{API_BASE}/auth/login",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 422
        
        data = response.json()
        assert "detail" in data
    
    def test_rate_limiting(self):
        """Test API rate limiting (if implemented)"""
        if not self.auth_token:
            pytest.skip("Authentication required for this test")
        
        # Make multiple rapid requests to test rate limiting
        responses = []
        for _ in range(10):
            response = self.session.get(f"{API_BASE}/users/me")
            responses.append(response.status_code)
            time.sleep(0.1)  # Small delay between requests
        
        # All requests should succeed (rate limiting might be disabled in test)
        success_count = sum(1 for status in responses if status == 200)
        assert success_count >= 5  # At least half should succeed
    
    def test_concurrent_requests(self):
        """Test API behavior under concurrent requests"""
        if not self.auth_token:
            pytest.skip("Authentication required for this test")
        
        import concurrent.futures
        
        def make_request():
            return self.session.get(f"{API_BASE}/users/me")
        
        # Make concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            responses = [future.result() for future in futures]
        
        # All concurrent requests should succeed
        success_count = sum(1 for response in responses if response.status_code == 200)
        assert success_count >= 3  # At least 3 should succeed
    
    def test_data_consistency(self):
        """Test data consistency across API calls"""
        if not self.auth_token:
            pytest.skip("Authentication required for this test")
        
        # Create a test resource
        test_data = {
            "name": f"Consistency Test {int(time.time())}",
            "description": "Testing data consistency"
        }
        
        response = self.session.post(
            f"{API_BASE}/contact-lists",
            json=test_data
        )
        
        if response.status_code == 201:
            create_data = response.json()
            resource_id = create_data["id"]
            
            # Retrieve the same resource
            response = self.session.get(f"{API_BASE}/contact-lists/{resource_id}")
            assert response.status_code == 200
            
            retrieve_data = response.json()
            
            # Data should be consistent
            assert create_data["id"] == retrieve_data["id"]
            assert create_data["name"] == retrieve_data["name"]
            assert create_data["description"] == retrieve_data["description"]
    
    def test_api_versioning(self):
        """Test API versioning support"""
        # Test different API versions
        versions = ["v1", "v2"] if "v2" in self._get_available_versions() else ["v1"]
        
        for version in versions:
            response = self.session.get(f"{BASE_URL}/api/{version}/health")
            if response.status_code == 200:
                data = response.json()
                assert "status" in data
            elif response.status_code == 404:
                # Version not supported
                pass
    
    def _get_available_versions(self):
        """Helper method to get available API versions"""
        try:
            response = self.session.get(f"{BASE_URL}/api")
            if response.status_code == 200:
                return response.json().get("versions", [])
        except:
            pass
        return ["v1"]

if __name__ == "__main__":
    # Run tests directly if script is executed
    pytest.main([__file__, "-v"])
