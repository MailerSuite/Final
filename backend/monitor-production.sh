#!/bin/bash

# ============================================================================
# MailerSuite2 Production Monitoring Script
# ============================================================================
# This script provides comprehensive monitoring of the production environment
# Run it manually or set up as a cron job for continuous monitoring
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="MailerSuite2"
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$BACKEND_DIR/pids"
LOG_DIR="$BACKEND_DIR/logs"
ENV_FILE="$BACKEND_DIR/env.production"

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Default values
BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}🔍 $PROJECT_NAME Production Monitoring - $TIMESTAMP${NC}"
echo "=================================================="

# ============================================================================
# SYSTEM HEALTH CHECKS
# ============================================================================

echo -e "${YELLOW}📊 System Health Check${NC}"

# Check system resources
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

echo "   • CPU Usage: ${CPU_USAGE}%"
echo "   • Memory Usage: ${MEMORY_USAGE}%"
echo "   • Disk Usage: ${DISK_USAGE}%"

# Check if system resources are healthy
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo -e "   ${RED}⚠️  High CPU usage detected${NC}"
    CPU_HEALTH="unhealthy"
else
    echo -e "   ${GREEN}✅ CPU usage normal${NC}"
    CPU_HEALTH="healthy"
fi

if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo -e "   ${RED}⚠️  High memory usage detected${NC}"
    MEMORY_HEALTH="unhealthy"
else
    echo -e "   ${GREEN}✅ Memory usage normal${NC}"
    MEMORY_HEALTH="healthy"
fi

if (( DISK_USAGE > 85 )); then
    echo -e "   ${RED}⚠️  High disk usage detected${NC}"
    DISK_HEALTH="unhealthy"
else
    echo -e "   ${GREEN}✅ Disk usage normal${NC}"
    DISK_HEALTH="healthy"
fi

# ============================================================================
# PROCESS MONITORING
# ============================================================================

echo -e "${YELLOW}🔄 Process Monitoring${NC}"

# Check if backend process is running
if [[ -f "$PID_DIR/backend.pid" ]]; then
    BACKEND_PID=$(cat "$PID_DIR/backend.pid")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "   ${GREEN}✅ Backend process running (PID: $BACKEND_PID)${NC}"
        BACKEND_HEALTH="healthy"
        
        # Check process resource usage
        if command -v ps &> /dev/null; then
            PROCESS_CPU=$(ps -p "$BACKEND_PID" -o %cpu --no-headers)
            PROCESS_MEM=$(ps -p "$BACKEND_PID" -o %mem --no-headers)
            echo "   • Process CPU: ${PROCESS_CPU}%"
            echo "   • Process Memory: ${PROCESS_MEM}%"
        fi
    else
        echo -e "   ${RED}❌ Backend process not running (PID file exists but process dead)${NC}"
        BACKEND_HEALTH="unhealthy"
    fi
else
    echo -e "   ${RED}❌ Backend PID file not found${NC}"
    BACKEND_HEALTH="unhealthy"
fi

# ============================================================================
# APPLICATION HEALTH CHECKS
# ============================================================================

echo -e "${YELLOW}🌐 Application Health Check${NC}"

# Check if backend is responding
if command -v curl &> /dev/null; then
    if curl -s --max-time 10 "$BACKEND_URL/health" > /dev/null; then
        echo -e "   ${GREEN}✅ Backend health endpoint responding${NC}"
        APP_HEALTH="healthy"
        
        # Get detailed health information
        HEALTH_RESPONSE=$(curl -s --max-time 10 "$BACKEND_URL/health")
        if [[ -n "$HEALTH_RESPONSE" ]]; then
            echo "   • Health endpoint accessible"
        fi
    else
        echo -e "   ${RED}❌ Backend health endpoint not responding${NC}"
        APP_HEALTH="unhealthy"
    fi
    
    # Check API documentation
    if curl -s --max-time 10 "$BACKEND_URL/docs" > /dev/null; then
        echo -e "   ${GREEN}✅ API documentation accessible${NC}"
    else
        echo -e "   ${YELLOW}⚠️  API documentation not accessible${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  curl not available, skipping HTTP checks${NC}"
    APP_HEALTH="unknown"
