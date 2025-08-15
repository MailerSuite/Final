#!/bin/bash

# Auto-sync script for the Final repository
# This script monitors file changes and automatically syncs them to GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository path
REPO_PATH="/home/pc/Desktop/Final"
cd "$REPO_PATH"

echo -e "${BLUE}🚀 Starting auto-sync for Final repository...${NC}"
echo -e "${BLUE}📁 Repository: $REPO_PATH${NC}"
echo -e "${BLUE}🔗 Remote: $(git remote get-url origin | sed 's/.*@github\.com\//github.com\//')${NC}"
echo ""

# Function to sync changes
sync_changes() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check if there are any changes
    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${YELLOW}📝 Changes detected at $timestamp${NC}"
        
        # Add all changes
        git add .
        
        # Commit with timestamp
        git commit -m "Auto-sync: $timestamp - $(git status --porcelain | head -1 | cut -c4- | head -c50)..."
        
        # Push to remote
        echo -e "${BLUE}⬆️  Pushing changes...${NC}"
        if git push origin main; then
            echo -e "${GREEN}✅ Successfully synced at $timestamp${NC}"
        else
            echo -e "${RED}❌ Failed to push changes${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✨ No changes to sync at $timestamp${NC}"
    fi
}

# Function to check git status
check_status() {
    echo -e "${BLUE}📊 Current git status:${NC}"
    git status --short
    echo ""
}

# Function to show recent commits
show_recent_commits() {
    echo -e "${BLUE}📜 Recent commits:${NC}"
    git log --oneline -5
    echo ""
}

# Main sync loop
main() {
    echo -e "${GREEN}🔄 Auto-sync is running... Press Ctrl+C to stop${NC}"
    echo ""
    
    # Initial status check
    check_status
    show_recent_commits
    
    # Continuous monitoring
    while true; do
        # Sync any pending changes
        sync_changes
        
        # Wait for 30 seconds before next check
        sleep 30
        
        # Show status every 5 minutes
        if (( $(date +%s) % 300 == 0 )); then
            check_status
        fi
    done
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}🛑 Auto-sync stopped by user${NC}"; exit 0' INT TERM

# Start the main loop
main
