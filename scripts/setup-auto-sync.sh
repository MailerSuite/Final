#!/bin/bash

# Comprehensive automatic Git synchronization setup
# This script sets up automatic Git synchronization using your preferred method

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Function to show menu
show_menu() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    Git Auto-Sync Setup                       ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Choose your preferred automatic synchronization method:"
    echo ""
    echo "1. Cron Job (Recommended)"
    echo "   • Syncs every 5 minutes automatically"
    echo "   • Works even when you're not actively using the repository"
    echo "   • Best for continuous synchronization"
    echo ""
    echo "2. Git Hooks"
    echo "   • Syncs before/after commits and merges"
    echo "   • Only runs when you perform Git operations"
    echo "   • Best for development workflow integration"
    echo ""
    echo "3. Both (Cron + Git Hooks)"
    echo "   • Combines both methods for maximum coverage"
    echo "   • Most comprehensive automatic synchronization"
    echo ""
    echo "4. Manual Sync Only"
    echo "   • Just install the sync script for manual use"
    echo "   • No automatic background syncing"
    echo ""
    echo "5. Exit"
    echo ""
}

# Function to setup cron job
setup_cron() {
    log "Setting up cron job for automatic synchronization..."
    if ./scripts/setup-cron.sh; then
        success "Cron job setup completed successfully!"
    else
        error "Failed to setup cron job"
        return 1
    fi
}

# Function to setup git hooks
setup_hooks() {
    log "Setting up Git hooks for automatic synchronization..."
    if ./scripts/setup-git-hooks.sh; then
        success "Git hooks setup completed successfully!"
    else
        error "Failed to setup Git hooks"
        return 1
    fi
}

# Function to test the sync script
test_sync() {
    log "Testing the auto-sync script..."
    if ./scripts/auto-sync.sh; then
        success "Auto-sync script test completed successfully!"
    else
        warning "Auto-sync script test had some issues (this might be normal)"
    fi
}

# Main setup function
main() {
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository. Please run this script from your Git repository root."
        exit 1
    fi

    # Check if required scripts exist
    if [ ! -f "./scripts/auto-sync.sh" ]; then
        error "Required script not found: ./scripts/auto-sync.sh"
        exit 1
    fi

    # Make sure all scripts are executable
    chmod +x scripts/*.sh

    # Show menu and get user choice
    while true; do
        show_menu
        read -p "Enter your choice (1-5): " choice

        case $choice in
            1)
                log "Setting up cron job only..."
                setup_cron
                break
                ;;
            2)
                log "Setting up Git hooks only..."
                setup_hooks
                break
                ;;
            3)
                log "Setting up both cron job and Git hooks..."
                setup_cron
                setup_hooks
                break
                ;;
            4)
                log "Setting up manual sync only..."
                test_sync
                break
                ;;
            5)
                log "Exiting setup..."
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice. Please enter a number between 1 and 5.${NC}"
                ;;
        esac
    done

    # Show final summary
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Setup Complete!                           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    success "Automatic Git synchronization has been configured!"
    echo ""
    echo "What happens now:"
    echo "  • Your repository will automatically stay in sync"
    echo "  • All changes will be committed and pushed automatically"
    echo "  • You'll always have the latest changes from remote"
    echo ""
    echo "Useful commands:"
    echo "  • Manual sync: ./scripts/auto-sync.sh"
    echo "  • View logs: tail -f ~/.auto-sync.log"
    echo "  • Check cron jobs: crontab -l"
    echo "  • Remove auto-sync: crontab -e (delete auto-sync line)"
    echo ""
    echo "The system will now keep your repository automatically synchronized!"
}

# Run main function
main "$@"
