#!/bin/bash

# ========================================
# 🚀 AUTOMATED DEVELOPMENT DEPLOYMENT
# ========================================
# Complete development environment setup
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
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/venv"

log_info "🚀 Starting MailerSuite Development Deployment..."

# ========================================
# 📋 PREREQUISITES CHECK
# ========================================
log_info "🔍 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm"
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    log_warning "PostgreSQL client not found. Database setup will be manual."
    DB_AUTO_SETUP=false
else
    DB_AUTO_SETUP=true
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    log_warning "Redis not found. Some features may not work."
    REDIS_AUTO_SETUP=false
else
    REDIS_AUTO_SETUP=true
fi

log_success "Prerequisites check complete"

# ========================================
# 🗄️ DATABASE SETUP
# ========================================
if [ "$DB_AUTO_SETUP" = true ]; then
    log_info "🗄️ Setting up PostgreSQL database..."
    
    # Check if PostgreSQL service is running
    if ! sudo systemctl is-active --quiet postgresql; then
        log_info "Starting PostgreSQL service..."
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    fi
    
    # Create database and user
    DB_NAME="mailersuite2_dev"
    DB_USER="mailersuite"
    DB_PASSWORD="dev_password_$(date +%s)"
    
    log_info "Creating database: $DB_NAME"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || log_warning "Database $DB_NAME already exists"
    
    log_info "Creating user: $DB_USER"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || log_warning "User $DB_USER already exists"
    
    log_info "Granting privileges..."
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    log_success "Database setup complete"
    log_info "Database credentials: $DB_USER@localhost:$DB_NAME"
    log_warning "Password: $DB_PASSWORD (save this for .env.local)"
else
    log_warning "Please set up PostgreSQL manually:"
    echo "1. Install PostgreSQL"
    echo "2. Create database: CREATE DATABASE mailersuite2_dev;"
    echo "3. Create user: CREATE USER mailersuite WITH PASSWORD 'your_password';"
    echo "4. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE mailersuite2_dev TO mailersuite;"
fi

# ========================================
# 🔐 ENVIRONMENT SETUP
# ========================================
log_info "🔐 Setting up environment files..."

# Run the deployment setup script
if [ -f "$PROJECT_ROOT/deploy-setup.sh" ]; then
    log_info "Running deployment setup script..."
    cd "$PROJECT_ROOT"
    ./deploy-setup.sh
else
    log_error "deploy-setup.sh not found!"
    exit 1
fi

# ========================================
# 🐍 PYTHON ENVIRONMENT
# ========================================
log_info "🐍 Setting up Python environment..."

cd "$PROJECT_ROOT"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    log_info "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    log_info "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r "$BACKEND_DIR/requirements.txt"
    log_success "Python dependencies installed"
else
    log_warning "requirements.txt not found. Please create it with your dependencies."
fi

# ========================================
# 📦 NODE.JS DEPENDENCIES
# ========================================
log_info "📦 Installing Node.js dependencies..."

cd "$FRONTEND_DIR"

if [ -f "package.json" ]; then
    log_info "Installing npm packages..."
    npm install
    log_success "Node.js dependencies installed"
else
    log_error "package.json not found!"
    exit 1
fi

# ========================================
# 🔧 ENVIRONMENT CONFIGURATION
# ========================================
log_info "🔧 Configuring environment files..."

# Update backend .env.local with database credentials
if [ "$DB_AUTO_SETUP" = true ] && [ -f "$BACKEND_DIR/.env.local" ]; then
    log_info "Updating backend .env.local with database credentials..."
    
    # Backup original file
    cp "$BACKEND_DIR/.env.local" "$BACKEND_DIR/.env.local.backup"
    
    # Update database URL
    sed -i "s/DATABASE_URL=.*/DATABASE_URL=postgresql+asyncpg:\/\/$DB_USER:$DB_PASSWORD@localhost:5432\/$DB_NAME/" "$BACKEND_DIR/.env.local"
    
    # Generate random secret keys
    SECRET_KEY=$(openssl rand -hex 32)
    JWT_SECRET_KEY=$(openssl rand -hex 32)
    
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" "$BACKEND_DIR/.env.local"
    sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$JWT_SECRET_KEY/" "$BACKEND_DIR/.env.local"
    
    log_success "Backend environment configured"
fi

# ========================================
# 🗄️ DATABASE MIGRATIONS
# ========================================
if [ "$DB_AUTO_SETUP" = true ]; then
    log_info "🗄️ Running database migrations..."
    
    cd "$BACKEND_DIR"
    
    # Check if alembic is available
    if python -c "import alembic" 2>/dev/null; then
        # Initialize alembic if not already done
        if [ ! -f "alembic.ini" ]; then
            log_info "Initializing Alembic..."
            alembic init alembic
        fi
        
        # Run migrations
        log_info "Running database migrations..."
        alembic upgrade head || log_warning "Migrations failed or no migrations to run"
        
        log_success "Database migrations complete"
    else
        log_warning "Alembic not found. Please install it: pip install alembic"
    fi
fi

# ========================================
# 🚀 START DEVELOPMENT SERVERS
# ========================================
log_info "🚀 Starting development servers..."

# Function to start backend
start_backend() {
    cd "$BACKEND_DIR"
    log_info "Starting backend server on port 8000..."
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/pids/backend.pid"
    log_success "Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    cd "$FRONTEND_DIR"
    log_info "Starting frontend server on port 3000..."
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/pids/frontend.pid"
    log_success "Frontend started with PID: $FRONTEND_PID"
}

# Start servers
start_backend
sleep 3  # Give backend time to start
start_frontend

# ========================================
# 🔍 HEALTH CHECKS
# ========================================
log_info "🔍 Performing health checks..."

sleep 5  # Wait for servers to fully start

# Check backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    log_success "Backend health check passed"
else
    log_warning "Backend health check failed - server may still be starting"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend health check passed"
else
    log_warning "Frontend health check failed - server may still be starting"
fi

# ========================================
# 📋 DEPLOYMENT SUMMARY
# ========================================
log_success "🎉 Development deployment complete!"

echo ""
echo "📋 Deployment Summary:"
echo "======================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🗄️  Database: $DB_USER@localhost:$DB_NAME"
echo "🔑 Backend PID: $BACKEND_PID"
echo "🎨 Frontend PID: $FRONTEND_PID"
echo ""

if [ "$DB_AUTO_SETUP" = true ]; then
    echo "🔐 Database Credentials:"
    echo "   Username: $DB_USER"
    echo "   Password: $DB_PASSWORD"
    echo "   Database: $DB_NAME"
    echo ""
fi

echo "📁 Process IDs saved to:"
echo "   Backend:  pids/backend.pid"
echo "   Frontend: pids/frontend.pid"
echo ""

echo "🛑 To stop servers:"
echo "   ./scripts/stop-dev.sh"
echo ""

echo "📚 For more information, see:"
echo "   README.md"
echo "   DEPLOYMENT.md"
echo ""

log_success "🚀 MailerSuite is now running in development mode!"
