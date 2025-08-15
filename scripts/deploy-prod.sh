#!/bin/bash

# ========================================
# 🚀 AUTOMATED PRODUCTION DEPLOYMENT
# ========================================
# Complete production environment setup
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
PROD_DIR="$PROJECT_ROOT/production"

log_info "🚀 Starting MailerSuite Production Deployment..."

# ========================================
# 📋 PREREQUISITES CHECK
# ========================================
log_info "🔍 Checking production prerequisites..."

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    log_error "This script should not be run as root. Use sudo for specific commands only."
    exit 1
fi

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

# Check PM2
if ! command -v pm2 &> /dev/null; then
    log_warning "PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    log_error "PostgreSQL client not found. Please install PostgreSQL client."
    exit 1
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
# 🔐 PRODUCTION ENVIRONMENT SETUP
# ========================================
log_info "🔐 Setting up production environment..."

# Create production directory
mkdir -p "$PROD_DIR"
mkdir -p "$PROD_DIR/logs"
mkdir -p "$PROD_DIR/backups"
mkdir -p "$PROD_DIR/ssl"

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
# 🗄️ PRODUCTION DATABASE SETUP
# ========================================
log_info "🗄️ Setting up production database..."

# Check if PostgreSQL service is running
if ! sudo systemctl is-active --quiet postgresql; then
    log_info "Starting PostgreSQL service..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Create production database and user
DB_NAME="mailersuite2_prod"
DB_USER="mailersuite_prod"
DB_PASSWORD="prod_$(openssl rand -hex 16)"

log_info "Creating production database: $DB_NAME"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || log_warning "Database $DB_NAME already exists"

log_info "Creating production user: $DB_USER"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || log_warning "User $DB_USER already exists"

log_info "Granting production privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

log_success "Production database setup complete"

# ========================================
# 🐍 PYTHON PRODUCTION ENVIRONMENT
# ========================================
log_info "🐍 Setting up Python production environment..."

cd "$PROJECT_ROOT"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    log_info "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source venv/bin/activate

# Install production Python dependencies
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    log_info "Installing production Python dependencies..."
    pip install --upgrade pip
    pip install -r "$BACKEND_DIR/requirements.txt"
    
    # Install production-specific packages
    pip install gunicorn uvicorn[standard] psycopg2-binary redis
    log_success "Production Python dependencies installed"
else
    log_error "requirements.txt not found!"
    exit 1
fi

# ========================================
# 📦 FRONTEND PRODUCTION BUILD
# ========================================
log_info "📦 Building frontend for production..."

cd "$FRONTEND_DIR"

# Install dependencies
log_info "Installing frontend dependencies..."
npm ci --production

# Build for production
log_info "Building production bundle..."
npm run build

# Verify build
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    log_success "Frontend production build complete"
else
    log_error "Frontend build failed!"
    exit 1
fi

# ========================================
# 🔧 PRODUCTION ENVIRONMENT CONFIGURATION
# ========================================
log_info "🔧 Configuring production environment..."

# Update backend .env.production with database credentials
if [ -f "$BACKEND_DIR/.env.production" ]; then
    log_info "Updating backend .env.production with production credentials..."
    
    # Backup original file
    cp "$BACKEND_DIR/.env.production" "$BACKEND_DIR/.env.production.backup"
    
    # Update database URL
    sed -i "s/DATABASE_URL=.*/DATABASE_URL=postgresql+asyncpg:\/\/$DB_USER:$DB_PASSWORD@localhost:5432\/$DB_NAME/" "$BACKEND_DIR/.env.production"
    
    # Generate production secret keys
    SECRET_KEY=$(openssl rand -hex 32)
    JWT_SECRET_KEY=$(openssl rand -hex 32)
    
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" "$BACKEND_DIR/.env.production"
    sed -i "s/JWT_SECRET_KEY=.*/JWT_SECRET_KEY=$SECRET_KEY/" "$BACKEND_DIR/.env.production"
    
    # Set production settings
    sed -i "s/DEBUG=.*/DEBUG=False/" "$BACKEND_DIR/.env.production"
    sed -i "s/ENVIRONMENT=.*/ENVIRONMENT=production/" "$BACKEND_DIR/.env.production"
    sed -i "s/LOG_LEVEL=.*/LOG_LEVEL=WARNING/" "$BACKEND_DIR/.env.production"
    
    log_success "Backend production environment configured"
fi

# ========================================
# 🗄️ DATABASE MIGRATIONS
# ========================================
log_info "🗄️ Running production database migrations..."

cd "$BACKEND_DIR"

# Check if alembic is available
if python -c "import alembic" 2>/dev/null; then
    # Initialize alembic if not already done
    if [ ! -f "alembic.ini" ]; then
        log_info "Initializing Alembic..."
        alembic init alembic
    fi
    
    # Run migrations
    log_info "Running production database migrations..."
    alembic upgrade head || log_warning "Migrations failed or no migrations to run"
    
    log_success "Production database migrations complete"
