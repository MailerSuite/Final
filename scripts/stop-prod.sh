#!/bin/bash

# ========================================
# 🛑 STOP PRODUCTION SERVERS
# ========================================
# Stops all production servers and cleans up PM2
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
PROD_DIR="$PROJECT_ROOT/production"

log_info "🛑 Stopping MailerSuite Production Servers..."

# ========================================
# 📊 STOP PM2 PROCESSES
# ========================================
log_info "📊 Stopping PM2 processes..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 is not installed. Cannot stop production servers."
    exit 1
fi

# Stop all PM2 processes
log_info "Stopping all PM2 processes..."
pm2 stop all 2>/dev/null || log_warning "No PM2 processes to stop"

# Delete all PM2 processes
log_info "Deleting all PM2 processes..."
pm2 delete all 2>/dev/null || log_warning "No PM2 processes to delete"

# Save PM2 configuration
pm2 save 2>/dev/null || log_warning "Could not save PM2 configuration"

log_success "PM2 processes stopped and cleaned up"

# ========================================
# 🔍 KILL REMAINING PROCESSES
# ========================================
log_info "🔍 Checking for remaining processes..."

# Kill any remaining gunicorn processes
GUNICORN_PIDS=$(pgrep -f "gunicorn.*app.main:app" || true)
if [ ! -z "$GUNICORN_PIDS" ]; then
    log_info "Found remaining gunicorn processes, stopping..."
    echo $GUNICORN_PIDS | xargs kill
    sleep 2
    echo $GUNICORN_PIDS | xargs kill -9 2>/dev/null || true
    log_success "Gunicorn processes stopped"
fi

# Kill any remaining nginx processes
NGINX_PIDS=$(pgrep -f "nginx" || true)
if [ ! -z "$NGINX_PIDS" ]; then
    log_info "Found remaining nginx processes, stopping..."
    echo $NGINX_PIDS | xargs kill
    sleep 2
    echo $NGINX_PIDS | xargs kill -9 2>/dev/null || true
    log_success "Nginx processes stopped"
fi

# Kill any remaining uvicorn processes
UVICORN_PIDS=$(pgrep -f "uvicorn.*app.main:app" || true)
if [ ! -z "$UVICORN_PIDS" ]; then
    log_info "Found remaining uvicorn processes, stopping..."
    echo $UVICORN_PIDS | xargs kill
    sleep 2
    echo $UVICORN_PIDS | xargs kill -9 2>/dev/null || true
    log_success "Uvicorn processes stopped"
fi

# ========================================
# 🧹 CLEANUP
# ========================================
log_info "🧹 Cleaning up..."

# Check if ports are still in use
log_info "🔍 Checking if ports are still in use..."

# Check port 8000 (backend)
if lsof -i :8000 > /dev/null 2>&1; then
    log_warning "Port 8000 is still in use. You may need to manually stop the process."
    lsof -i :8000
else
    log_success "Port 8000 is free"
fi

# Check port 80 (frontend/nginx)
if lsof -i :80 > /dev/null 2>&1; then
    log_warning "Port 80 is still in use. You may need to manually stop the process."
    lsof -i :80
else
    log_success "Port 80 is free"
fi

# Check port 443 (HTTPS)
if lsof -i :443 > /dev/null 2>&1; then
    log_warning "Port 443 is still in use. You may need to manually stop the process."
    lsof -i :443
else
    log_success "Port 443 is free"
fi

# ========================================
# 🔒 SECURITY CLEANUP
# ========================================
log_info "🔒 Cleaning up security configurations..."

# Remove production credentials file if it exists
if [ -f "$PROD_DIR/.production_credentials" ]; then
    log_info "Removing production credentials file..."
    rm -f "$PROD_DIR/.production_credentials"
    log_success "Production credentials removed"
fi

# ========================================
# 📋 STOPPED SERVICES SUMMARY
# ========================================
log_success "🎉 All production servers stopped!"

echo ""
echo "📋 Stopped Services:"
echo "===================="
echo "🔧 Backend:  Port 8000 (Gunicorn)"
echo "🌐 Frontend: Port 80 (Nginx)"
echo "🔒 HTTPS:    Port 443"
echo "📊 PM2:      All processes stopped"
echo ""

echo "🔄 To restart production servers:"
echo "   ./scripts/deploy-prod.sh"
echo ""

echo "📚 For more information, see:"
echo "   README.md"
echo "   DEPLOYMENT.md"
echo ""

log_success "🛑 MailerSuite production environment stopped!"
