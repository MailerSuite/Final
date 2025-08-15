#!/bin/bash

# One-time sync script for the Final repository
# This script immediately syncs all current changes

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting immediate sync...${NC}"

# Change to repository directory
cd /home/pc/Desktop/Final

# Check current status
echo -e "${BLUE}📊 Current status:${NC}"
git status --short

# Check if there are changes to sync
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}📝 Changes detected, syncing...${NC}"
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    git commit -m "Sync: $timestamp - $(git status --porcelain | head -1 | cut -c4- | head -c50)..."
    
    # Push to remote
    echo -e "${BLUE}⬆️  Pushing changes...${NC}"
    git push origin main
    
    echo -e "${GREEN}✅ Sync completed successfully!${NC}"
else
    echo -e "${GREEN}✨ No changes to sync${NC}"
fi

# Show final status
echo -e "${BLUE}📊 Final status:${NC}"
git status --short
