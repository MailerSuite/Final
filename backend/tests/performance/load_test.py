"""
Load Testing Framework for MailerSuite2
High-volume performance testing using Locust
"""

import json
import random
import time
from locust import HttpUser, TaskSet, task, between, events
from locust.runners import MasterRunner, WorkerRunner
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AuthenticationTasks(TaskSet):
    """Authentication-related load testing tasks"""
    
    def on_start(self):
        """Setup for each user"""
        self.auth_token = None
        self.user_email = f"loadtest_{random.randint(1000, 9999)}@example.com"
        self.user_password = "LoadTest123!"
        self.register_user()
    
    def register_user(self):
        """Register a test user"""
        user_data = {
            "email": self.user_email,
            "password": self.user_password,
            "username": f"loadtest_{random.randint(1000, 9999)}"
        }
        
        with self.client.post("/api/v1/auth/register", 
                             json=user_data, 
                             catch_response=True) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.auth_token = data.get("access_token")
                    response.success()
                except json.JSONDecodeError:
                    response.failure("Invalid JSON response")
            elif response.status_code == 400:
                # User might already exist, try to login
                self.login_user()
            else:
                response.failure(f"Registration failed: {response.status_code}")
    
    def login_user(self):
        """Login with existing user"""
        login_data = {
            "email": self.user_email,
            "password": self.user_password
        }
        
        with self.client.post("/api/v1/auth/login", 
                             json=login_data, 
                             catch_response=True) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.auth_token = data.get("access_token")
                    response.success()
                except json.JSONDecodeError:
                    response.failure("Invalid JSON response")
            else:
                response.failure(f"Login failed: {response.status_code}")
    
    @task(3)
    def get_user_profile(self):
        """Get user profile - frequent operation"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get("/api/v1/auth/me", 
                           headers=headers, 
                           catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 401:
                # Token expired, re-login
                self.login_user()
                response.success()
            else:
                response.failure(f"Get profile failed: {response.status_code}")
    
    @task(1)
    def update_profile(self):
        """Update user profile - less frequent operation"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        update_data = {"name": f"Updated Name {random.randint(1, 1000)}"}
        
        with self.client.patch("/api/v1/auth/profile", 
                              json=update_data, 
                              headers=headers, 
                              catch_response=True) as response:
            if response.status_code in [200, 404]:  # 404 if endpoint not implemented
                response.success()
            elif response.status_code == 401:
                self.login_user()
                response.success()
            else:
                response.failure(f"Update profile failed: {response.status_code}")


class SMTPManagementTasks(TaskSet):
    """SMTP account management load testing"""
    
    def on_start(self):
        """Setup authentication"""
        self.auth_token = None
        self.smtp_accounts = []
        self.authenticate()
    
    def authenticate(self):
        """Authenticate user"""
        user_data = {
            "email": f"smtp_load_{random.randint(1000, 9999)}@example.com",
            "password": "LoadTest123!",
            "username": f"smtpload_{random.randint(1000, 9999)}"
        }
        
        # Try to register, then login
        self.client.post("/api/v1/auth/register", json=user_data)
        
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        response = self.client.post("/api/v1/auth/login", json=login_data)
        
        if response.status_code == 200:
            self.auth_token = response.json().get("access_token")
    
    @task(5)
    def list_smtp_accounts(self):
        """List SMTP accounts - frequent operation"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get("/api/v1/smtp/accounts", 
                           headers=headers, 
                           catch_response=True) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, dict) and "data" in data:
                        self.smtp_accounts = data["data"]
                    elif isinstance(data, list):
                        self.smtp_accounts = data
                    response.success()
                except json.JSONDecodeError:
                    response.failure("Invalid JSON response")
            else:
                response.failure(f"List SMTP accounts failed: {response.status_code}")
    
    @task(2)
    def create_smtp_account(self):
        """Create SMTP account"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        smtp_data = {
            "email": f"smtp_{random.randint(1000, 9999)}@example.com",
            "host": "smtp.example.com",
            "port": 587,
            "username": f"smtp_{random.randint(1000, 9999)}@example.com",
            "password": "smtp_password",
            "use_tls": True
        }
        
        with self.client.post("/api/v1/smtp/accounts", 
                            json=smtp_data, 
                            headers=headers, 
                            catch_response=True) as response:
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    account_id = data.get("id") or data.get("data", {}).get("id")
                    if account_id:
                        self.smtp_accounts.append({"id": account_id})
                    response.success()
                except json.JSONDecodeError:
                    response.failure("Invalid JSON response")
            else:
                response.failure(f"Create SMTP account failed: {response.status_code}")
    
    @task(1)
    def test_smtp_connection(self):
        """Test SMTP connection"""
        if not self.auth_token or not self.smtp_accounts:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        account = random.choice(self.smtp_accounts)
        account_id = account.get("id")
        
        if account_id:
            with self.client.post(f"/api/v1/smtp/accounts/{account_id}/test", 
                                headers=headers, 
                                catch_response=True) as response:
                if response.status_code in [200, 400, 503]:  # 400/503 expected for test accounts
                    response.success()
                else:
                    response.failure(f"Test SMTP failed: {response.status_code}")


