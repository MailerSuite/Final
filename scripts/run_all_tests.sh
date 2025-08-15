#!/bin/bash

# MailerSuite2 Comprehensive Testing Suite
# Runs all tests: unit, integration, performance, and security

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"
REPORTS_DIR="$BACKEND_DIR/test_reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Default settings
RUN_UNIT=true
RUN_INTEGRATION=true
RUN_PERFORMANCE=false
RUN_SECURITY=false
RUN_FRONTEND=true
PERFORMANCE_USERS=50
PERFORMANCE_DURATION=300
TARGET_URL="http://localhost:8000"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --unit-only)
      RUN_UNIT=true
      RUN_INTEGRATION=false
      RUN_PERFORMANCE=false
      RUN_SECURITY=false
      RUN_FRONTEND=false
      shift
      ;;
    --integration-only)
      RUN_UNIT=false
      RUN_INTEGRATION=true
      RUN_PERFORMANCE=false
      RUN_SECURITY=false
      RUN_FRONTEND=false
      shift
      ;;
    --performance)
      RUN_PERFORMANCE=true
      shift
      ;;
    --security)
      RUN_SECURITY=true
      shift
      ;;
    --no-frontend)
      RUN_FRONTEND=false
      shift
      ;;
    --performance-users)
      PERFORMANCE_USERS="$2"
      shift
      shift
      ;;
    --performance-duration)
      PERFORMANCE_DURATION="$2"
      shift
      shift
      ;;
    --target)
      TARGET_URL="$2"
      shift
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --unit-only           Run only unit tests"
      echo "  --integration-only    Run only integration tests"
      echo "  --performance         Include performance tests"
      echo "  --security            Include security audit"
      echo "  --no-frontend         Skip frontend tests"
      echo "  --performance-users   Number of users for load test (default: 50)"
      echo "  --performance-duration Duration in seconds (default: 300)"
      echo "  --target              Target URL for tests (default: http://localhost:8000)"
      echo "  --help                Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Create reports directory
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  MailerSuite2 Comprehensive Test Suite  ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Backend Directory: $BACKEND_DIR"
echo "  Frontend Directory: $FRONTEND_DIR"
echo "  Reports Directory: $REPORTS_DIR"
echo "  Target URL: $TARGET_URL"
echo "  Timestamp: $TIMESTAMP"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Initialize test summary
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local optional="${3:-false}"
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        print_success "$test_name completed successfully"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✓ $test_name")
    else
        if [ "$optional" = "true" ]; then
            print_warning "$test_name failed (optional)"
            TEST_RESULTS+=("⚠ $test_name (optional)")
        else
            print_error "$test_name failed"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            TEST_RESULTS+=("✗ $test_name")
        fi
    fi
    echo ""
}

# Check prerequisites
print_section "Checking Prerequisites"

cd "$BACKEND_DIR"

# Check Python environment
if ! command_exists python3; then
    print_error "Python 3 is required but not installed"
    exit 1
fi

print_success "Python 3 found: $(python3 --version)"

# Check if virtual environment is activated
if [[ -z "${VIRTUAL_ENV}" ]]; then
    print_warning "No virtual environment detected. Consider using venv."
else
    print_success "Virtual environment active: $VIRTUAL_ENV"
fi

# Install test dependencies
print_section "Installing Test Dependencies"

run_test "Installing test requirements" \
    "pip install -r requirements-testing.txt > /dev/null 2>&1" \
    true

# Backend Unit Tests
if [ "$RUN_UNIT" = true ]; then
    print_section "Backend Unit Tests"
    
    run_test "Running unit tests with coverage" \
        "pytest tests/unit/ -v --cov=services --cov=routers --cov-report=html:$REPORTS_DIR/coverage_html_$TIMESTAMP --cov-report=json:$REPORTS_DIR/coverage_$TIMESTAMP.json --html=$REPORTS_DIR/unit_tests_$TIMESTAMP.html --self-contained-html"
fi

# Backend Integration Tests
if [ "$RUN_INTEGRATION" = true ]; then
    print_section "Backend Integration Tests"
    
    run_test "Running integration tests" \
        "pytest tests/integration/ -v --html=$REPORTS_DIR/integration_tests_$TIMESTAMP.html --self-contained-html"
    
    run_test "Running API flow tests" \
        "pytest tests/integration/test_api_flows.py -v --html=$REPORTS_DIR/api_flows_$TIMESTAMP.html --self-contained-html"
fi

# Frontend Tests
if [ "$RUN_FRONTEND" = true ]; then
    print_section "Frontend Tests"
    
    cd "$FRONTEND_DIR"
    
    # Check Node.js
    if command_exists node && command_exists npm; then
        print_success "Node.js found: $(node --version)"
        print_success "npm found: $(npm --version)"
        
        run_test "Installing frontend dependencies" \
            "npm ci > /dev/null 2>&1" \
            true
        
        run_test "Running frontend unit tests" \
            "npm run test:unit" \
            true
        
        run_test "Running Playwright tests" \
            "npm run test" \
            true
    else
        print_warning "Node.js/npm not found. Skipping frontend tests."
    fi
    
    cd "$BACKEND_DIR"
fi

