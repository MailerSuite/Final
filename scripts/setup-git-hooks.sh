#!/bin/bash

# Setup Git hooks for automatic synchronization
# This script sets up Git hooks to automatically sync when files change

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

log "Setting up Git hooks for automatic synchronization..."

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"

# Check if we're in a git repository
if [ ! -d "$HOOKS_DIR" ]; then
    error "Not in a git repository or .git/hooks directory not found"
    exit 1
fi

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

# Create pre-commit hook
log "Creating pre-commit hook..."
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Pre-commit hook for automatic synchronization

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"
AUTO_SYNC_SCRIPT="$REPO_ROOT/scripts/auto-sync.sh"

# Run auto-sync before commit
if [ -f "$AUTO_SYNC_SCRIPT" ]; then
    echo "Running automatic synchronization before commit..."
    "$AUTO_SYNC_SCRIPT"
fi
EOF

# Create post-commit hook
log "Creating post-commit hook..."
cat > "$HOOKS_DIR/post-commit" << 'EOF'
#!/bin/bash
# Post-commit hook for automatic synchronization

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"
AUTO_SYNC_SCRIPT="$REPO_ROOT/scripts/auto-sync.sh"

# Run auto-sync after commit
if [ -f "$AUTO_SYNC_SCRIPT" ]; then
    echo "Running automatic synchronization after commit..."
    "$AUTO_SYNC_SCRIPT"
fi
EOF

# Create post-merge hook
log "Creating post-merge hook..."
cat > "$HOOKS_DIR/post-merge" << 'EOF'
#!/bin/bash
# Post-merge hook for automatic synchronization

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"
AUTO_SYNC_SCRIPT="$REPO_ROOT/scripts/auto-sync.sh"

# Run auto-sync after merge
if [ -f "$AUTO_SYNC_SCRIPT" ]; then
    echo "Running automatic synchronization after merge..."
    "$AUTO_SYNC_SCRIPT"
fi
EOF

# Make all hooks executable
chmod +x "$HOOKS_DIR"/pre-commit
chmod +x "$HOOKS_DIR"/post-commit
chmod +x "$HOOKS_DIR"/post-merge

success "Git hooks installed successfully!"
log "The following hooks are now active:"
echo "  • pre-commit: Runs sync before each commit"
echo "  • post-commit: Runs sync after each commit"
echo "  • post-merge: Runs sync after each merge/pull"

echo ""
success "Git hooks for automatic synchronization are now set up!"
echo ""
echo "Now your repository will automatically sync:"
echo "  • Before each commit"
echo "  • After each commit"
echo "  • After each merge/pull"
echo ""
echo "To manually run sync: ./scripts/auto-sync.sh"
echo "To remove hooks: delete files in .git/hooks/ (pre-commit, post-commit, post-merge)"
