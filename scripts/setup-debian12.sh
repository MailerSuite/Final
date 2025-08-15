#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/workspace"
cd "$PROJECT_ROOT"

echo -e "${BLUE}🚀 MailerSuite2 - Debian 12 VPS Setup${NC}"

# Ensure we run as a sudo-capable user
if [[ $EUID -eq 0 ]]; then
	echo -e "${YELLOW}⚠️ Running as root. Proceeding...${NC}"
else
	if ! sudo -v >/dev/null 2>&1; then
		echo -e "${RED}❌ This script requires sudo privileges${NC}"
		exit 1
	fi
fi

# Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# Install base dependencies
sudo apt-get install -y curl ca-certificates gnupg lsb-release git jq make netcat-openbsd openssl

# Docker installation
if ! command -v docker >/dev/null 2>&1; then
	echo -e "${BLUE}🔧 Installing Docker Engine...${NC}"
	sudo install -m 0755 -d /etc/apt/keyrings
	curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
	sudo chmod a+r /etc/apt/keyrings/docker.gpg
	echo \
	  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
	  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
	  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
	sudo apt-get update -y
	sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
	sudo usermod -aG docker "$USER" || true
fi

# Compose plugin check
if ! docker compose version >/dev/null 2>&1; then
	echo -e "${RED}❌ Docker Compose plugin missing${NC}"
	exit 1
fi

# Ensure backend env.production exists
if [ ! -f "$PROJECT_ROOT/backend/env.production" ]; then
	echo -e "${YELLOW}📝 Creating backend/env.production with defaults${NC}"
	SECRET_KEY=$(openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-64)
	cat > "$PROJECT_ROOT/backend/env.production" <<EOF
ENVIRONMENT=production
DEBUG=False
HOST=0.0.0.0
PORT=8000
SECRET_KEY=$SECRET_KEY
DATABASE_URL=postgresql+asyncpg://mailersuite:mailersuite_secure_2024@postgres:5432/mailersuite2_prod
REDIS_URL=redis://redis:6379/0
ALLOWED_ORIGINS=http://localhost,http://127.0.0.1
EOF
fi

# Build and start with Docker Compose
cd "$PROJECT_ROOT"
echo -e "${BLUE}📦 Building Docker images...${NC}"
docker compose build

echo -e "${BLUE}🚀 Starting stack...${NC}"
docker compose up -d

echo -e "${BLUE}⏳ Waiting for backend health...${NC}"
sleep 5
if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
	echo -e "${GREEN}✅ Backend responds on http://127.0.0.1:8000${NC}"
else
	echo -e "${YELLOW}⚠️ Backend not responding yet. Check logs:${NC}"
	docker compose logs backend | tail -n 100 || true
fi

echo -e "${GREEN}🎉 Setup complete${NC}"
echo "Frontend:  http://$(hostname -I | awk '{print $1}'):80"
echo "Backend:   http://$(hostname -I | awk '{print $1}'):8000"
echo "Docs:      http://$(hostname -I | awk '{print $1}'):8000/docs"