# Performance Tests
if [ "$RUN_PERFORMANCE" = true ]; then
    print_section "Performance Tests"
    
    # Check if target is reachable
    if curl -f -s "$TARGET_URL/api/v1/health/live" > /dev/null 2>&1; then
        print_success "Target server is reachable"
        
        run_test "Running load tests (${PERFORMANCE_USERS} users, ${PERFORMANCE_DURATION}s)" \
            "locust -f tests/performance/load_test.py --host=$TARGET_URL -u $PERFORMANCE_USERS -r 10 --headless -t ${PERFORMANCE_DURATION}s --html $REPORTS_DIR/load_test_$TIMESTAMP.html" \
            true
    else
        print_warning "Target server not reachable. Skipping performance tests."
        print_warning "Make sure the server is running at $TARGET_URL"
    fi
fi

# Security Audit
if [ "$RUN_SECURITY" = true ]; then
    print_section "Security Audit"
    
    # Check if target is reachable
    if curl -f -s "$TARGET_URL/api/v1/health/live" > /dev/null 2>&1 || curl -f -s "$TARGET_URL/" > /dev/null 2>&1; then
        print_success "Target server is reachable for security testing"
        
        run_test "Running security audit" \
            "python tests/security/security_audit.py --target $TARGET_URL --output $REPORTS_DIR/security_$TIMESTAMP" \
            true
        
        # Run static security analysis
        run_test "Running bandit security linter" \
            "bandit -r . -f json -o $REPORTS_DIR/bandit_$TIMESTAMP.json" \
            true
        
        run_test "Running safety dependency scan" \
            "safety check --json --output $REPORTS_DIR/safety_$TIMESTAMP.json" \
            true
    else
        print_warning "Target server not reachable. Skipping security audit."
        print_warning "Make sure the server is running at $TARGET_URL"
    fi
fi

# Code Quality Checks
print_section "Code Quality Checks"

run_test "Running Black code formatter check" \
    "black --check --diff ." \
    true

run_test "Running isort import sorting check" \
    "isort --check-only --diff ." \
    true

run_test "Running flake8 linter" \
    "flake8 . --format=json --output-file=$REPORTS_DIR/flake8_$TIMESTAMP.json" \
    true

run_test "Running mypy type checking" \
    "mypy . --ignore-missing-imports --json-report $REPORTS_DIR/mypy_$TIMESTAMP" \
    true

# Generate Test Summary Report
print_section "Generating Test Summary Report"

SUMMARY_FILE="$REPORTS_DIR/test_summary_$TIMESTAMP.html"

cat > "$SUMMARY_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Test Summary Report - $TIMESTAMP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .passed { color: #4caf50; }
        .failed { color: #f44336; }
        .warning { color: #ff9800; }
        .result-item { margin: 5px 0; padding: 5px; border-left: 3px solid #ddd; }
        .result-passed { border-left-color: #4caf50; }
        .result-failed { border-left-color: #f44336; }
        .result-warning { border-left-color: #ff9800; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MailerSuite2 Test Summary Report</h1>
        <p><strong>Timestamp:</strong> $TIMESTAMP</p>
        <p><strong>Target:</strong> $TARGET_URL</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> $TOTAL_TESTS</p>
        <p class="passed"><strong>Passed:</strong> $PASSED_TESTS</p>
        <p class="failed"><strong>Failed:</strong> $FAILED_TESTS</p>
        <p><strong>Success Rate:</strong> $(( TOTAL_TESTS > 0 ? (PASSED_TESTS * 100) / TOTAL_TESTS : 0 ))%</p>
    </div>
    
    <h2>Test Results</h2>
EOF

for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == ✓* ]]; then
        echo "    <div class=\"result-item result-passed\">$result</div>" >> "$SUMMARY_FILE"
    elif [[ $result == ⚠* ]]; then
        echo "    <div class=\"result-item result-warning\">$result</div>" >> "$SUMMARY_FILE"
    else
        echo "    <div class=\"result-item result-failed\">$result</div>" >> "$SUMMARY_FILE"
    fi
done

cat >> "$SUMMARY_FILE" << EOF
    
    <h2>Available Reports</h2>
    <ul>
        <li><a href="coverage_html_$TIMESTAMP/index.html">Code Coverage Report</a></li>
        <li><a href="unit_tests_$TIMESTAMP.html">Unit Test Results</a></li>
        <li><a href="integration_tests_$TIMESTAMP.html">Integration Test Results</a></li>
EOF

if [ "$RUN_PERFORMANCE" = true ]; then
    echo "        <li><a href=\"load_test_$TIMESTAMP.html\">Load Test Report</a></li>" >> "$SUMMARY_FILE"
fi

if [ "$RUN_SECURITY" = true ]; then
    echo "        <li><a href=\"security_$TIMESTAMP/security_audit_*.html\">Security Audit Report</a></li>" >> "$SUMMARY_FILE"
fi

cat >> "$SUMMARY_FILE" << EOF
    </ul>
</body>
</html>
EOF

print_success "Test summary report generated: $SUMMARY_FILE"

# Final Summary
print_section "Test Execution Summary"

echo -e "${YELLOW}Test Results:${NC}"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done

echo ""
echo -e "${YELLOW}Statistics:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo -e "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "  Failed: ${RED}$FAILED_TESTS${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo "  Success Rate: ${SUCCESS_RATE}%"
fi

echo ""
echo -e "${YELLOW}Reports saved to: ${BLUE}$REPORTS_DIR${NC}"

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    echo ""
    print_error "Some tests failed. Check the reports for details."
    exit 1
else
    echo ""
    print_success "All tests completed successfully!"
    exit 0
fi