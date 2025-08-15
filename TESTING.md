# Testing Documentation

This document provides comprehensive information about the testing setup for the Final project, including unit tests, integration tests, and end-to-end (e2e) tests.

## 🧪 Test Overview

The project includes multiple types of tests:

- **Frontend Unit Tests**: Using Vitest for React component testing
- **Frontend E2E Tests**: Using Playwright for browser automation
- **Backend Tests**: Using pytest for API and database testing
- **Integration Tests**: Testing the full stack integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git

### Running All Tests

```bash
# Make the test runner executable
chmod +x run-tests.sh

# Run all tests
./run-tests.sh

# Or run specific test types
./run-tests.sh frontend      # Frontend tests only
./run-tests.sh backend       # Backend tests only
./run-tests.sh integration   # Integration tests only
./run-tests.sh --help        # Show all options
```

## 📱 Frontend Testing

### Unit Tests (Vitest)

```bash
cd frontend

# Run unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run specific test file
npm run test:unit -- --run path/to/test.spec.ts
```

### E2E Tests (Playwright)

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run all e2e tests
npm run test:e2e

# Run specific e2e test file
npm run test:e2e -- tests/e2e/auth-workflow.spec.ts

# Run tests with UI
npm run test:e2e -- --ui

# Run tests in headed mode
npm run test:e2e -- --headed
```

### Available E2E Test Suites

1. **Authentication Workflow** (`auth-workflow.spec.ts`)
   - User registration
   - User login
   - Password reset
   - Error handling
   - Protected route access
   - Logout flow

2. **Campaign Management** (`campaign-workflow.spec.ts`)
   - Campaign creation
   - Template selection
   - Contact list management
   - Campaign scheduling
   - Analytics and reporting
   - Campaign editing

3. **Admin Management** (`admin-workflow.spec.ts`)
   - Admin dashboard access
   - User management
   - Campaign management
   - Analytics and reporting
   - System settings
   - Email configuration
   - User permissions

### Playwright Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- Multiple browser projects (Chrome, Firefox, Safari)
- Mobile device testing
- E2E specific project with longer timeouts
- Global setup and teardown
- Screenshot and video capture on failure
- HTML and JUnit reporting

## 🔧 Backend Testing

### Running Backend Tests

```bash
cd backend

# Create virtual environment (first time only)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run all tests
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/e2e/test_api_integration.py -v

# Run tests with coverage
python -m pytest tests/ --cov=app --cov-report=html
```

### Available Backend Test Suites

1. **API Integration Tests** (`test_api_integration.py`)
   - Health check endpoints
   - User authentication flow
   - Campaign management API
   - Contact management API
   - Template management API
   - Analytics endpoints
   - Error handling
   - Rate limiting
   - Concurrent requests
   - Data consistency

2. **Database Integration Tests** (`test_database_integration.py`)
   - Database connection
   - CRUD operations for all models
   - Database relationships
   - Constraints and validation
   - Transaction handling
   - Performance testing
   - Bulk operations

3. **Email Workflow Tests** (`test_email_workflow.py`)
   - SMTP connection testing
   - Email composition
   - Template rendering
   - Campaign email sending
   - Bulk email operations
   - Email tracking and analytics
   - Email validation
   - Scheduling and queuing
   - Error handling
   - Compliance and spam prevention

## 🔗 Integration Testing

Integration tests verify that the frontend and backend work together correctly.

```bash
# Run integration tests (requires both services running)
./run-tests.sh integration
```

## 📊 Test Reports

### Playwright Reports

After running Playwright tests, you can view detailed reports:

```bash
# Open HTML report
npx playwright show-report

# View test results
open test-results/html/index.html
```

### Pytest Reports

Pytest generates various report formats:

```bash
# HTML coverage report
open htmlcov/index.html

# JUnit XML report (for CI/CD)
cat test-results/results.xml
```

## 🛠️ Test Development

### Writing New Frontend Tests

1. **Unit Tests**: Create files in `frontend/tests/` with `.spec.ts` extension
2. **E2E Tests**: Create files in `frontend/tests/e2e/` with `.spec.ts` extension

Example unit test:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

Example e2e test:

```typescript
import { test, expect } from '@playwright/test';

test('My E2E Test', async ({ page }) => {
  await page.goto('/my-page');
  await expect(page.locator('h1')).toContainText('My Page');
});
```

### Writing New Backend Tests

Create test files in `backend/tests/` with `test_` prefix:

```python
import pytest
from app.models.user import User

def test_user_creation():
    user = User(email="test@example.com", name="Test User")
    assert user.email == "test@example.com"
    assert user.name == "Test User"
```

### Test Data Management

- Use factories or fixtures for test data
- Clean up test data after each test
- Use unique identifiers (timestamps, UUIDs) to avoid conflicts
- Mock external services when appropriate

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 4000 (frontend) and 8000 (backend) are available
2. **Browser installation**: Run `npx playwright install` if browsers aren't installed
3. **Dependencies**: Ensure all npm and pip dependencies are installed
4. **Database**: Ensure database is running and accessible

### Debug Mode

```bash
# Run tests with debug output
DEBUG=1 ./run-tests.sh

# Run Playwright tests in headed mode
npm run test:e2e -- --headed --debug

# Run pytest with verbose output
python -m pytest tests/ -v -s
```

### Test Isolation

- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/cleanup
- Avoid sharing state between tests
- Use unique test data for each test

## 📈 CI/CD Integration

### GitHub Actions

The tests can be integrated into CI/CD pipelines:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Run Tests
        run: ./run-tests.sh
```

### Docker Integration

Tests can also be run in Docker containers for consistent environments.

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Testing Library Documentation](https://testing-library.com/)

## 🤝 Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Include comprehensive test coverage
3. Add appropriate assertions and error handling
4. Update this documentation
5. Ensure tests pass in CI/CD

## 📞 Support

For testing-related issues:

1. Check the troubleshooting section above
2. Review test logs and reports
3. Ensure all dependencies are installed
4. Verify service configurations
5. Check for port conflicts

---

**Happy Testing! 🎯**
