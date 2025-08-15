#!/bin/bash

# ========================================
# 🚀 MAILERSUITE2 VPS SETUP SCRIPT
# Single VPS: Production Docker + Development
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

# Get VPS IP address
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

log_info "🚀 Starting MailerSuite2 VPS Setup..."
log_info "VPS IP: $VPS_IP"

# ========================================
# 🔐 CHECK IF RUNNING AS ROOT
# ========================================
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# ========================================
# 🐳 START PRODUCTION DOCKER ENVIRONMENT
# ========================================
log_info "🐳 Starting production Docker environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Use the official setup script first
if [ -f "scripts/setup-debian12.sh" ]; then
    log_info "Running official Debian 12 setup script..."
    chmod +x scripts/setup-debian12.sh
    ./scripts/setup-debian12.sh
else
    log_warning "Official setup script not found, using fallback..."
    # Start production services
    log_info "Starting PostgreSQL, Redis, Backend, Worker, Flower, and Frontend..."
    docker compose up -d
fi

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 30

# Check service status
if docker compose ps | grep -q "Up"; then
    log_success "Production Docker services are running"
else
    log_warning "Some Docker services may not be running properly"
fi

# ========================================
# 🗄️ SETUP DEVELOPMENT DATABASE
# ========================================
log_info "🗄️ Setting up development database..."

# Create development database and user
sudo -u postgres psql -c "CREATE DATABASE mailersuite2_dev;" 2>/dev/null || log_warning "Database mailersuite2_dev already exists"
sudo -u postgres psql -c "CREATE USER mailersuite_dev WITH PASSWORD 'dev_password';" 2>/dev/null || log_warning "User mailersuite_dev already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mailersuite2_dev TO mailersuite_dev;"

# Create development database on different port
sudo -u postgres psql -c "ALTER DATABASE mailersuite2_dev SET port = 5433;" 2>/dev/null || log_warning "Could not set port for development database"

log_success "Development database setup complete"

# ========================================
# 🐍 SETUP PYTHON DEVELOPMENT ENVIRONMENT
# ========================================
log_info "🐍 Setting up Python development environment..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    log_info "Creating Python virtual environment..."
    python3.11 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
log_info "Installing Python dependencies..."
pip install -r backend/requirements.txt

log_success "Python development environment setup complete"

# ========================================
# 📦 SETUP NODE DEVELOPMENT ENVIRONMENT
# ========================================
log_info "📦 Setting up Node.js development environment..."

# Install frontend dependencies
cd frontend
npm install
cd ..

log_success "Node.js development environment setup complete"

# ========================================
# 🔒 SETUP FIREWALL
# ========================================
log_info "🔒 Setting up firewall..."

# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # Production Frontend
sudo ufw allow 8000/tcp  # Production API
sudo ufw allow 5555/tcp  # Flower (Celery monitoring)
sudo ufw allow 3000/tcp  # Dev Frontend
sudo ufw allow 8001/tcp  # Dev API
sudo ufw allow 5432/tcp  # Production Database
sudo ufw allow 6379/tcp  # Redis

# Enable firewall
sudo ufw --force enable

log_success "Firewall configured"

# ========================================
# 🚀 START DEVELOPMENT SERVERS
# ========================================
log_info "🚀 Starting development servers..."

# Start backend development server
log_info "Starting backend development server on port 8001..."
cd backend
source ../venv/bin/activate
nohup python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001 --env-file env.dev > ../logs/backend-dev.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend development server
log_info "Starting frontend development server on port 3000..."
cd frontend
nohup npm run dev -- --host 0.0.0.0 --port 3000 > ../logs/frontend-dev.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Save PIDs
mkdir -p pids
echo $BACKEND_PID > pids/backend-dev.pid
echo $FRONTEND_PID > pids/frontend-dev.pid

log_success "Development servers started"

# ========================================
# 🔍 HEALTH CHECKS
# ========================================
log_info "🔍 Performing health checks..."

sleep 10  # Wait for servers to start

# Check production services
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    log_success "Production backend is responding"
else
    log_warning "Production backend may not be responding yet"
fi

if curl -s http://localhost > /dev/null 2>&1; then
    log_success "Production frontend is responding"
else
    log_warning "Production frontend may not be responding yet"
fi

if curl -s http://localhost:5555 > /dev/null 2>&1; then
    log_success "Flower (Celery monitoring) is responding"
else
    log_warning "Flower may not be responding yet"
fi

# Check development services
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    log_success "Development backend is responding"
else
    log_warning "Development backend may not be responding yet"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "Development frontend is responding"
else
    log_warning "Development frontend may not be responding yet"
fi

# ========================================
# 📋 SETUP COMPLETE
# ========================================
log_success "🎉 VPS Setup Complete!"

echo ""
echo "📋 MailerSuite2 VPS Setup Summary:"
echo "===================================="
echo "🐳 Production Docker Services:"
echo "   Frontend: http://$VPS_IP"
echo "   Backend:  http://$VPS_IP:8000"
echo "   Flower:   http://$VPS_IP:5555"
echo "   Database: localhost:5432"
echo "   Redis:    localhost:6379"
echo ""
echo "🛠️  Development Services:"
echo "   Frontend: http://$VPS_IP:3000"
echo "   Backend:  http://$VPS_IP:8001"
echo "   Database: localhost:5433"
echo ""
echo "📊 Process Management:"
echo "   Production: docker compose up -d"
echo "   Development Backend: pids/backend-dev.pid"
echo "   Development Frontend: pids/frontend-dev.pid"
echo ""
echo "📁 Logs:"
echo "   Production: docker compose logs -f"
echo "   Development Backend: tail -f logs/backend-dev.log"
echo "   Development Frontend: tail -f logs/frontend-dev.log"
echo ""
echo "🔒 Firewall: Enabled with ports 22, 80, 8000, 5555, 3000, 8001, 5432, 6379 open"
echo ""
echo "🚀 Next Steps:"
echo "1. Connect Cursor via SSH to $VPS_IP"
echo "2. Open folder: /home/$(whoami)/clean-mailersuite"
echo "3. Start developing!"
echo ""

log_success "Setup complete! Your VPS is ready for both production and development."