fi

# ============================================================================
# DATABASE HEALTH CHECKS
# ============================================================================

echo -e "${YELLOW}🗄️  Database Health Check${NC}"

# Check PostgreSQL connection
if command -v psql &> /dev/null; then
    # Extract database connection details
    if [[ -n "$DATABASE_URL" ]]; then
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        if [[ -n "$DB_HOST" && -n "$DB_PORT" && -n "$DB_NAME" ]]; then
            if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                echo -e "   ${GREEN}✅ PostgreSQL connection successful${NC}"
                DB_HEALTH="healthy"
                
                # Check database size
                DB_SIZE=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
                echo "   • Database size: $DB_SIZE"
                
                # Check active connections
                ACTIVE_CONNS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
                echo "   • Active connections: $ACTIVE_CONNS"
            else
                echo -e "   ${RED}❌ PostgreSQL connection failed${NC}"
                DB_HEALTH="unhealthy"
            fi
        else
            echo -e "   ${YELLOW}⚠️  Could not parse DATABASE_URL${NC}"
            DB_HEALTH="unknown"
        fi
    else
        echo -e "   ${YELLOW}⚠️  DATABASE_URL not set${NC}"
        DB_HEALTH="unknown"
    fi
else
    echo -e "   ${YELLOW}⚠️  psql not available, skipping database checks${NC}"
    DB_HEALTH="unknown"
fi

# ============================================================================
# REDIS HEALTH CHECKS
# ============================================================================

echo -e "${YELLOW}🔴 Redis Health Check${NC}"

# Check Redis connection
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Redis connection successful${NC}"
        REDIS_HEALTH="healthy"
        
        # Check Redis info
        REDIS_INFO=$(redis-cli info server | grep -E "(redis_version|uptime_in_seconds|connected_clients|used_memory_human)")
        echo "   • Redis info:"
        echo "$REDIS_INFO" | while read -r line; do
            if [[ -n "$line" ]]; then
                echo "     - $line"
            fi
        done
    else
        echo -e "   ${RED}❌ Redis connection failed${NC}"
        REDIS_HEALTH="unhealthy"
    fi
else
    echo -e "   ${YELLOW}⚠️  redis-cli not available, skipping Redis checks${NC}"
    REDIS_HEALTH="unknown"
fi

# ============================================================================
# LOG MONITORING
# ============================================================================

echo -e "${YELLOW}📝 Log Monitoring${NC}"

# Check recent log files
if [[ -d "$LOG_DIR" ]]; then
    LOG_FILES=$(find "$LOG_DIR" -name "*.log" -type f -mtime -1 2>/dev/null | head -5)
    if [[ -n "$LOG_FILES" ]]; then
        echo "   • Recent log files:"
        echo "$LOG_FILES" | while read -r log_file; do
            if [[ -f "$log_file" ]]; then
                LOG_SIZE=$(du -h "$log_file" | cut -f1)
                echo "     - $(basename "$log_file"): $LOG_SIZE"
            fi
        done
        
        # Check for errors in recent logs
        ERROR_COUNT=0
        for log_file in $LOG_FILES; do
            if [[ -f "$log_file" ]]; then
                ERRORS=$(grep -i "error\|exception\|traceback" "$log_file" 2>/dev/null | wc -l)
                ERROR_COUNT=$((ERROR_COUNT + ERRORS))
            fi
        done
        
        if [[ $ERROR_COUNT -gt 0 ]]; then
            echo -e "   ${YELLOW}⚠️  Found $ERROR_COUNT errors in recent logs${NC}"
        else
            echo -e "   ${GREEN}✅ No recent errors found in logs${NC}"
        fi
    else
        echo "   • No recent log files found"
    fi
else
    echo "   • Log directory not found: $LOG_DIR"
fi

# ============================================================================
# NETWORK AND PORT CHECKS
# ============================================================================

echo -e "${YELLOW}🌐 Network Health Check${NC}"

