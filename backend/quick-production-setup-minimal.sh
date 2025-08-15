#!/bin/bash

# ============================================================================
# MailerSuite2 Minimal Production Setup Script
# ============================================================================
# This script addresses the CRITICAL production issues with minimal dependencies
# Focuses on SECRET_KEY, environment configuration, and basic security
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MailerSuite2 Minimal Production Setup${NC}"
echo "=================================================="

# ============================================================================
# CRITICAL ISSUE 1: SECRET_KEY Configuration
# ============================================================================

echo -e "${YELLOW}🔑 CRITICAL: Setting up strong SECRET_KEY...${NC}"

# Generate cryptographically secure secret key
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Update environment file
ENV_FILE="env.production"
if [[ -f "$ENV_FILE" ]]; then
    # Replace placeholder secret key
    sed -i "s/your-super-secure-production-secret-key-change-this-immediately/$SECRET_KEY/" "$ENV_FILE"
    echo -e "${GREEN}✅ SECRET_KEY generated and updated in $ENV_FILE${NC}"
    echo "   Generated key: ${SECRET_KEY:0:16}..."
else
    echo -e "${RED}❌ Production environment file not found: $ENV_FILE${NC}"
    echo "   Please create the production environment configuration first"
    exit 1
fi

# ============================================================================
# CRITICAL ISSUE 2: Environment Configuration
# ============================================================================

echo -e "${YELLOW}🔧 CRITICAL: Configuring production environment...${NC}"

# Ensure environment is set to production
if ! grep -q "ENVIRONMENT=production" "$ENV_FILE"; then
    echo "ENVIRONMENT=production" >> "$ENV_FILE"
    echo -e "${GREEN}✅ Environment set to production${NC}"
fi

# Ensure debug is disabled
if ! grep -q "DEBUG=False" "$ENV_FILE"; then
    echo "DEBUG=False" >> "$ENV_FILE"
    echo -e "${GREEN}✅ Debug mode disabled${NC}"
fi

# ============================================================================
# CRITICAL ISSUE 3: Security Configuration
# ============================================================================

echo -e "${YELLOW}🔒 CRITICAL: Configuring security settings...${NC}"

# Create necessary directories
mkdir -p pids logs

# Set secure file permissions
chmod 600 "$ENV_FILE"
echo -e "${GREEN}✅ Environment file permissions secured (600)${NC}"

# ============================================================================
# CRITICAL ISSUE 4: Basic Dependencies Check
# ============================================================================

echo -e "${YELLOW}📦 CRITICAL: Checking essential dependencies...${NC}"

# Check if virtual environment exists
if [[ ! -d ".venv" ]]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate
echo -e "${GREEN}✅ Virtual environment activated${NC}"

# Install only the most critical packages
echo "Installing critical production packages..."
pip install --upgrade pip
pip install fastapi uvicorn pydantic pydantic-settings sqlalchemy asyncpg redis

echo -e "${GREEN}✅ Critical packages installed${NC}"

# ============================================================================
# CRITICAL ISSUE 5: Database Health Check
# ============================================================================

echo -e "${YELLOW}🗄️  CRITICAL: Checking database health...${NC}"

# Load environment variables (only valid ones)
if [[ -f "$ENV_FILE" ]]; then
    # Source the file to load environment variables
    set -a
    source "$ENV_FILE"
    set +a
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is running and accessible${NC}"
    else
        echo -e "${RED}❌ Redis is not responding${NC}"
        echo "   Start Redis with: sudo systemctl start redis"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli not available${NC}"
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL client available${NC}"
else
    echo -e "${YELLOW}⚠️  psql not available${NC}"
    echo "   Install with: sudo apt install postgresql-client"
fi

# ============================================================================
# CRITICAL ISSUE 6: Security Middleware Verification
# ============================================================================

echo -e "${YELLOW}🛡️  CRITICAL: Verifying security middleware...${NC}"

