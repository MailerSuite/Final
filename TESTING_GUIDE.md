# MailerSuite2 Testing Guide

This guide provides comprehensive information about testing the MailerSuite2 platform, including unit tests, integration tests, performance testing, and security auditing.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Performance Testing](#performance-testing)
6. [Security Auditing](#security-auditing)
7. [Test Automation](#test-automation)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend tests)
- Virtual environment activated
- MailerSuite2 backend running (for integration/performance/security tests)

### Install Testing Dependencies

```bash
# Backend testing dependencies
cd backend
pip install -r requirements-testing.txt

# Frontend testing dependencies
cd ../frontend
npm install
```

### Run All Tests

```bash
# Run comprehensive test suite
./scripts/run_all_tests.sh

# Run with performance and security tests
./scripts/run_all_tests.sh --performance --security

# Run only unit tests
./scripts/run_all_tests.sh --unit-only
```

## Test Structure

```
backend/
├── tests/
│   ├── conftest.py                    # Test configuration and fixtures
│   ├── unit/                          # Unit tests
│   │   ├── test_smtp_service.py       # SMTP service tests
│   │   ├── test_campaign_service.py   # Campaign service tests
│   │   └── ...
│   ├── integration/                   # Integration tests
│   │   ├── test_api_flows.py          # End-to-end API flows
│   │   ├── test_auth_endpoints.py     # Authentication endpoints
│   │   └── ...
│   ├── performance/                   # Performance tests
│   │   └── load_test.py               # Locust load testing
│   └── security/                      # Security tests
│       └── security_audit.py          # Automated security audit
├── requirements-testing.txt           # Testing dependencies
└── test_reports/                     # Generated test reports

frontend/
├── tests/                            # Playwright E2E tests
│   ├── comprehensive-ui.spec.ts     # UI flow tests
│   ├── error-handling.spec.ts       # Error handling tests
│   └── ...
└── src/
    └── tests/                        # Frontend unit tests
```

## Unit Testing

Unit tests focus on testing individual components in isolation using mocking and fixtures.

### Running Unit Tests

```bash
cd backend

# Run all unit tests
pytest tests/unit/ -v

# Run with coverage
pytest tests/unit/ -v --cov=services --cov=routers --cov-report=html

# Run specific test file
pytest tests/unit/test_smtp_service.py -v

# Run specific test method
pytest tests/unit/test_smtp_service.py::TestSMTPService::test_send_email_success -v
```

### Writing Unit Tests

Example unit test structure:

```python
import pytest
from unittest.mock import Mock, AsyncMock, patch
from services.smtp_service import SMTPService

class TestSMTPService:
    @pytest.fixture
    def mock_db_session(self):
        return AsyncMock()

    @pytest.fixture
    def smtp_service(self, mock_db_session):
        return SMTPService(mock_db_session)

    @pytest.mark.asyncio
    async def test_send_email_success(self, smtp_service, mock_smtp_account):
        # Arrange
        with patch('aiosmtplib.SMTP') as mock_smtp:
            mock_smtp_instance = AsyncMock()
            mock_smtp.return_value = mock_smtp_instance
            
            # Act
            result = await smtp_service.send_email(
                smtp_account=mock_smtp_account,
                to_email="test@example.com",
                subject="Test",
                content="Test content",
                user_id="test-user"
            )
            
            # Assert
            assert result["success"] is True
            mock_smtp_instance.send_message.assert_called_once()
```

### Key Testing Patterns

- **Mocking**: Use `unittest.mock` for external dependencies
- **Fixtures**: Use pytest fixtures for reusable test data
- **Async Testing**: Use `@pytest.mark.asyncio` for async functions
- **Error Testing**: Test both success and failure scenarios
- **Edge Cases**: Test boundary conditions and edge cases

## Integration Testing

Integration tests verify that multiple components work together correctly.

### Running Integration Tests

```bash
cd backend

# Run all integration tests
pytest tests/integration/ -v

# Run API flow tests
pytest tests/integration/test_api_flows.py -v

# Run with HTML report
pytest tests/integration/ -v --html=reports/integration.html
```

### Test Scenarios

Integration tests cover complete user workflows:

- **Authentication Flow**: Registration → Login → Token refresh → Logout
- **SMTP Management**: Create account → Validate → Test → Delete
- **Campaign Lifecycle**: Create → Update → Start → Monitor → Stop
- **Error Handling**: Invalid inputs, unauthorized access, rate limiting

### Frontend Integration Tests

```bash
cd frontend

# Run Playwright tests
npm run test

# Run with specific browser
npm run test -- --project=chromium

# Run in headed mode
npm run test -- --headed
```

## Performance Testing

Performance testing uses Locust to simulate high-volume scenarios.

### Running Performance Tests

```bash
# Ensure backend is running
cd backend
python main.py &

# Run load test
locust -f tests/performance/load_test.py --host=http://localhost:8000

# Run headless load test
locust -f tests/performance/load_test.py \
  --host=http://localhost:8000 \
  -u 100 -r 10 \
  --headless -t 300s \
  --html reports/load_test.html
```

### Test Scenarios

- **Normal Load**: 50 users, realistic usage patterns
- **High Load**: 200+ users, stress testing
- **Burst Traffic**: Variable load patterns
- **Email Sending**: Simulated email campaigns
- **API Endpoints**: Authentication, SMTP, campaigns

### Performance Metrics

Monitor these key metrics:

- **Response Time**: Average, median, 95th percentile
- **Throughput**: Requests per second
- **Error Rate**: Failed requests percentage
- **Resource Usage**: CPU, memory, database connections

### Load Test Configuration

```python
# Custom user behavior
class MailerSuiteUser(HttpUser):
    wait_time = between(1, 3)
    
    tasks = {
        AuthenticationTasks: 3,
        SMTPManagementTasks: 2,
        CampaignManagementTasks: 2,
        HealthCheckTasks: 5
    }
```

## Security Auditing

Automated security testing identifies vulnerabilities and misconfigurations.

### Running Security Audit

```bash
cd backend

# Run comprehensive security audit
python tests/security/security_audit.py \
  --target http://localhost:8000 \
  --output security_reports

# Run static security analysis
bandit -r . -f json -o reports/bandit.json
safety check --json --output reports/safety.json
```

### Security Test Categories

1. **Authentication Security**
   - Weak password acceptance
   - Brute force protection
   - Default credentials

2. **Authorization Bypass**
   - Unprotected endpoints
   - JWT token manipulation
   - Privilege escalation

3. **Input Validation**
   - SQL injection
   - XSS vulnerabilities
   - Command injection

4. **API Security**
   - Version bypass
   - Method override
   - Documentation exposure

5. **Configuration Security**
   - HTTPS enforcement
   - Security headers
   - Information disclosure

### Security Report

The security audit generates comprehensive reports:

- **HTML Report**: Visual dashboard with color-coded results
- **JSON Report**: Machine-readable results for CI/CD
- **Console Output**: Real-time progress and summary

## Test Automation

### Automated Test Script

Use the comprehensive test automation script:

```bash
# Run all tests
./scripts/run_all_tests.sh

# Available options
./scripts/run_all_tests.sh --help

# Common usage patterns
./scripts/run_all_tests.sh --unit-only
./scripts/run_all_tests.sh --integration-only
./scripts/run_all_tests.sh --performance --security
./scripts/run_all_tests.sh --no-frontend --target http://staging.example.com
```

### Test Reports

Generated reports include:

- **Test Summary**: HTML dashboard with all results
- **Code Coverage**: Line and branch coverage analysis
- **Unit Test Results**: Detailed test execution report
- **Integration Test Results**: API flow test results
- **Load Test Report**: Performance metrics and graphs
- **Security Audit**: Vulnerability assessment
- **Code Quality**: Linting and type checking results

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements-testing.txt
    
    - name: Run unit tests
      run: |
        cd backend
        pytest tests/unit/ --cov --cov-report=xml
    
    - name: Run integration tests
      run: |
        cd backend
        pytest tests/integration/
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh './scripts/run_all_tests.sh --unit-only'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh './scripts/run_all_tests.sh --integration-only'
                    }
                }
                stage('Security Audit') {
                    steps {
                        sh './scripts/run_all_tests.sh --security'
                    }
                }
            }
        }
        
        stage('Performance Test') {
            when { branch 'main' }
            steps {
                sh './scripts/run_all_tests.sh --performance'
            }
        }
    }
    
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'backend/test_reports',
                reportFiles: 'test_summary_*.html',
                reportName: 'Test Report'
            ])
        }
    }
}
```

## Best Practices

### General Testing

1. **Write Tests First**: Follow TDD when possible
2. **Test Behavior**: Focus on what the code does, not how
3. **Keep Tests Simple**: One assertion per test when possible
4. **Use Descriptive Names**: Test names should explain the scenario
5. **Isolate Tests**: Each test should be independent
6. **Mock External Dependencies**: Don't rely on external services
7. **Test Edge Cases**: Include boundary conditions and error scenarios

### Unit Testing

1. **High Coverage**: Aim for >90% code coverage
2. **Fast Execution**: Unit tests should run quickly
3. **Deterministic**: Tests should produce consistent results
4. **Mock Heavy**: Mock all external dependencies
5. **Test Private Logic**: Test through public interfaces

### Integration Testing

1. **Real Components**: Use actual implementations when possible
2. **Test Contracts**: Verify API contracts and data formats
3. **Environment Isolation**: Use test databases and services
4. **Cleanup**: Reset state between tests
5. **End-to-End Flows**: Test complete user journeys

### Performance Testing

1. **Realistic Load**: Model actual user behavior
2. **Gradual Ramp-up**: Increase load gradually
3. **Monitor Resources**: Track CPU, memory, database
4. **Set Baselines**: Establish performance benchmarks
5. **Regular Testing**: Run performance tests regularly

### Security Testing

1. **Shift Left**: Include security tests early
2. **Comprehensive Coverage**: Test all attack vectors
3. **Regular Updates**: Keep security tests current
4. **False Positive Management**: Validate findings
5. **Remediation Tracking**: Track security improvements

### Continuous Improvement

1. **Review Test Failures**: Analyze and learn from failures
2. **Update Tests**: Keep tests current with code changes
3. **Performance Monitoring**: Track test execution times
4. **Coverage Analysis**: Identify untested code paths
5. **Tool Evaluation**: Regularly evaluate testing tools

## Troubleshooting

### Common Issues

1. **Test Database**: Ensure test database is properly configured
2. **Port Conflicts**: Check for port conflicts in test environment
3. **Dependency Issues**: Verify all test dependencies are installed
4. **Environment Variables**: Set required environment variables
5. **Permissions**: Ensure proper file and directory permissions

### Debug Mode

```bash
# Run tests with verbose output
pytest tests/unit/ -v -s

# Run specific test with debugging
pytest tests/unit/test_smtp_service.py::test_method -v -s --pdb

# Show test coverage gaps
pytest tests/unit/ --cov --cov-report=term-missing
```

### Performance Debugging

```bash
# Profile test execution
pytest tests/unit/ --profile

# Memory usage analysis
pytest tests/unit/ --memray

# Database query analysis
pytest tests/integration/ --sql-log
```

## Conclusion

Comprehensive testing is essential for maintaining the quality and security of MailerSuite2. This guide provides the foundation for implementing effective testing practices across all aspects of the platform.

Regular testing helps ensure:
- **Code Quality**: High-quality, maintainable code
- **Reliability**: Consistent system behavior
- **Performance**: Optimal system performance
- **Security**: Protection against vulnerabilities
- **Confidence**: Safe deployment and updates

For questions or improvements to this testing guide, please refer to the project documentation or contact the development team.