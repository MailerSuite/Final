#!/bin/bash

# ============================================================================
# MailerSuite2 Production Deployment Script
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="MailerSuite2"
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$BACKEND_DIR/.venv"
REQUIREMENTS_FILE="$BACKEND_DIR/requirements-production.txt"
ENV_FILE="$BACKEND_DIR/env.production"
PID_DIR="$BACKEND_DIR/pids"
LOG_DIR="$BACKEND_DIR/logs"

echo -e "${BLUE}🚀 Starting $PROJECT_NAME Production Deployment${NC}"
echo "=================================================="

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if running as root (not recommended for production)
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Running as root is not recommended for production${NC}"
   echo "Please run as a regular user with sudo privileges"
   exit 1
fi

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
if [[ $(echo "$PYTHON_VERSION >= 3.8" | bc -l) -eq 0 ]]; then
    echo -e "${RED}❌ Python 3.8+ is required, found: $PYTHON_VERSION${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python version: $PYTHON_VERSION${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client is not installed${NC}"
    echo "Install with: sudo apt install postgresql-client"
    exit 1
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${RED}❌ Redis client is not installed${NC}"
    echo "Install with: sudo apt install redis-tools"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo -e "${RED}❌ Redis server is not running${NC}"
    echo "Start Redis with: sudo systemctl start redis"
    exit 1
fi
echo -e "${GREEN}✅ Redis is running${NC}"

# ============================================================================
# ENVIRONMENT SETUP
# ============================================================================

echo -e "${YELLOW}🔧 Setting up environment...${NC}"

# Create necessary directories
mkdir -p "$PID_DIR" "$LOG_DIR"

# Check if production environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "${RED}❌ Production environment file not found: $ENV_FILE${NC}"
    echo "Please create the production environment configuration first"
    exit 1
fi

# Generate strong secret key if not set
if grep -q "your-super-secure-production-secret-key-change-this-immediately" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  Generating strong secret key...${NC}"
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    sed -i "s/your-super-secure-production-secret-key-change-this-immediately/$SECRET_KEY/" "$ENV_FILE"
    echo -e "${GREEN}✅ Secret key generated and updated${NC}"
else
    echo -e "${GREEN}✅ Secret key already configured${NC}"
fi

# ============================================================================
# VIRTUAL ENVIRONMENT SETUP
# ============================================================================

echo -e "${YELLOW}🐍 Setting up Python virtual environment...${NC}"

if [[ ! -d "$VENV_DIR" ]]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"
echo -e "${GREEN}✅ Virtual environment activated${NC}"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# ============================================================================
# DEPENDENCY INSTALLATION
# ============================================================================

echo -e "${YELLOW}📦 Installing production dependencies...${NC}"

if [[ ! -f "$REQUIREMENTS_FILE" ]]; then
    echo -e "${RED}❌ Production requirements file not found: $REQUIREMENTS_FILE${NC}"
    exit 1
fi

echo "Installing dependencies from $REQUIREMENTS_FILE..."
pip install -r "$REQUIREMENTS_FILE"

echo -e "${GREEN}✅ Dependencies installed successfully${NC}"

# ============================================================================
# DATABASE SETUP
# ============================================================================

echo -e "${YELLOW}🗄️  Setting up database...${NC}"

# Load environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Check database connection
echo "Testing database connection..."
if python3 -c "
import asyncio
import asyncpg
import os

async def test_db():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL').replace('+asyncpg', ''))
        await conn.close()
        print('Database connection successful')
    except Exception as e:
        print(f'Database connection failed: {e}')
        exit(1)

asyncio.run(test_db())
"; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo "Please check your DATABASE_URL in $ENV_FILE"
    exit 1
fi

# Run database migrations
echo "Running database migrations..."
cd "$BACKEND_DIR"
python3 -m alembic upgrade head

echo -e "${GREEN}✅ Database setup completed${NC}"

# ============================================================================
# SECURITY CHECKS
# ============================================================================

echo -e "${YELLOW}🔒 Performing security checks...${NC}"

# Check if secret key is properly set
if [[ "$SECRET_KEY" == "your-super-secure-production-secret-key-change-this-immediately" ]]; then
    echo -e "${RED}❌ SECRET_KEY is not properly configured${NC}"
    exit 1
fi

# Check if environment is set to production
if [[ "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}❌ ENVIRONMENT is not set to 'production'${NC}"
    exit 1
fi

# Check if debug is disabled
if [[ "$DEBUG" != "False" ]]; then
    echo -e "${RED}❌ DEBUG is not disabled in production${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Security checks passed${NC}"

# ============================================================================
# START PRODUCTION SERVER
# ============================================================================

echo -e "${YELLOW}🚀 Starting production server...${NC}"

# Stop any existing processes
if [[ -f "$PID_DIR/backend.pid" ]]; then
    OLD_PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Stopping existing backend process (PID: $OLD_PID)..."
        kill "$OLD_PID"
        sleep 2
    fi
    rm -f "$PID_DIR/backend.pid"
fi

# Start the production server
echo "Starting backend server..."
nohup python3 -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --log-level info \
    --access-log \
    --log-config /dev/null \
    > "$LOG_DIR/production.log" 2>&1 &

# Save PID
echo $! > "$PID_DIR/backend.pid"
echo -e "${GREEN}✅ Backend server started (PID: $!)${NC}"

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ Server is responding to health checks${NC}"
else
    echo -e "${RED}❌ Server is not responding to health checks${NC}"
    echo "Check logs: tail -f $LOG_DIR/production.log"
    exit 1
fi

# ============================================================================
# FINAL STATUS
# ============================================================================

echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}📊 Server Status:${NC}"
echo "   • Backend: http://localhost:8000"
echo "   • Health Check: http://localhost:8000/health"
echo "   • API Docs: http://localhost:8000/docs"
echo "   • PID File: $PID_DIR/backend.pid"
echo "   • Logs: $LOG_DIR/production.log"

echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "   • Stop server: kill \$(cat $PID_DIR/backend.pid)"
echo "   • View logs: tail -f $LOG_DIR/production.log"
echo "   • Restart: ./deploy-production.sh"

echo -e "${BLUE}⚠️  Important Notes:${NC}"
echo "   • Update your domain in env.production"
echo "   • Configure your reverse proxy (Nginx/Apache)"
echo "   • Set up SSL certificates"
echo "   • Configure firewall rules"
echo "   • Set up monitoring and alerting"

echo -e "${GREEN}🚀 MailerSuite2 is now running in production mode!${NC}" 