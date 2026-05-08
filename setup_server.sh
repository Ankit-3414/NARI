#!/bin/bash
set -e

# NARI Unified Server Setup Script
# Targets: Ubuntu 24.04 / Debian
# Purpose: Full automation for 24/7 hosting at 192.168.1.240

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
SERVER_IP="192.168.1.240"
PROJECT_ROOT=$(pwd)
USER_NAME=$(whoami)
PYTHON_VERSION="3.12"

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}        NARI PROD SETUP (24/7 Server)       ${NC}"
echo -e "${BLUE}==============================================${NC}"

# 1. System Dependency Check & Installation
echo -e "${BLUE}[1/6] Installing System Dependencies...${NC}"
sudo apt update
sudo apt install -y python${PYTHON_VERSION} python${PYTHON_VERSION}-venv nodejs npm nginx sqlite3 curl git

# Install uv if missing
if ! command -v uv &> /dev/null; then
    echo -e "${BLUE}Installing uv package manager...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# 2. Backend Setup
echo -e "${BLUE}[2/6] Setting up Backend...${NC}"
cd "$PROJECT_ROOT/backend"
if [ ! -f .env ]; then
    cp .env.example .env
    # Set production defaults
    sed -i "s/NARI_ENV=development/NARI_ENV=production/g" .env
    sed -i "s/NARI_HOST=0.0.0.0/NARI_HOST=127.0.0.1/g" .env
    echo "Created backend/.env with production settings."
fi
mkdir -p data
uv sync
echo -e "${GREEN}Applying database migrations...${NC}"
uv run alembic upgrade head

# 3. Frontend Build
echo -e "${BLUE}[3/6] Building Frontend...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ ! -f .env ]; then
    echo "VITE_NARI_API_KEY=$(grep NARI_API_KEY ../backend/.env | cut -d '=' -f2)" > .env
    echo "Created frontend/.env from backend key."
fi
npm install
npm run build
echo -e "${GREEN}Frontend build complete.${NC}"

# 4. Nginx Configuration
echo -e "${BLUE}[4/6] Configuring Nginx for ${SERVER_IP}...${NC}"
NGINX_CONF="
server {
    listen 80;
    server_name ${SERVER_IP};

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

echo "$NGINX_CONF" | sudo tee /etc/nginx/sites-available/nari > /dev/null
sudo ln -sf /etc/nginx/sites-available/nari /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 5. Systemd Service Configuration
echo -e "${BLUE}[5/6] Creating Systemd Service for 24/7 Uptime...${NC}"
SERVICE_CONF="[Unit]
Description=NARI Backend Service
After=network.target

[Service]
User=${USER_NAME}
WorkingDirectory=${PROJECT_ROOT}/backend
ExecStart=${HOME}/.local/bin/uv run python run.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target"

echo "$SERVICE_CONF" | sudo tee /etc/systemd/system/nari-backend.service > /dev/null
sudo systemctl daemon-reload
sudo systemctl enable nari-backend
sudo systemctl restart nari-backend

# 6. Final Verification
echo -e "${BLUE}[6/6] Final Verification...${NC}"
echo -ne "Backend Status: "
if systemctl is-active --quiet nari-backend; then
    echo -e "${GREEN}ACTIVE${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

echo -ne "Nginx Status:   "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}ACTIVE${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}🚀 SETUP COMPLETE!${NC}"
echo -e "NARI is now live at: ${BLUE}http://${SERVER_IP}${NC}"
echo -e "The system will start automatically on reboot."
echo -e "${BLUE}==============================================${NC}"
