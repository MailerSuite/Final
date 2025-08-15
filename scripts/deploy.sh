#!/bin/bash

# ========================================
# 🚀 MASTER DEPLOYMENT SCRIPT
# ========================================
# Handles both development and production deployments
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${PURPLE}🎯 $1${NC}"; }

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Show help
show_help() {
    echo "🚀 MailerSuite Master Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS] [ENVIRONMENT]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo "  -f, --force    Force deployment (overwrite existing)"
    echo "  -c, --clean    Clean deployment (remove existing first)"
    echo ""
    echo "Environments:"
    echo "  dev           Development environment (default)"
    echo "  prod          Production environment"
    echo "  stop          Stop all servers"
    echo "  status        Show deployment status"
    echo "  logs          Show server logs"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy development"
    echo "  $0 dev               # Deploy development"
    echo "  $0 prod              # Deploy production"
    echo "  $0 stop              # Stop all servers"
    echo "  $0 status            # Show status"
    echo "  $0 logs              # Show logs"
    echo ""
    echo "For more information, see:"
    echo "  README.md"
    echo "  DEPLOYMENT.md"
}

# Check if script exists and is executable
check_script() {
    local script="$1"
    if [ ! -f "$script" ]; then
        log_error "Script not found: $script"
        exit 1
    fi
    if [ ! -x "$script" ]; then
        log_error "Script not executable: $script"
        exit 1
    fi
}

# Deploy development environment
deploy_dev() {
    log_header "Deploying Development Environment"
    
    local script="$SCRIPTS_DIR/deploy-dev.sh"
    check_script "$script"
    
    log_info "Starting development deployment..."
    "$script"
}

# Deploy production environment
deploy_prod() {
    log_header "Deploying Production Environment"
    
    local script="$SCRIPTS_DIR/deploy-prod.sh"
    check_script "$script"
    
    log_info "Starting production deployment..."
    "$script"
}

# Stop all servers
stop_servers() {
    log_header "Stopping All Servers"
    
    # Stop development servers
    if [ -f "$SCRIPTS_DIR/stop-dev.sh" ]; then
        log_info "Stopping development servers..."
        "$SCRIPTS_DIR/stop-dev.sh"
    fi
    
    # Stop production servers
    if [ -f "$SCRIPTS_DIR/stop-prod.sh" ]; then
        log_info "Stopping production servers..."
        "$SCRIPTS_DIR/stop-prod.sh"
    fi
    
    log_success "All servers stopped"
}

# Show deployment status
show_status() {
    log_header "Deployment Status"
    
    echo ""
    echo "🔍 Checking server status..."
    echo ""
    
    # Check development servers
    echo "📱 Development Environment:"
    echo "============================"
    
    # Check backend port 8000
    if lsof -i :8000 > /dev/null 2>&1; then
        local backend_pid=$(lsof -ti :8000 | head -1)
        echo "🔧 Backend:  ✅ Running (PID: $backend_pid) on port 8000"
    else
        echo "🔧 Backend:  ❌ Not running"
    fi
    
    # Check frontend port 4000
    if lsof -i :4000 > /dev/null 2>&1; then
        local frontend_pid=$(lsof -ti :4000 | head -1)
        echo "🌐 Frontend: ✅ Running (PID: $frontend_pid) on port 4000"
    else
        echo "🌐 Frontend: ❌ Not running"
    fi
    
    echo ""
    echo "🚀 Production Environment:"
    echo "==========================="
    
    # Check PM2 processes
    if command -v pm2 &> /dev/null; then
        echo "📊 PM2 Status:"
        pm2 status 2>/dev/null || echo "   No PM2 processes running"
    else
        echo "📊 PM2: ❌ Not installed"
    fi
    
    # Check production ports
    if lsof -i :80 > /dev/null 2>&1; then
        local nginx_pid=$(lsof -ti :80 | head -1)
        echo "🌐 Frontend: ✅ Running (PID: $nginx_pid) on port 80"
    else
        echo "🌐 Frontend: ❌ Not running"
    fi
    
    if lsof -i :443 > /dev/null 2>&1; then
        local https_pid=$(lsof -ti :443 | head -1)
        echo "🔒 HTTPS:    ✅ Running (PID: $https_pid) on port 443"
    else
        echo "🔒 HTTPS:    ❌ Not running"
    fi
    
    echo ""
    echo "📁 Process IDs:"
    if [ -d "$PROJECT_ROOT/pids" ]; then
        for pid_file in "$PROJECT_ROOT/pids"/*.pid; do
            if [ -f "$pid_file" ]; then
                local service=$(basename "$pid_file" .pid)
                local pid=$(cat "$pid_file")
                echo "   $service: $pid"
            fi
        done
    else
        echo "   No PID files found"
    fi
}

# Show server logs
show_logs() {
    log_header "Server Logs"
    
    echo ""
    echo "📋 Available log files:"
    echo "========================"
    
    # Development logs
    if [ -d "$PROJECT_ROOT/pids" ]; then
        echo "📱 Development Logs:"
        for pid_file in "$PROJECT_ROOT/pids"/*.pid; do
            if [ -f "$pid_file" ]; then
                local service=$(basename "$pid_file" .pid)
                local pid=$(cat "$pid_file")
                echo "   $service (PID: $pid)"
            fi
        done
    fi
    
    # Production logs
    if [ -d "$PROJECT_ROOT/production/logs" ]; then
        echo ""
        echo "🚀 Production Logs:"
        for log_file in "$PROJECT_ROOT/production/logs"/*.log; do
            if [ -f "$log_file" ]; then
                local log_name=$(basename "$log_file")
                local log_size=$(du -h "$log_file" | cut -f1)
                echo "   $log_name ($log_size)"
            fi
        done
    fi
    
    echo ""
    echo "🔍 To view specific logs:"
    echo "   tail -f \$PROJECT_ROOT/production/logs/backend-error.log"
    echo "   tail -f \$PROJECT_ROOT/production/logs/frontend-pm2.log"
    echo ""
    echo "📊 PM2 logs:"
    echo "   pm2 logs"
    echo "   pm2 logs mailersuite-backend"
    echo "   pm2 logs mailersuite-frontend"
}

# Main deployment logic
main() {
    local environment="dev"
    local verbose=false
    local force=false
    local clean=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -c|--clean)
                clean=true
                shift
                ;;
            dev|development)
                environment="dev"
                shift
                ;;
            prod|production)
                environment="prod"
                shift
                ;;
            stop)
                stop_servers
                exit 0
                ;;
            status)
                show_status
                exit 0
                ;;
            logs)
                show_logs
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi
    
    # Show deployment info
    log_header "MailerSuite Deployment"
    echo "Environment: $environment"
    echo "Force: $force"
    echo "Clean: $clean"
    echo ""
    
    # Perform deployment
    case $environment in
        dev)
            deploy_dev
            ;;
        prod)
            deploy_prod
            ;;
        *)
            log_error "Unknown environment: $environment"
            exit 1
            ;;
    esac
    
    log_success "🎉 Deployment complete!"
}

# Run main function with all arguments
main "$@"