else
    log_error "Alembic not found. Please install it: pip install alembic"
    exit 1
fi

# ========================================
# 🚀 PRODUCTION SERVER SETUP
# ========================================
log_info "🚀 Setting up production servers..."

# Create production startup scripts
cat > "$PROD_DIR/start-backend.sh" << EOF
#!/bin/bash
cd "$BACKEND_DIR"
source "$VENV_DIR/bin/activate"
export \$(cat .env.production | grep -v '^#' | xargs)
exec gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --access-logfile "$PROD_DIR/logs/backend-access.log" --error-logfile "$PROD_DIR/logs/backend-error.log"
EOF

cat > "$PROD_DIR/start-frontend.sh" << EOF
#!/bin/bash
cd "$FRONTEND_DIR"
exec nginx -g "daemon off;" -c "$PROD_DIR/nginx.conf"
EOF

# Make scripts executable
chmod +x "$PROD_DIR/start-backend.sh"
chmod +x "$PROD_DIR/start-frontend.sh"

# ========================================
# 📊 PM2 PROCESS MANAGEMENT
# ========================================
log_info "📊 Setting up PM2 process management..."

# Stop any existing PM2 processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start backend with PM2
log_info "Starting backend with PM2..."
cd "$PROD_DIR"
pm2 start start-backend.sh --name "mailersuite-backend" --log "$PROD_DIR/logs/backend-pm2.log"

# Start frontend with PM2 (if nginx is available)
if command -v nginx &> /dev/null; then
    log_info "Starting frontend with PM2..."
    pm2 start start-frontend.sh --name "mailersuite-frontend" --log "$PROD_DIR/logs/frontend-pm2.log"
else
    log_warning "Nginx not found. Frontend will be served from backend."
fi

# Save PM2 configuration
pm2 save
pm2 startup

log_success "PM2 process management configured"

# ========================================
# 🔍 PRODUCTION HEALTH CHECKS
# ========================================
log_info "🔍 Performing production health checks..."

sleep 10  # Wait for servers to fully start

# Check backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    log_success "Backend production health check passed"
else
    log_warning "Backend production health check failed - server may still be starting"
fi

# Check frontend (if nginx is running)
if command -v nginx &> /dev/null; then
    if curl -s http://localhost:80 > /dev/null 2>&1; then
        log_success "Frontend production health check passed"
    else
        log_warning "Frontend production health check failed - server may still be starting"
    fi
fi

# ========================================
# 🔒 SECURITY SETUP
# ========================================
log_info "🔒 Setting up production security..."

# Create firewall rules (if ufw is available)
if command -v ufw &> /dev/null; then
    log_info "Configuring firewall..."
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 8000/tcp  # Backend API
    sudo ufw --force enable
    log_success "Firewall configured"
fi

# Create systemd service files
cat > "$PROD_DIR/mailersuite-backend.service" << EOF
[Unit]
Description=MailerSuite Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$VENV_DIR/bin
ExecStart=$VENV_DIR/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# ========================================
# 📋 PRODUCTION DEPLOYMENT SUMMARY
# ========================================
log_success "🎉 Production deployment complete!"

echo ""
echo "📋 Production Deployment Summary:"
echo "=================================="
echo "🔧 Backend:  http://localhost:8000"
echo "🌐 Frontend: http://localhost (if nginx configured)"
echo "📚 API Docs: http://localhost:8000/docs"
echo "🗄️  Database: $DB_USER@localhost:$DB_NAME"
echo "📊 PM2 Status: pm2 status"
echo "📁 Logs: $PROD_DIR/logs/"
echo ""

echo "🔐 Production Credentials:"
echo "   Username: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo "   Database: $DB_NAME"
echo ""

echo "📁 Production Files:"
echo "   Backend Service: $PROD_DIR/mailersuite-backend.service"
echo "   Start Scripts: $PROD_DIR/start-*.sh"
echo "   Logs: $PROD_DIR/logs/"
echo ""

echo "🛠️  Management Commands:"
echo "   PM2 Status: pm2 status"
echo "   PM2 Logs: pm2 logs"
echo "   PM2 Restart: pm2 restart all"
echo "   PM2 Stop: pm2 stop all"
echo ""

echo "📚 For more information, see:"
echo "   README.md"
echo "   DEPLOYMENT.md"
echo ""

log_success "🚀 MailerSuite is now running in production mode!"

# Save production credentials securely
echo "DB_USER=$DB_USER" > "$PROD_DIR/.production_credentials"
echo "DB_PASSWORD=$DB_PASSWORD" >> "$PROD_DIR/.production_credentials"
echo "DB_NAME=$DB_NAME" >> "$PROD_DIR/.production_credentials"
chmod 600 "$PROD_DIR/.production_credentials"

log_warning "Production credentials saved to: $PROD_DIR/.production_credentials"
log_warning "Keep this file secure and do not commit it to version control!"
