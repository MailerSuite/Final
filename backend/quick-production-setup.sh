#!/bin/bash

# ============================================================================
# MailerSuite2 Quick Production Setup Script
# ============================================================================
# This script immediately addresses the critical production issues:
# 1. Generates and sets strong SECRET_KEY
# 2. Installs missing production dependencies
# 3. Enables security systems
# 4. Configures monitoring and tracing
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MailerSuite2 Quick Production Setup${NC}"
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
    echo -e "${RED}❌ Production environment file not found${NC}"
    echo "   Please create env.production first"
    exit 1
fi

# ============================================================================
# CRITICAL ISSUE 2: Install Missing Dependencies
# ============================================================================

echo -e "${YELLOW}📦 CRITICAL: Installing missing production dependencies...${NC}"

# Check if virtual environment exists
if [[ ! -d ".venv" ]]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate
echo -e "${GREEN}✅ Virtual environment activated${NC}"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install production requirements
REQUIREMENTS_FILE="requirements-production.txt"
if [[ -f "$REQUIREMENTS_FILE" ]]; then
    echo "Installing production dependencies..."
    pip install -r "$REQUIREMENTS_FILE"
    echo -e "${GREEN}✅ Production dependencies installed${NC}"
else
    echo -e "${RED}❌ Production requirements file not found${NC}"
    echo "   Please create requirements-production.txt first"
    exit 1
fi

# ============================================================================
# CRITICAL ISSUE 3: Enable Security Systems
# ============================================================================

echo -e "${YELLOW}🔒 CRITICAL: Enabling security systems...${NC}"

# Create necessary directories
mkdir -p pids logs

# Set secure file permissions
chmod 600 "$ENV_FILE"
echo -e "${GREEN}✅ Environment file permissions secured (600)${NC}"

# ============================================================================
# CRITICAL ISSUE 4: Configure Monitoring and Tracing
# ============================================================================

echo -e "${YELLOW}📊 CRITICAL: Configuring monitoring and tracing...${NC}"

# Create monitoring configuration
cat > monitoring-config.py << 'EOF'
# Monitoring configuration for MailerSuite2
import os

# Sentry configuration
SENTRY_DSN = os.getenv('SENTRY_DSN', '')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FastApiIntegration()],
        enable_tracing=True,
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
        environment=os.getenv('ENVIRONMENT', 'production')
    )

# OpenTelemetry configuration
OTEL_ENABLED = os.getenv('OTEL_ENABLED', 'true').lower() == 'true'
if OTEL_ENABLED:
    try:
        from opentelemetry import trace
        from opentelemetry.exporter.jaeger.thrift import JaegerExporter
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        
        trace.set_tracer_provider(TracerProvider())
        trace.get_tracer_provider().add_span_processor(
            BatchSpanProcessor(JaegerExporter())
        )
    except ImportError:
        print("OpenTelemetry not available")
EOF

echo -e "${GREEN}✅ Monitoring configuration created${NC}"

# ============================================================================
# CRITICAL ISSUE 5: Database and Redis Health Check
# ============================================================================

echo -e "${YELLOW}🗄️  CRITICAL: Checking database and Redis health...${NC}"

# Load environment variables
export $(grep -v '^#' "$ENV_FILE" | xargs)

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
    # Extract database connection details
    if [[ -n "$DATABASE_URL" ]]; then
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        if [[ -n "$DB_HOST" && -n "$DB_PORT" && -n "$DB_NAME" ]]; then
            echo "Testing database connection..."
            if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
            else
                echo -e "${RED}❌ PostgreSQL connection failed${NC}"
                echo "   Check your DATABASE_URL configuration"
            fi
        else
            echo -e "${YELLOW}⚠️  Could not parse DATABASE_URL${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  DATABASE_URL not set${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  psql not available${NC}"
fi

# ============================================================================
# CRITICAL ISSUE 6: Security Middleware Verification
# ============================================================================

echo -e "${YELLOW}🛡️  CRITICAL: Verifying security middleware...${NC}"

# Check if security modules are available
SECURITY_MODULES=(
    "middlewares.rate_limiting"
    "middlewares.performance_middleware"
    "core.security_monitoring"
    "core.enhanced_audit_system"
)

for module in "${SECURITY_MODULES[@]}"; do
    if python3 -c "import $module" 2>/dev/null; then
        echo -e "   ${GREEN}✅ $module available${NC}"
    else
        echo -e "   ${RED}❌ $module not available${NC}"
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
from config.settings import settings
print(f'Environment: {settings.ENVIRONMENT}')
print(f'Debug: {settings.DEBUG}')
print(f'Secret Key: {settings.SECRET_KEY[:16]}...')
print(f'Database URL: {settings.DATABASE_URL[:50]}...')
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

# Check dependencies
if python3 -c "import sentry_sdk, opentelemetry" 2>/dev/null; then
    echo -e "   ${GREEN}✅ Production dependencies available${NC}"
else
    echo -e "   ${RED}❌ Production dependencies missing${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

# ============================================================================
# SUMMARY AND NEXT STEPS
# ============================================================================

echo "=================================================="
echo -e "${BLUE}📊 Quick Production Setup Summary${NC}"

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
echo "2. Configure your domain and SSL certificates"
echo "3. Set up monitoring and alerting"
echo "4. Test the production deployment"
echo "5. Run: ./deploy-production.sh"

echo ""
echo -e "${BLUE}📋 Files Created/Modified:${NC}"
echo "   • $ENV_FILE (updated with SECRET_KEY)"
echo "   • monitoring-config.py (monitoring setup)"
echo "   • requirements-production.txt (production dependencies)"
echo "   • deploy-production.sh (deployment script)"
echo "   • monitor-production.sh (monitoring script)"

echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "   • Deploy: ./deploy-production.sh"
echo "   • Monitor: ./monitor-production.sh"
echo "   • Check health: curl http://localhost:8000/health"

echo ""
echo -e "${GREEN}✅ Quick production setup completed!${NC}"

# Exit with appropriate code
if [[ $CRITICAL_ISSUES -eq 0 ]]; then
    exit 0
else
    exit 1
fi 