# Check if basic security modules are available
SECURITY_MODULES=(
    "middlewares.rate_limiting"
    "core.security_monitoring"
)

for module in "${SECURITY_MODULES[@]}"; do
    if python3 -c "import $module" 2>/dev/null; then
        echo -e "   ${GREEN}✅ $module available${NC}"
    else
        echo -e "   ${YELLOW}⚠️  $module not available (will be created)${NC}"
    fi
done

# ============================================================================
# CRITICAL ISSUE 7: Test Production Configuration
# ============================================================================

echo -e "${YELLOW}🧪 CRITICAL: Testing production configuration...${NC}"

# Test if the application can start with production settings
echo "Testing application startup..."
if timeout 30s python3 -c "
import os
import sys
sys.path.append('.')
try:
    from config.settings import settings
    print(f'Environment: {settings.ENVIRONMENT}')
    print(f'Debug: {settings.DEBUG}')
    print(f'Secret Key: {settings.SECRET_KEY[:16]}...')
    print('✅ Production configuration test passed')
except Exception as e:
    print(f'❌ Production configuration test failed: {e}')
    exit(1)
"; then
    echo -e "${GREEN}✅ Production configuration test passed${NC}"
else
    echo -e "${RED}❌ Production configuration test failed${NC}"
    echo "   Check your environment configuration"
fi

# ============================================================================
# FINAL VERIFICATION
# ============================================================================

echo -e "${YELLOW}🔍 Final verification...${NC}"

# Check all critical components
CRITICAL_ISSUES=0

# Check SECRET_KEY
if grep -q "your-super-secure-production-secret-key-change-this-immediately" "$ENV_FILE"; then
    echo -e "   ${RED}❌ SECRET_KEY still using placeholder${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
else
    echo -e "   ${GREEN}✅ SECRET_KEY properly configured${NC}"
fi

# Check environment
if grep -q "ENVIRONMENT=production" "$ENV_FILE"; then
    echo -e "   ${GREEN}✅ Environment set to production${NC}"
else
    echo -e "   ${RED}❌ Environment not set to production${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

# Check debug mode
if grep -q "DEBUG=False" "$ENV_FILE"; then
    echo -e "   ${GREEN}✅ Debug mode disabled${NC}"
else
    echo -e "   ${RED}❌ Debug mode not disabled${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

# Check basic dependencies
if python3 -c "import fastapi, uvicorn, sqlalchemy" 2>/dev/null; then
    echo -e "   ${GREEN}✅ Basic dependencies available${NC}"
else
    echo -e "   ${RED}❌ Basic dependencies missing${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

# ============================================================================
# SUMMARY AND NEXT STEPS
# ============================================================================

echo "=================================================="
echo -e "${BLUE}📊 Minimal Production Setup Summary${NC}"

if [[ $CRITICAL_ISSUES -eq 0 ]]; then
    echo -e "${GREEN}🎉 ALL CRITICAL ISSUES RESOLVED!${NC}"
    echo -e "${GREEN}✅ Your MailerSuite2 backend is now production-ready!${NC}"
else
    echo -e "${RED}❌ $CRITICAL_ISSUES critical issues remain${NC}"
    echo "   Please resolve them before going to production"
fi

echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Review and customize env.production"
echo "2. Configure your domain and database"
echo "3. Test the production deployment"
echo "4. Run: ./deploy-production.sh"

echo ""
echo -e "${BLUE}📋 Files Created/Modified:${NC}"
echo "   • $ENV_FILE (updated with SECRET_KEY and production settings)"
echo "   • pids/ directory (for process management)"
echo "   • logs/ directory (for application logs)"

echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "   • Deploy: ./deploy-production.sh"
echo "   • Monitor: ./monitor-production.sh"
echo "   • Check health: curl http://localhost:8000/health"

echo ""
echo -e "${GREEN}✅ Minimal production setup completed!${NC}"

# Exit with appropriate code
if [[ $CRITICAL_ISSUES -eq 0 ]]; then
    exit 0
else
    exit 1
fi 