class CampaignManagementTasks(TaskSet):
    """Campaign management load testing"""
    
    def on_start(self):
        """Setup authentication and initial data"""
        self.auth_token = None
        self.campaigns = []
        self.smtp_accounts = []
        self.authenticate()
        self.create_test_smtp_account()
    
    def authenticate(self):
        """Authenticate user"""
        user_data = {
            "email": f"campaign_load_{random.randint(1000, 9999)}@example.com",
            "password": "LoadTest123!",
            "username": f"campaignload_{random.randint(1000, 9999)}"
        }
        
        self.client.post("/api/v1/auth/register", json=user_data)
        
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        response = self.client.post("/api/v1/auth/login", json=login_data)
        
        if response.status_code == 200:
            self.auth_token = response.json().get("access_token")
    
    def create_test_smtp_account(self):
        """Create SMTP account for campaigns"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        smtp_data = {
            "email": f"campaign_smtp_{random.randint(1000, 9999)}@example.com",
            "host": "smtp.example.com",
            "port": 587,
            "username": f"campaign_smtp_{random.randint(1000, 9999)}@example.com",
            "password": "smtp_password",
            "use_tls": True
        }
        
        response = self.client.post("/api/v1/smtp/accounts", 
                                  json=smtp_data, headers=headers)
        if response.status_code in [200, 201]:
            try:
                data = response.json()
                account_id = data.get("id") or data.get("data", {}).get("id")
                if account_id:
                    self.smtp_accounts.append({"id": account_id})
            except json.JSONDecodeError:
                pass
    
    @task(4)
    def list_campaigns(self):
        """List campaigns - frequent operation"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get("/api/v1/campaigns", 
                           headers=headers, 
                           catch_response=True) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, dict) and "data" in data:
                        self.campaigns = data["data"]
                    elif isinstance(data, list):
                        self.campaigns = data
                    response.success()
                except json.JSONDecodeError:
                    response.failure("Invalid JSON response")
            else:
                response.failure(f"List campaigns failed: {response.status_code}")
    
    @task(2)
    def create_campaign(self):
        """Create campaign"""
        if not self.auth_token or not self.smtp_accounts:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        campaign_data = {
            "name": f"Load Test Campaign {random.randint(1000, 9999)}",
            "subject": f"Load Test Subject {random.randint(1, 100)}",
            "content": f"Load test content {random.randint(1, 1000)}",
            "smtp_account_id": self.smtp_accounts[0]["id"]
        }
        
        with self.client.post("/api/v1/campaigns", 
                            json=campaign_data, 
                            headers=headers, 
                            catch_response=True) as response:
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    campaign_id = data.get("id") or data.get("data", {}).get("id")
                    if campaign_id:
                        self.campaigns.append({"id": campaign_id})
                    response.success()
                except json.JSONDecodeError:
                    response.failure("Invalid JSON response")
            else:
                response.failure(f"Create campaign failed: {response.status_code}")
    
    @task(1)
    def get_campaign_analytics(self):
        """Get campaign analytics"""
        if not self.auth_token or not self.campaigns:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        campaign = random.choice(self.campaigns)
        campaign_id = campaign.get("id")
        
        if campaign_id:
            with self.client.get(f"/api/v1/campaigns/{campaign_id}/analytics", 
                               headers=headers, 
                               catch_response=True) as response:
                if response.status_code in [200, 404]:  # 404 if not implemented
                    response.success()
                else:
                    response.failure(f"Get analytics failed: {response.status_code}")


