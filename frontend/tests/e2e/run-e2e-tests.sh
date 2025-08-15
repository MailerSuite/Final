#!/bin/bash

# E2E Test Runner Script
# This script runs all end-to-end tests for the application

set -e

echo "🚀 Starting E2E Test Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=4000
BACKEND_PORT=8000
TEST_TIMEOUT=300000  # 5 minutes

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

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend E2E tests..."
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Run Playwright tests
    print_status "Running Playwright tests..."
    npm run test:e2e
    
    cd ..
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend E2E tests..."
    
    cd backend
    
    # Install dependencies if needed
    if [ ! -d ".venv" ]; then
        print_status "Creating virtual environment..."
        python -m venv .venv
    fi
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Install dependencies if needed
    if [ ! -f "requirements.txt" ] || [ ! -d ".venv/lib" ]; then
        print_status "Installing backend dependencies..."
        pip install -r requirements.txt || pip install pytest requests
    fi
    
    # Run pytest tests
    print_status "Running pytest E2E tests..."
    python -m pytest tests/e2e/ -v --tb=short
    
    # Deactivate virtual environment
    deactivate
    
    cd ..
}

# Function to run all tests
run_all_tests() {
    print_status "Running complete E2E test suite..."
    
    # Start services
    start_frontend
    start_backend
    
    # Wait a bit for services to stabilize
    sleep 5
    
    # Run tests
    run_frontend_tests
    run_backend_tests
    
    print_success "All E2E tests completed!"
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
        "frontend")
            print_status "Running frontend tests only..."
            start_frontend
            run_frontend_tests
            ;;
        "backend")
            print_status "Running backend tests only..."
            start_backend
            run_backend_tests
            ;;
        "all"|*)
            print_status "Running all E2E tests..."
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

# Run main function
main "$@"
