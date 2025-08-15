#!/bin/bash

# ========================================
# 🛑 STOP DEVELOPMENT SERVERS
# ========================================
# Stops all development servers and cleans up
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDS_DIR="$PROJECT_ROOT/pids"

log_info "🛑 Stopping MailerSuite Development Servers..."

# ========================================
# 🔍 FIND AND STOP PROCESSES
# ========================================
log_info "🔍 Finding running processes..."

# Stop backend if PID file exists
if [ -f "$PIDS_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PIDS_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        log_info "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            log_warning "Backend still running, force killing..."
            kill -9 $BACKEND_PID
        fi
        
        log_success "Backend server stopped"
    else
        log_warning "Backend PID file exists but process not running"
    fi
    rm -f "$PIDS_DIR/backend.pid"
else
    log_info "No backend PID file found"
fi

# Stop frontend if PID file exists
if [ -f "$PIDS_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PIDS_DIR/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        log_info "Stopping frontend server (PID: $FRONT_PID)..."
        kill $FRONTEND_PID
        sleep 2
        
        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            log_warning "Frontend still running, force killing..."
            kill -9 $FRONTEND_PID
        fi
        
        log_success "Frontend server stopped"
    else
        log_warning "Frontend PID file exists but process not running"
    fi
    rm -f "$PIDS_DIR/frontend.pid"
else
    log_info "No frontend PID file found"
fi

# ========================================
# 🔍 KILL REMAINING PROCESSES
# ========================================
log_info "🔍 Checking for remaining processes..."

# Kill any remaining uvicorn processes
UVICORN_PIDS=$(pgrep -f "uvicorn.*app.main:app" || true)
if [ ! -z "$UVICORN_PIDS" ]; then
    log_info "Found remaining uvicorn processes, stopping..."
    echo $UVICORN_PIDS | xargs kill
    sleep 2
    echo $UVICORN_PIDS | xargs kill -9 2>/dev/null || true
    log_success "Uvicorn processes stopped"
fi

# Kill any remaining npm dev processes
NPM_PIDS=$(pgrep -f "npm.*run.*dev" || true)
if [ ! -z "$NPM_PIDS" ]; then
    log_info "Found remaining npm dev processes, stopping..."
    echo $NPM_PIDS | xargs kill
    sleep 2
    echo $NPM_PIDS | xargs kill -9 2>/dev/null || true
    log_success "NPM dev processes stopped"
fi

# Kill any remaining vite processes
VITE_PIDS=$(pgrep -f "vite" || true)
if [ ! -z "$VITE_PIDS" ]; then
    log_info "Found remaining vite processes, stopping..."
    echo $VITE_PIDS | xargs kill
    sleep 2
    echo $VITE_PIDS | xargs kill -9 2>/dev/null || true
    log_success "Vite processes stopped"
fi

# ========================================
# 🧹 CLEANUP
# ========================================
log_info "🧹 Cleaning up..."

# Remove PID files
rm -f "$PIDS_DIR"/*.pid

# Check if ports are still in use
log_info "🔍 Checking if ports are still in use..."

# Check port 8000 (backend)
if lsof -i :8000 > /dev/null 2>&1; then
    log_warning "Port 8000 is still in use. You may need to manually stop the process."
    lsof -i :8000
else
    log_success "Port 8000 is free"
fi

# Check port 4000 (frontend)
if lsof -i :4000 > /dev/null 2>&1; then
    log_warning "Port 4000 is still in use. You may need to manually stop the process."
    lsof -i :4000
else
    log_success "Port 4000 is free"
fi

# ========================================
# 📋 STOPPED SERVICES SUMMARY
# ========================================
log_success "🎉 All development servers stopped!"

echo ""
echo "📋 Stopped Services:"
echo "===================="
echo "🔧 Backend:  Port 8000"
echo "🌐 Frontend: Port 4000"
echo ""

echo "🔄 To restart development servers:"
echo "   ./scripts/deploy-dev.sh"
echo ""

echo "📚 For more information, see:"
echo "   README.md"
echo "   DEPLOYMENT.md"
echo ""

log_success "🛑 MailerSuite development environment stopped!"