class HealthCheckTasks(TaskSet):
    """Health check and monitoring load testing"""
    
    @task(10)
    def health_check(self):
        """Basic health check - very frequent"""
        with self.client.get("/api/v1/health/live", 
                           catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Health check failed: {response.status_code}")
    
    @task(5)
    def system_status(self):
        """System status check"""
        with self.client.get("/api/v1/system/status", 
                           catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"System status failed: {response.status_code}")


class MailerSuiteUser(HttpUser):
    """Main user class for load testing"""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    weight = 1
    
    tasks = {
        AuthenticationTasks: 3,
        SMTPManagementTasks: 2,
        CampaignManagementTasks: 2,
        HealthCheckTasks: 5
    }
    
    def on_start(self):
        """Called when a user starts"""
        logger.info(f"Starting user from {self.host}")
    
    def on_stop(self):
        """Called when a user stops"""
        logger.info("Stopping user")


class HighVolumeUser(HttpUser):
    """High-volume user for stress testing"""
    
    wait_time = between(0.1, 0.5)  # Very short wait times
    weight = 1
    
    tasks = {
        HealthCheckTasks: 8,
        AuthenticationTasks: 2
    }


class AdminUser(HttpUser):
    """Admin user with full access"""
    
    wait_time = between(2, 5)
    weight = 1
    
    def on_start(self):
        """Login as admin user"""
        admin_data = {"email": "admin@sgpt.dev", "password": "admin123"}
        response = self.client.post("/api/v1/auth/login", json=admin_data)
        if response.status_code == 200:
            self.auth_token = response.json().get("access_token")
        else:
            self.auth_token = None
    
    @task(1)
    def admin_dashboard(self):
        """Access admin dashboard"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get("/api/v1/admin/dashboard", 
                           headers=headers, 
                           catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"Admin dashboard failed: {response.status_code}")
    
    @task(1)
    def system_metrics(self):
        """Get system metrics"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        with self.client.get("/api/v1/metrics/system", 
                           headers=headers, 
                           catch_response=True) as response:
            if response.status_code in [200, 404]:
                response.success()
            else:
                response.failure(f"System metrics failed: {response.status_code}")


