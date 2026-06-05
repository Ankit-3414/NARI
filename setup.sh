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
echo -e "${BLUE}[1/6] Installing System Core (Non-Interactive)...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt update
apt install -y python3.12 python3.12-venv nodejs npm nginx sqlite3 curl git build-essential systemd-timesyncd avahi-daemon

# Enable and start time synchronization and Avahi for mDNS (nari.local)
echo -e "${BLUE}Configuring System Services (Time & Hostname)...${NC}"
systemctl enable systemd-timesyncd
systemctl start systemd-timesyncd
timedatectl set-ntp true

systemctl enable avahi-daemon
systemctl start avahi-daemon
# Optionally set hostname to nari for consistency
# hostnamectl set-hostname nari

# Install uv for the original user
echo -e "${BLUE}[2/6] Configuring Python Environment (uv)...${NC}"
if ! sudo -u "$ORIGINAL_USER" [ -f "$HOME_DIR/.local/bin/uv" ]; then
    curl -LsSf https://astral.sh/uv/install.sh | sudo -u "$ORIGINAL_USER" sh
fi
# Add uv to path for this session
export PATH="$HOME_DIR/.local/bin:$PATH"

# 2. Backend Setup
echo -e "${BLUE}[3/6] Initializing Neural Core...${NC}"
cd "$PROJECT_ROOT/backend"
if [ ! -f .env ]; then
    sudo -u "$ORIGINAL_USER" cp .env.example .env
    
    # Generate dynamic secrets
    NEW_API_KEY=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
    NEW_SECRET_KEY=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 48)

    # Force 0.0.0.0 for network resilience and inject the new keys
    sed -i "s/NARI_HOST=.*/NARI_HOST=0.0.0.0/" .env
    sed -i "s/NARI_API_KEY=.*/NARI_API_KEY=$NEW_API_KEY/" .env
    sed -i "s/NARI_SECRET_KEY=.*/NARI_SECRET_KEY=$NEW_SECRET_KEY/" .env
    echo -e "${GREEN}Created backend .env with unique Neural secrets.${NC}"
fi
mkdir -p data
# Ensure the home directory and root project directory are accessible to Nginx (read/execute)
chmod a+x "$HOME_DIR"
chmod 755 "$PROJECT_ROOT"
chown -R "$ORIGINAL_USER":"$ORIGINAL_USER" "$PROJECT_ROOT"

echo -e "Installing Python dependencies..."
sudo -u "$ORIGINAL_USER" "$HOME_DIR/.local/bin/uv" sync
echo -e "${GREEN}Applying database migrations...${NC}"
sudo -u "$ORIGINAL_USER" "$HOME_DIR/.local/bin/uv" run alembic upgrade head

# 3. Frontend Build
echo -e "${BLUE}[4/6] Building Dashboard...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ ! -f .env ]; then
    # Retrieve the API key from backend .env to sync frontend
    EXTRACTED_KEY=$(grep "NARI_API_KEY=" "$PROJECT_ROOT/backend/.env" | cut -d'=' -f2)
    echo "VITE_NARI_API_KEY=$EXTRACTED_KEY" | sudo -u "$ORIGINAL_USER" tee .env > /dev/null
    echo -e "${GREEN}Created frontend .env (Handshake Synchronized).${NC}"
fi
chown -R "$ORIGINAL_USER":"$ORIGINAL_USER" .
sudo -u "$ORIGINAL_USER" npm install
sudo -u "$ORIGINAL_USER" npm run build
# Ensure dist is readable by Nginx
chmod -R 755 dist
echo -e "${GREEN}Frontend build optimized for production.${NC}"

# 4. Nginx Configuration
echo -e "${BLUE}[5/6] Deploying Nginx Web Server...${NC}"
# Detect primary IP
PRIMARY_IP=$(hostname -I | awk '{print $1}')

NGINX_CONF="
server {
    listen 80 default_server;
    server_name _;

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
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"Upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}"

echo "$NGINX_CONF" | tee /etc/nginx/sites-available/nari > /dev/null
ln -sf /etc/nginx/sites-available/nari /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 5. Systemd Service Configuration
echo -e "${BLUE}[6/6] Establishing 24/7 Background Pulse...${NC}"
SERVICE_CONF="[Unit]
Description=NARI Backend Engine
Wants=time-sync.target
After=network.target time-sync.target

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

# Final display
FINAL_API_KEY=$(grep "NARI_API_KEY=" "$PROJECT_ROOT/backend/.env" | cut -d'=' -f2)

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}🚀 NARI IS ONLINE!${NC}"
echo -e "Neural Hostname:  ${BLUE}http://nari.local${NC}"
echo -e "Dynamic IP:       ${BLUE}http://$PRIMARY_IP${NC}"
echo -e "Neural Link Key:  ${GREEN}$FINAL_API_KEY${NC}"
echo -e "----------------------------------------------"
echo -e "IMPORTANT: Save this key. It is required for CLI and Mobile access."
echo -e "To use the CLI:   ${BLUE}./nari.sh task list${NC}"
echo -e "To view logs:     ${BLUE}journalctl -u nari -f${NC}"
echo -e "${BLUE}==============================================${NC}"
