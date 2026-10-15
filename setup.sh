#!/bin/bash
set -e

# NARI Master "One-Click" Installer
# Targets: Ubuntu 24.04 / Debian
# Purpose: Full first-time setup for 24/7 production server deployment.

# ─────────────────────────────────────────────
# Guards
# ─────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run as root (use sudo)."
    exit 1
fi

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
PROJECT_ROOT=$(pwd)
ORIGINAL_USER=${SUDO_USER:-$(whoami)}
HOME_DIR=$(getent passwd "$ORIGINAL_USER" | cut -d: -f6)

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BLUE}$1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       🌌 NARI MASTER INSTALLER v1.0          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo "📍 Project Root: $PROJECT_ROOT"
echo ""

# ─────────────────────────────────────────────
# [1/6] System Dependencies
# ─────────────────────────────────────────────
log "[1/6] Installing System Core..."
export DEBIAN_FRONTEND=noninteractive
apt update -qq
apt install -y python3.12 python3.12-venv nodejs npm nginx sqlite3 curl git \
    build-essential systemd-timesyncd avahi-daemon ufw

# Time sync
systemctl enable systemd-timesyncd
systemctl start systemd-timesyncd
timedatectl set-ntp true

# mDNS (nari.local)
systemctl enable avahi-daemon
systemctl start avahi-daemon

# Firewall
if command -v ufw &>/dev/null; then
    ufw allow 80/tcp  comment 'NARI HTTP'  || true
    ufw allow 443/tcp comment 'NARI HTTPS' || true
    ufw allow 5353/udp comment 'NARI mDNS' || true
    ufw --force enable || true
    ok "Firewall: 80, 443, 5353 open."
fi
ok "System dependencies installed."

# ─────────────────────────────────────────────
# [2/6] Python Environment
# ─────────────────────────────────────────────
log "[2/6] Configuring Python Environment (uv)..."
if ! sudo -u "$ORIGINAL_USER" [ -f "$HOME_DIR/.local/bin/uv" ]; then
    curl -LsSf https://astral.sh/uv/install.sh | sudo -u "$ORIGINAL_USER" sh
fi
export PATH="$HOME_DIR/.local/bin:$PATH"
ok "uv ready."

# ─────────────────────────────────────────────
# [3/6] Backend Setup
# ─────────────────────────────────────────────
log "[3/6] Initializing Neural Core (Backend)..."
cd "$PROJECT_ROOT/backend"

if [ ! -f .env ]; then
    sudo -u "$ORIGINAL_USER" cp .env.example .env

    # Generate unique secrets
    NEW_API_KEY=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
    NEW_SECRET_KEY=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 48)

    sed -i "s/NARI_HOST=.*/NARI_HOST=0.0.0.0/"             .env
    sed -i "s/NARI_API_KEY=.*/NARI_API_KEY=$NEW_API_KEY/"   .env
    sed -i "s/NARI_SECRET_KEY=.*/NARI_SECRET_KEY=$NEW_SECRET_KEY/" .env

    # The .env.example already has the correct NARI_ALLOWED_ORIGINS with the
    # ngrok URL pre-filled. If you have a different ngrok URL, update it now.
    # nari.local, nari.lan, nari.run.place are hardcoded in main.py — no action needed.

    ok "backend/.env created with unique secrets."
else
    warn "backend/.env already exists — skipping generation."
fi

mkdir -p data
chmod a+x "$HOME_DIR"
chmod 755 "$PROJECT_ROOT"
chown -R "$ORIGINAL_USER":"$ORIGINAL_USER" "$PROJECT_ROOT"

sudo -u "$ORIGINAL_USER" "$HOME_DIR/.local/bin/uv" sync
sudo -u "$ORIGINAL_USER" "$HOME_DIR/.local/bin/uv" run alembic upgrade head
ok "Backend dependencies and migrations complete."