# Event handlers for custom reporting
@events.request.add_listener
def request_handler(request_type, name, response_time, response_length, exception, context, **kwargs):
    """Custom request handler for detailed logging"""
    if exception:
        logger.error(f"Request failed: {request_type} {name} - {exception}")
    elif response_time > 5000:  # Log slow requests (>5s)
        logger.warning(f"Slow request: {request_type} {name} - {response_time}ms")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts"""
    logger.info("Load test starting...")
    logger.info(f"Target URL: {environment.host}")
    
    if isinstance(environment.runner, MasterRunner):
        logger.info("Running in master mode")
    elif isinstance(environment.runner, WorkerRunner):
        logger.info("Running in worker mode")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops"""
    logger.info("Load test completed")
    
    # Log summary statistics
    stats = environment.stats
    logger.info(f"Total requests: {stats.total.num_requests}")
    logger.info(f"Total failures: {stats.total.num_failures}")
    logger.info(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    logger.info(f"Median response time: {stats.total.median_response_time}ms")
    logger.info(f"90th percentile: {stats.total.get_response_time_percentile(0.9)}ms")
    logger.info(f"95th percentile: {stats.total.get_response_time_percentile(0.95)}ms")
    logger.info(f"99th percentile: {stats.total.get_response_time_percentile(0.99)}ms")


# Custom scenarios for different load patterns
class BurstTrafficUser(HttpUser):
    """Simulates burst traffic patterns"""
    
    wait_time = between(0.1, 10)  # Variable wait times
    weight = 1
    
    def on_start(self):
        """Randomly choose burst or idle behavior"""
        self.is_burst_mode = random.choice([True, False])
        self.burst_duration = random.randint(10, 30)  # seconds
        self.burst_start = time.time()
    
    tasks = {HealthCheckTasks: 1}
    
    def wait(self):
        """Custom wait logic for burst patterns"""
        current_time = time.time()
        if self.is_burst_mode and (current_time - self.burst_start) < self.burst_duration:
            # In burst mode - minimal wait
            return random.uniform(0.1, 0.3)
        else:
            # Normal mode - longer wait
            return random.uniform(3, 8)


class EmailSendingUser(HttpUser):
    """Simulates email sending workload"""
    
    wait_time = between(5, 15)  # Realistic email sending intervals
    weight = 1
    
    def on_start(self):
        """Setup for email sending simulation"""
        self.auth_token = None
        self.smtp_account_id = None
        self.authenticate()
        self.setup_smtp()
    
    def authenticate(self):
        """Authenticate user"""
        user_data = {
            "email": f"email_sender_{random.randint(1000, 9999)}@example.com",
            "password": "LoadTest123!",
            "username": f"emailsender_{random.randint(1000, 9999)}"
        }
        
        self.client.post("/api/v1/auth/register", json=user_data)
        
        login_data = {"email": user_data["email"], "password": user_data["password"]}
        response = self.client.post("/api/v1/auth/login", json=login_data)
        
        if response.status_code == 200:
            self.auth_token = response.json().get("access_token")
    
    def setup_smtp(self):
        """Setup SMTP account for sending"""
        if not self.auth_token:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        smtp_data = {
            "email": f"sender_{random.randint(1000, 9999)}@example.com",
            "host": "smtp.example.com",
            "port": 587,
            "username": f"sender_{random.randint(1000, 9999)}@example.com",
            "password": "smtp_password",
            "use_tls": True
        }
        
        response = self.client.post("/api/v1/smtp/accounts", 
                                  json=smtp_data, headers=headers)
        if response.status_code in [200, 201]:
            try:
                data = response.json()
                self.smtp_account_id = data.get("id") or data.get("data", {}).get("id")
            except json.JSONDecodeError:
                pass
    
    @task(1)
    def send_test_email(self):
        """Send a test email"""
        if not self.auth_token or not self.smtp_account_id:
            return
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        email_data = {
            "to_email": f"recipient_{random.randint(1, 1000)}@example.com",
            "subject": f"Load Test Email {random.randint(1, 10000)}",
            "content": f"This is a load test email sent at {time.time()}",
            "smtp_account_id": self.smtp_account_id
        }
        
        with self.client.post("/api/v1/smtp/send", 
                            json=email_data, 
                            headers=headers, 
                            catch_response=True) as response:
            if response.status_code in [200, 201, 400, 503]:  # 400/503 expected for test
                response.success()
            else:
                response.failure(f"Send email failed: {response.status_code}")


# Usage examples:
"""
# Run basic load test:
locust -f load_test.py --host=http://localhost:8000

# Run with specific user count and spawn rate:
locust -f load_test.py --host=http://localhost:8000 -u 100 -r 10

# Run headless (no web UI):
locust -f load_test.py --host=http://localhost:8000 -u 50 -r 5 --headless -t 300s

# Run high-volume stress test:
locust -f load_test.py --host=http://localhost:8000 -u 500 -r 20 --headless -t 600s

# Run distributed test (master):
locust -f load_test.py --master --host=http://localhost:8000

# Run distributed test (worker):
locust -f load_test.py --worker --master-host=localhost
"""