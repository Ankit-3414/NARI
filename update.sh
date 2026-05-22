#!/bin/bash

# NARI Upgrade Engine (Neural Recalibration)
# Purpose: Automate the transition to the latest NARI version on Server-01.

set -e # Exit on error

# Configuration - Defensive Pathing
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🌌 [NARI] Initiating System Upgrade..."
echo "📍 Root: $PROJECT_ROOT"

# 1. Pull latest code
echo "📦 [1/5] Synchronizing Neural Repository..."
cd "$PROJECT_ROOT"
git fetch --all
git reset --hard origin/main

# 1.5 System Dependencies (New Neural Protocols)
echo "🔧 Ensuring System Dependencies (avahi-daemon & ufw)..."
if ! command -v avahi-daemon &> /dev/null; then
    sudo apt update && sudo apt install -y avahi-daemon
    sudo systemctl enable avahi-daemon
    sudo systemctl start avahi-daemon
fi

# ENFORCE NEURAL IDENTITY (nari.local)
echo "🆔 Calibrating Neural Identity..."
CURRENT_HOSTNAME=$(hostname)
if [ "$CURRENT_HOSTNAME" != "nari" ]; then
    sudo hostnamectl set-hostname nari
    # Update /etc/hosts to prevent sudo delays
    if ! grep -q "127.0.1.1 nari" /etc/hosts; then
        echo "127.0.1.1 nari" | sudo tee -a /etc/hosts > /dev/null
    fi
    sudo systemctl restart avahi-daemon
    echo "✅ Hostname updated to 'nari'. Reconnect your SSH session if needed."
fi

# OPEN FIREWALL GATES
echo "🛡️ Opening Neural Gates (Firewall)..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp comment 'NARI HTTP' || true
    sudo ufw allow 5353/udp comment 'NARI mDNS' || true
fi

# 2. Robust Permission Protocol (PRIORITY)
echo "🛡️ [2/5] Calibrating Neural Permissions..."
cd "$PROJECT_ROOT"

# Force Ownership to current user
sudo chown -R $(whoami):$(whoami) "$PROJECT_ROOT"

# Set standard Directory (755) and File (644) permissions
sudo find "$PROJECT_ROOT" -type d -exec chmod 755 {} +
sudo find "$PROJECT_ROOT" -type f -exec chmod 644 {} +

# Grant Execute bits to operational scripts
sudo chmod +x "$PROJECT_ROOT"/*.sh
sudo chmod +x "$BACKEND_DIR"/run.py
sudo chmod +x "$PROJECT_ROOT"/cli/nari.py

# AUTHORIZE BINARIES (Python & Node)
echo "🔑 Authorizing environment binaries..."
[ -d "$BACKEND_DIR/.venv/bin" ] && sudo chmod +x "$BACKEND_DIR"/.venv/bin/* || true
[ -d "$FRONTEND_DIR/node_modules/.bin" ] && sudo chmod +x "$FRONTEND_DIR"/node_modules/.bin/* || true

# Ensure Database directory is fully writable
mkdir -p "$BACKEND_DIR/data"
sudo chmod -R 775 "$BACKEND_DIR/data"

# 3. Update Backend
echo "🧠 [3/5] Recalibrating Backend & Database..."
cd "$BACKEND_DIR"

# DYNAMIC CORS CALIBRATION
PRIMARY_IP=$(hostname -I | awk '{print $1}')
ALLOWED_ORIGINS="http://nari.local,http://server-01.local,http://$PRIMARY_IP"
if [ -f .env ]; then
    # Remove existing and add new to avoid duplicates
    sed -i "/NARI_ALLOWED_ORIGINS=/d" .env
    echo "NARI_ALLOWED_ORIGINS=$ALLOWED_ORIGINS" >> .env
fi

# RECALIBRATE NGINX (Dual Identity)
echo "🌐 Synchronizing Nginx Identity..."
NGINX_CONF="
server {
    listen 80;
    server_name nari.local server-01.local $PRIMARY_IP;

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
echo "$NGINX_CONF" | sudo tee /etc/nginx/sites-available/nari > /dev/null

if command -v uv &> /dev/null; then
    uv sync
    # Re-authorize after sync just in case
    sudo chmod +x "$BACKEND_DIR"/.venv/bin/*
    uv run alembic upgrade head
else
    pip install -r pyproject.toml
    alembic upgrade head
fi

# 4. Build Frontend
echo "🎨 [4/5] Recompiling User Interface..."
cd "$FRONTEND_DIR"
npm install
# Re-authorize after install to ensure vite/etc are executable
[ -d "node_modules/.bin" ] && sudo chmod +x node_modules/.bin/* || true
npm run build
# Ensure web assets are readable by Nginx
sudo chmod -R 755 "$FRONTEND_DIR/dist"

# 5. Pulse & Cleanup
echo "⚡ [5/5] Pulsing System Services..."
sudo systemctl restart nari
sudo systemctl reload nginx

echo "🧹 Purging Tactical Remnants..."
cd "$PROJECT_ROOT"
rm -f check_db.py cleanup_proofs.py create_final_proof.py create_official_test.py create_official_test_v2.py debug_500.py ghost_test*.py

# Final display
PRIMARY_IP=$(hostname -I | awk '{print $1}')

echo "✅ Neural Link Established."
echo "------------------------------------------------"
echo "NARI has been upgraded to the latest version."
echo "Neural Hostnames: http://nari.local"
echo "                  http://server-01.local"
echo "Dynamic IP:       http://$PRIMARY_IP"
echo "------------------------------------------------"