# Check if backend port is listening
if command -v netstat &> /dev/null; then
    if netstat -tlnp 2>/dev/null | grep ":8000 " > /dev/null; then
        echo -e "   ${GREEN}✅ Port 8000 is listening${NC}"
        PORT_HEALTH="healthy"
    else
        echo -e "   ${RED}❌ Port 8000 is not listening${NC}"
        PORT_HEALTH="unhealthy"
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp | grep ":8000 " > /dev/null; then
        echo -e "   ${GREEN}✅ Port 8000 is listening${NC}"
        PORT_HEALTH="healthy"
    else
        echo -e "   ${RED}❌ Port 8000 is not listening${NC}"
        PORT_HEALTH="unhealthy"
    fi
else
    echo -e "   ${YELLOW}⚠️  netstat/ss not available, skipping port checks${NC}"
    PORT_HEALTH="unknown"
fi

# ============================================================================
# PERFORMANCE METRICS
# ============================================================================

echo -e "${YELLOW}⚡ Performance Metrics${NC}"

# Check response time
if command -v curl &> /dev/null && [[ "$APP_HEALTH" == "healthy" ]]; then
    RESPONSE_TIME=$(curl -s -w "%{time_total}" --max-time 10 "$BACKEND_URL/health" -o /dev/null)
    if [[ -n "$RESPONSE_TIME" ]]; then
        echo "   • Health endpoint response time: ${RESPONSE_TIME}s"
        
        if (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
            echo -e "   ${YELLOW}⚠️  Slow response time detected${NC}"
        else
            echo -e "   ${GREEN}✅ Response time acceptable${NC}"
        fi
    fi
fi

# Check system load
if [[ -f /proc/loadavg ]]; then
    LOAD_AVG=$(cat /proc/loadavg | awk '{print $1, $2, $3}')
    CPU_CORES=$(nproc)
    echo "   • System load average: $LOAD_AVG"
    echo "   • CPU cores: $CPU_CORES"
    
    # Check if load is high
    LOAD_1=$(echo "$LOAD_AVG" | awk '{print $1}')
    if (( $(echo "$LOAD_1 > $CPU_CORES" | bc -l) )); then
        echo -e "   ${YELLOW}⚠️  High system load detected${NC}"
    else
        echo -e "   ${GREEN}✅ System load normal${NC}"
    fi
fi

# ============================================================================
# SECURITY CHECKS
# ============================================================================

echo -e "${YELLOW}🔒 Security Health Check${NC}"

# Check if running as root (security risk)
if [[ $EUID -eq 0 ]]; then
    echo -e "   ${RED}❌ Running as root (security risk)${NC}"
    SECURITY_HEALTH="unhealthy"
else
    echo -e "   ${GREEN}✅ Running as non-root user${NC}"
    SECURITY_HEALTH="healthy"
fi

# Check file permissions
if [[ -f "$ENV_FILE" ]]; then
    ENV_PERMS=$(stat -c "%a" "$ENV_FILE")
    if [[ "$ENV_PERMS" == "600" ]]; then
        echo -e "   ${GREEN}✅ Environment file permissions secure (600)${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Environment file permissions: $ENV_PERMS (should be 600)${NC}"
    fi
fi

# Check for open ports (basic security check)
if command -v netstat &> /dev/null; then
    OPEN_PORTS=$(netstat -tlnp 2>/dev/null | grep LISTEN | wc -l)
    echo "   • Open listening ports: $OPEN_PORTS"
    
    if [[ $OPEN_PORTS -gt 10 ]]; then
        echo -e "   ${YELLOW}⚠️  Many open ports detected${NC}"
    fi
fi

# ============================================================================
# OVERALL HEALTH ASSESSMENT
# ============================================================================

echo -e "${YELLOW}📋 Overall Health Assessment${NC}"

# Count healthy vs unhealthy components
HEALTHY_COUNT=0
UNHEALTHY_COUNT=0
UNKNOWN_COUNT=0

for component in CPU_HEALTH MEMORY_HEALTH DISK_HEALTH BACKEND_HEALTH APP_HEALTH DB_HEALTH REDIS_HEALTH PORT_HEALTH SECURITY_HEALTH; do
    case "${!component}" in
        "healthy")
            HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
            ;;
        "unhealthy")
            UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
            ;;
        *)
            UNKNOWN_COUNT=$((UNKNOWN_COUNT + 1))
            ;;
    esac
