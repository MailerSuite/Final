#!/bin/bash

# Auto-sync Git repository script
# This script automatically syncs your local repository with the remote

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
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

# Change to the repository directory
cd "$(dirname "$0")/.." || {
    error "Failed to change to repository directory"
    exit 1
}

log "Starting automatic Git synchronization..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
log "Current branch: $CURRENT_BRANCH"

# Check if there are any uncommitted changes
if git diff-index --quiet HEAD --; then
    log "No uncommitted changes detected"
else
    log "Uncommitted changes detected, staging all files..."
    git add -A
    
    # Create commit message with timestamp
    COMMIT_MSG="Auto-sync: $(date '+%Y-%m-%d %H:%M:%S') - Automated synchronization"
    
    log "Committing changes..."
    if git commit -m "$COMMIT_MSG"; then
        success "Changes committed successfully"
    else
        error "Failed to commit changes"
        exit 1
    fi
fi

# Pull latest changes from remote
log "Pulling latest changes from remote..."
if git pull origin "$CURRENT_BRANCH"; then
    success "Successfully pulled latest changes"
else
    warning "Failed to pull changes (this might be normal if no new changes)"
fi

# Push changes to remote
log "Pushing changes to remote..."
if git push origin "$CURRENT_BRANCH"; then
    success "Successfully pushed changes to remote"
else
    warning "Failed to push changes (this might be normal if no new changes)"
fi

# Show final status
log "Final repository status:"
git status --short

success "Automatic Git synchronization completed successfully!"