# ─────────────────────────────────────────────
# [4/6] Frontend Build
# ─────────────────────────────────────────────
log "[4/6] Building Dashboard..."
cd "$PROJECT_ROOT/frontend"

if [ ! -f .env ]; then
    EXTRACTED_KEY=$(grep "NARI_API_KEY=" "$PROJECT_ROOT/backend/.env" | cut -d'=' -f2 | tr -d '\r')
    echo "VITE_NARI_API_KEY=$EXTRACTED_KEY" | sudo -u "$ORIGINAL_USER" tee .env > /dev/null
    ok "frontend/.env created (key synchronized)."
fi

chown -R "$ORIGINAL_USER":"$ORIGINAL_USER" .
sudo -u "$ORIGINAL_USER" npm install --silent
sudo -u "$ORIGINAL_USER" npm run build
chmod -R 755 dist
ok "Frontend built and ready."

# ─────────────────────────────────────────────
# [5/6] Nginx
# ─────────────────────────────────────────────
log "[5/6] Deploying Nginx Web Server..."

cat > /etc/nginx/sites-available/nari <<NGINX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root ${PROJECT_ROOT}/frontend/dist;
    index index.html;

    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 3600s;
    }

    # Static assets — long cache
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
}
NGINX

ln -sf /etc/nginx/sites-available/nari /etc/nginx/sites-enabled/nari
rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/nari-home
nginx -t && ok "Nginx config valid." || fail "Nginx config invalid."
systemctl restart nginx

# ─────────────────────────────────────────────
# [6/6] Systemd Service
# ─────────────────────────────────────────────
log "[6/6] Establishing 24/7 Background Pulse..."
cat > /etc/systemd/system/nari.service <<SERVICE
[Unit]
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
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable nari
systemctl restart nari

# Scripts
cd "$PROJECT_ROOT"
chmod +x nari.sh setup.sh update.sh
ok "systemd service active."

# ─────────────────────────────────────────────
# Final Summary
# ─────────────────────────────────────────────
FINAL_API_KEY=$(grep "NARI_API_KEY=" "$PROJECT_ROOT/backend/.env" | cut -d'=' -f2 | tr -d '\r')
PRIMARY_IP=$(hostname -I | awk '{print $1}')
NGROK_URL=$(grep "^NARI_ALLOWED_ORIGINS=" "$PROJECT_ROOT/backend/.env" 2>/dev/null | cut -d'=' -f2- | tr ',' '\n' | grep "ngrok" | head -1 | tr -d '\r')

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       🚀 NARI IS ONLINE!                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e " ${BLUE}Access Points:${NC}"
echo -e "   LAN (mDNS):   ${GREEN}http://nari.local${NC}"
echo -e "   LAN (Router): ${GREEN}http://nari.lan${NC}         ← set in router DNS"
echo -e "   LAN (IP):     ${GREEN}http://$PRIMARY_IP${NC}"
echo -e "   Public DDNS:  ${GREEN}http://nari.run.place${NC}"
echo -e "   Secure DDNS:  ${GREEN}https://nari.run.place${NC}  (after SSL setup)"
if [ -n "$NGROK_URL" ]; then
    echo -e "   ngrok Tunnel: ${GREEN}$NGROK_URL${NC}"
fi
echo ""
echo -e " ${BLUE}API Key:${NC}      ${GREEN}$FINAL_API_KEY${NC}"
echo -e " ${YELLOW}IMPORTANT: Save this key — required for CLI and mobile access.${NC}"
echo ""
echo -e " ${BLUE}Quick Commands:${NC}"
echo -e "   Logs:    journalctl -u nari -f"
echo -e "   Update:  sudo ./update.sh"
echo -e "   CLI:     ./nari.sh today"
echo ""
echo -e " ${BLUE}Optional — DDNS Auto-Update (for nari.run.place):${NC}"
echo -e "   Install the dnsexit client so nari.run.place stays in sync with your IP:"
echo -e "   https://dnsexit.com/Direct.sv?cmd=domainIpUpdate"
echo ""
