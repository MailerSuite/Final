#!/bin/bash

# Setup script for auto-sync service
# This script installs and enables the auto-sync systemd service

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up auto-sync service...${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Get the current user
USER=$(whoami)
echo -e "${BLUE}👤 User: $USER${NC}"

# Update the service file with the correct user
sed -i "s/User=pc/User=$USER/g" scripts/auto-sync.service

# Copy service file to systemd directory
echo -e "${BLUE}📁 Installing systemd service...${NC}"
sudo cp scripts/auto-sync.service /etc/systemd/system/

# Reload systemd
echo -e "${BLUE}🔄 Reloading systemd...${NC}"
sudo systemctl daemon-reload

# Enable the service
echo -e "${BLUE}✅ Enabling auto-sync service...${NC}"
sudo systemctl enable auto-sync.service

# Start the service
echo -e "${BLUE}🚀 Starting auto-sync service...${NC}"
sudo systemctl start auto-sync.service

# Check service status
echo -e "${BLUE}📊 Service status:${NC}"
sudo systemctl status auto-sync.service --no-pager -l

echo ""
echo -e "${GREEN}✅ Auto-sync service setup complete!${NC}"
echo -e "${BLUE}📋 Useful commands:${NC}"
echo -e "  • Check status: ${YELLOW}sudo systemctl status auto-sync.service${NC}"
echo -e "  • Stop service: ${YELLOW}sudo systemctl stop auto-sync.service${NC}"
echo -e "  • Start service: ${YELLOW}sudo systemctl start auto-sync.service${NC}"
echo -e "  • View logs: ${YELLOW}journalctl -u auto-sync.service -f${NC}"
echo -e "  • Disable service: ${YELLOW}sudo systemctl disable auto-sync.service${NC}"
