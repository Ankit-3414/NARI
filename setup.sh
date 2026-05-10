#!/bin/bash
set -e

# NARI Master "One-Click" Installer
# Targets: Ubuntu 24.04 / Debian / Linux
# Purpose: Unified setup for development OR 24/7 server production

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check for Sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run as root (use sudo).${NC}"
  exit 1
fi

PROJECT_ROOT=$(pwd)
# Get the original user who called sudo
ORIGINAL_USER=${SUDO_USER:-$(whoami)}
HOME_DIR=$(getent passwd "$ORIGINAL_USER" | cut -d: -f6)

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}        🌌 NARI MASTER INSTALLER v1.0       ${NC}"
echo -e "${BLUE}==============================================${NC}"

# 1. System Dependencies
echo -e "${BLUE}[1/6] Installing System Core...${NC}"
apt update
apt install -y python3.12 python3.12-venv nodejs npm nginx sqlite3 curl git build-essential

# Install uv for the original user
echo -e "${BLUE}[2/6] Configuring Python Environment (uv)...${NC}"
if ! command -v uv &> /dev/null; then
    curl -LsSf https://astral.sh/uv/install.sh | sudo -u "$ORIGINAL_USER" sh
fi
# Add uv to path for this session
export PATH="$HOME_DIR/.local/bin:$PATH"

# 2. Backend Setup
echo -e "${BLUE}[3/6] Initializing Neural Core...${NC}"
cd "$PROJECT_ROOT/backend"
if [ ! -f .env ]; then
    sudo -u "$ORIGINAL_USER" cp .env.example .env
    echo "Using default Neural Link credentials."
fi
mkdir -p data
chown -R "$ORIGINAL_USER":"$ORIGINAL_USER" .
sudo -u "$ORIGINAL_USER" PATH="$PATH" uv sync
echo -e "${GREEN}Applying database migrations...${NC}"
sudo -u "$ORIGINAL_USER" PATH="$PATH" uv run alembic upgrade head

# 3. Frontend Build
echo -e "${BLUE}[4/6] Building Dashboard...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ ! -f .env ]; then
    sudo -u "$ORIGINAL_USER" cp .env.example .env
fi
chown -R "$ORIGINAL_USER":"$ORIGINAL_USER" .
sudo -u "$ORIGINAL_USER" npm install
sudo -u "$ORIGINAL_USER" npm run build
echo -e "${GREEN}Frontend build optimized for production.${NC}"

# 4. Nginx Configuration
echo -e "${BLUE}[5/6] Deploying Nginx Web Server...${NC}"
NGINX_CONF="
server {
    listen 80;
    server_name _; # Responds to all IPs

    root ${PROJECT_ROOT}/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"Upgrade\";
        proxy_set_header Host \$host;
    }
}"

echo "$NGINX_CONF" | tee /etc/nginx/sites-available/nari > /dev/null
ln -sf /etc/nginx/sites-available/nari /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 5. Systemd Service Configuration
echo -e "${BLUE}[6/6] Establishing 24/7 Background Pulse...${NC}"
SERVICE_CONF="[Unit]
Description=NARI Backend Engine
After=network.target

[Service]
User=${ORIGINAL_USER}
WorkingDirectory=${PROJECT_ROOT}/backend
ExecStart=${HOME_DIR}/.local/bin/uv run python run.py
Restart=always
RestartSec=5
Environment=PATH=${HOME_DIR}/.local/bin:/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target"

echo "$SERVICE_CONF" | tee /etc/systemd/system/nari.service > /dev/null
systemctl daemon-reload
systemctl enable nari
systemctl restart nari

# Set permissions for the root shell scripts
cd "$PROJECT_ROOT"
chmod +x nari.sh
chmod +x setup.sh

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}🚀 NARI IS ONLINE!${NC}"
echo -e "Dashboard Access: ${BLUE}http://$(hostname -I | awk '{print $1}')${NC}"
echo -e "Neural Link Key:  ${GREEN}neural_link_established${NC}"
echo -e "----------------------------------------------"
echo -e "To use the CLI:   ${BLUE}./nari.sh task list${NC}"
echo -e "To view logs:     ${BLUE}journalctl -u nari -f${NC}"
echo -e "${BLUE}==============================================${NC}"
