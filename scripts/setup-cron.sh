#!/bin/bash

# Setup cron job for automatic Git synchronization
# This script sets up a cron job to run auto-sync.sh every 5 minutes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "Setting up automatic Git synchronization cron job..."

# Get the absolute path to the auto-sync script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AUTO_SYNC_SCRIPT="$SCRIPT_DIR/auto-sync.sh"

# Check if auto-sync script exists
if [ ! -f "$AUTO_SYNC_SCRIPT" ]; then
    error "Auto-sync script not found at: $AUTO_SYNC_SCRIPT"
    exit 1
fi

# Make sure the script is executable
chmod +x "$AUTO_SYNC_SCRIPT"

# Create a temporary file for the cron job
TEMP_CRON=$(mktemp)

# Export PATH and other environment variables
echo "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" > "$TEMP_CRON"
echo "SHELL=/bin/bash" >> "$TEMP_CRON"
echo "HOME=$HOME" >> "$TEMP_CRON"
echo "" >> "$TEMP_CRON"

# Add the cron job to run every 5 minutes
echo "# Auto-sync Git repository every 5 minutes" >> "$TEMP_CRON"
echo "*/5 * * * * $AUTO_SYNC_SCRIPT >> $HOME/.auto-sync.log 2>&1" >> "$TEMP_CRON"

# Install the cron job
if crontab "$TEMP_CRON"; then
    success "Cron job installed successfully!"
    log "Git repository will be automatically synced every 5 minutes"
    log "Logs will be written to: $HOME/.auto-sync.log"
else
    error "Failed to install cron job"
    exit 1
fi

# Clean up temporary file
rm "$TEMP_CRON"

# Show current cron jobs
log "Current cron jobs:"
crontab -l

echo ""
success "Automatic Git synchronization is now set up!"
echo ""
echo "The system will now:"
echo "  • Sync your repository every 5 minutes"
echo "  • Automatically commit any uncommitted changes"
echo "  • Pull latest changes from remote"
echo "  • Push your changes to remote"
echo "  • Log all activities to: $HOME/.auto-sync.log"
echo ""
echo "To manually run sync: ./scripts/auto-sync.sh"
echo "To view logs: tail -f $HOME/.auto-sync.log"
echo "To remove cron job: crontab -e (then delete the auto-sync line)"
