#!/bin/bash

# Comprehensive Test Runner for the Final Project
# This script runs all types of tests: unit, integration, and e2e

set -e

echo "🧪 Starting Comprehensive Test Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=4000
BACKEND_PORT=8000

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            print_success "$service_name is ready on port $port"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start on port $port after $max_attempts attempts"
    return 1
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend development server..."
    
    if check_port $FRONTEND_PORT; then
        print_warning "Frontend already running on port $FRONTEND_PORT"
        return 0
    fi
    
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    wait_for_service $FRONTEND_PORT "Frontend"
}

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    
    if check_port $BACKEND_PORT; then
        print_warning "Backend already running on port $BACKEND_PORT"
        return 0
    fi
    
    cd backend
    python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
    BACKEND_PID=$!
    cd ..
    
    wait_for_service $BACKEND_PORT "Backend"
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Frontend stopped"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend stopped"
    fi
}

# Function to run frontend unit tests
run_frontend_unit_tests() {
    print_header "Running Frontend Unit Tests"
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Run unit tests
    print_status "Running Vitest unit tests..."
    if npm run test:unit; then
        print_success "Frontend unit tests passed!"
    else
        print_error "Frontend unit tests failed!"
        return 1
    fi
    
    cd ..
}

# Function to run frontend e2e tests
run_frontend_e2e_tests() {
    print_header "Running Frontend E2E Tests"
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Install Playwright browsers if needed
    if [ ! -d "node_modules/.cache/playwright" ]; then
        print_status "Installing Playwright browsers..."
        npx playwright install
    fi
    
    # Run Playwright e2e tests
    print_status "Running Playwright e2e tests..."
    if npm run test:e2e; then
        print_success "Frontend e2e tests passed!"
    else
        print_error "Frontend e2e tests failed!"
        return 1
    fi
    
    cd ..
}

# Function to run backend tests
run_backend_tests() {
    print_header "Running Backend Tests"
    
    cd backend
    
    # Create virtual environment if needed
    if [ ! -d ".venv" ]; then
        print_status "Creating virtual environment..."
        python -m venv .venv
    fi
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Install dependencies if needed
    if [ ! -f "requirements.txt" ] || [ ! -d ".venv/lib" ]; then
        print_status "Installing backend dependencies..."
        pip install -r requirements.txt || pip install pytest requests pytest-asyncio
    fi
    
    # Run pytest tests
    print_status "Running pytest tests..."
    if python -m pytest tests/ -v --tb=short; then
        print_success "Backend tests passed!"
    else
        print_error "Backend tests failed!"
        return 1
    fi
    
    # Deactivate virtual environment
    deactivate
    
    cd ..
}

# Function to run integration tests
run_integration_tests() {
    print_header "Running Integration Tests"
    
    # Start services for integration testing
    start_frontend
    start_backend
    
    # Wait for services to stabilize
    sleep 5
    
    # Run integration tests
    cd backend
    source .venv/bin/activate
    
    print_status "Running integration tests..."
    if python -m pytest tests/integration/ -v --tb=short; then
        print_success "Integration tests passed!"
    else
        print_error "Integration tests failed!"
        return 1
    fi
    
    deactivate
    cd ..
    
    # Stop services
    stop_services
}

# Function to run all tests
run_all_tests() {
    print_header "Running Complete Test Suite"
    
    local exit_code=0
    
    # Run frontend unit tests
    if run_frontend_unit_tests; then
        print_success "✅ Frontend unit tests completed successfully"
    else
        print_error "❌ Frontend unit tests failed"
        exit_code=1
    fi
    
    # Run backend tests
    if run_backend_tests; then
        print_success "✅ Backend tests completed successfully"
    else
        print_error "❌ Backend tests failed"
        exit_code=1
    fi
    
    # Run integration tests
    if run_integration_tests; then
        print_success "✅ Integration tests completed successfully"
    else
        print_error "❌ Integration tests failed"
        exit_code=1
    fi
    
    # Run frontend e2e tests
    if run_frontend_e2e_tests; then
        print_success "✅ Frontend e2e tests completed successfully"
    else
        print_error "❌ Frontend e2e tests failed"
        exit_code=1
    fi
    
    # Print summary
    if [ $exit_code -eq 0 ]; then
        print_success "🎉 All tests passed successfully!"
    else
        print_error "💥 Some tests failed. Check the output above for details."
    fi
    
    return $exit_code
}

# Function to run specific test types
run_specific_tests() {
    case "$1" in
        "frontend-unit")
            run_frontend_unit_tests
            ;;
        "frontend-e2e")
            run_frontend_e2e_tests
            ;;
        "backend")
            run_backend_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "frontend")
            run_frontend_unit_tests && run_frontend_e2e_tests
            ;;
        *)
            print_error "Unknown test type: $1"
            print_status "Available options: frontend-unit, frontend-e2e, backend, integration, frontend, all"
            exit 1
            ;;
    esac
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    stop_services
    
    # Kill any remaining processes on test ports
    pkill -f "uvicorn.*$BACKEND_PORT" 2>/dev/null || true
    pkill -f "vite.*$FRONTEND_PORT" 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT INT TERM

# Main execution
main() {
    case "${1:-all}" in
        "frontend-unit")
            print_status "Running frontend unit tests only..."
            run_frontend_unit_tests
            ;;
        "frontend-e2e")
            print_status "Running frontend e2e tests only..."
            run_frontend_e2e_tests
            ;;
        "frontend")
            print_status "Running all frontend tests..."
            run_frontend_unit_tests && run_frontend_e2e_tests
            ;;
        "backend")
            print_status "Running backend tests only..."
            run_backend_tests
            ;;
        "integration")
            print_status "Running integration tests only..."
            run_integration_tests
            ;;
        "all"|*)
            print_status "Running all tests..."
            run_all_tests
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check prerequisites
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed"
    exit 1
fi

# Print usage if help is requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [test_type]"
    echo ""
    echo "Available test types:"
    echo "  all              - Run all tests (default)"
    echo "  frontend-unit    - Run only frontend unit tests"
    echo "  frontend-e2e     - Run only frontend e2e tests"
    echo "  frontend         - Run all frontend tests (unit + e2e)"
    echo "  backend          - Run only backend tests"
    echo "  integration      - Run only integration tests"
    echo ""
    echo "Examples:"
    echo "  $0               # Run all tests"
    echo "  $0 frontend      # Run all frontend tests"
    echo "  $0 backend       # Run only backend tests"
    echo "  $0 integration   # Run only integration tests"
    exit 0
fi

# Run main function
main "$@"