done

TOTAL_COMPONENTS=$((HEALTHY_COUNT + UNHEALTHY_COUNT + UNKNOWN_COUNT))
HEALTH_PERCENTAGE=$((HEALTHY_COUNT * 100 / TOTAL_COMPONENTS))

echo "   • Total components: $TOTAL_COMPONENTS"
echo "   • Healthy: $HEALTHY_COUNT"
echo "   • Unhealthy: $UNHEALTHY_COUNT"
echo "   • Unknown: $UNKNOWN_COUNT"
echo "   • Health score: ${HEALTH_PERCENTAGE}%"

# Determine overall status
if [[ $UNHEALTHY_COUNT -eq 0 ]]; then
    OVERALL_STATUS="healthy"
    echo -e "   ${GREEN}🎉 Overall Status: HEALTHY${NC}"
elif [[ $UNHEALTHY_COUNT -le 2 ]]; then
    OVERALL_STATUS="degraded"
    echo -e "   ${YELLOW}⚠️  Overall Status: DEGRADED${NC}"
else
    OVERALL_STATUS="unhealthy"
    echo -e "   ${RED}❌ Overall Status: UNHEALTHY${NC}"
fi

# ============================================================================
# RECOMMENDATIONS
# ============================================================================

echo -e "${YELLOW}💡 Recommendations${NC}"

if [[ "$CPU_HEALTH" == "unhealthy" ]]; then
    echo "   • Consider scaling up CPU resources or optimizing application"
fi

if [[ "$MEMORY_HEALTH" == "unhealthy" ]]; then
    echo "   • Check for memory leaks or consider increasing RAM"
fi

if [[ "$DISK_HEALTH" == "unhealthy" ]]; then
    echo "   • Clean up unnecessary files or increase disk space"
fi

if [[ "$BACKEND_HEALTH" == "unhealthy" ]]; then
    echo "   • Restart the backend service: ./deploy-production.sh"
fi

if [[ "$DB_HEALTH" == "unhealthy" ]]; then
    echo "   • Check database connection and restart if necessary"
fi

if [[ "$REDIS_HEALTH" == "unhealthy" ]]; then
    echo "   • Check Redis service: sudo systemctl status redis"
fi

if [[ "$SECURITY_HEALTH" == "unhealthy" ]]; then
    echo "   • Run the application as a non-root user"
fi

# ============================================================================
# ALERTING (if configured)
# ============================================================================

if [[ "$OVERALL_STATUS" == "unhealthy" ]]; then
    echo -e "${RED}🚨 CRITICAL: System is unhealthy - immediate attention required${NC}"
    # Add your alerting logic here (email, Slack, etc.)
    # Example: send_alert "System unhealthy: $UNHEALTHY_COUNT components failed"
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================

echo "=================================================="
echo -e "${BLUE}📊 Monitoring Summary - $TIMESTAMP${NC}"
echo "   • Overall Status: $OVERALL_STATUS"
echo "   • Health Score: ${HEALTH_PERCENTAGE}%"
echo "   • Backend: $BACKEND_URL"
echo "   • Logs: $LOG_DIR"
echo "   • PID: $PID_DIR"

# Save monitoring results to file
MONITORING_LOG="$LOG_DIR/monitoring-$(date '+%Y%m%d').log"
echo "[$TIMESTAMP] Status: $OVERALL_STATUS, Score: ${HEALTH_PERCENTAGE}%, Unhealthy: $UNHEALTHY_COUNT" >> "$MONITORING_LOG"

echo -e "${GREEN}✅ Monitoring completed${NC}"
echo "Results saved to: $MONITORING_LOG"

# Exit with appropriate code
if [[ "$OVERALL_STATUS" == "healthy" ]]; then
    exit 0
elif [[ "$OVERALL_STATUS" == "degraded" ]]; then
    exit 1
else
    exit 2
fi 