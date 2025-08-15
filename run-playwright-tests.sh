#!/bin/bash

# Playwright E2E Test Runner
# This script runs Playwright e2e tests with proper setup

set -e

echo "🎭 Starting Playwright E2E Tests..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check prerequisites
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is required but not installed"
    exit 1
fi

# Navigate to frontend directory
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

# Check if frontend is running
FRONTEND_PORT=4000
if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    print_status "Frontend already running on port $FRONTEND_PORT"
else
    print_status "Starting frontend development server..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    print_status "Waiting for frontend to be ready..."
    sleep 10
    
    # Check if frontend is responding
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
        print_success "Frontend is ready!"
    else
        print_error "Frontend failed to start"
        exit 1
    fi
fi

# Run Playwright tests
print_status "Running Playwright e2e tests..."
if npm run test:e2e; then
    print_success "🎉 All Playwright tests passed!"
    
    # Show test results
    if [ -d "test-results/html" ]; then
        print_status "Opening test report..."
        npx playwright show-report
    fi
else
    print_error "💥 Some Playwright tests failed!"
    exit 1
fi

# Cleanup
if [ ! -z "$FRONTEND_PID" ]; then
    print_status "Stopping frontend server..."
    kill $FRONTEND_PID 2>/dev/null || true
fi

print_success "Playwright test run completed!"
