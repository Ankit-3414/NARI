#!/bin/bash

# NARI Upgrade Engine (Neural Recalibration)
# Purpose: Automate the transition to the latest NARI version on Server-01.
# This script is designed to be fully autonomous ("Zero-Touch").

set -e

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

ORIGINAL_USER=${SUDO_USER:-$(whoami)}
HOME_DIR=$(getent passwd "$ORIGINAL_USER" | cut -d: -f6)
export PATH="$HOME_DIR/.local/bin:$PATH"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${BLUE}$1${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       🌌 NARI UPGRADE ENGINE v1.0            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo "📍 Root: $PROJECT_ROOT"
echo ""

# ─────────────────────────────────────────────
# [1/7] Pull Latest Code
# ─────────────────────────────────────────────
log "[1/7] Synchronizing Neural Repository..."
cd "$PROJECT_ROOT"
git config --global --add safe.directory "$PROJECT_ROOT" || true
if [ -d .git ]; then
    git fetch --all
    git reset --hard origin/main
    ok "Repository synchronized."
else
    warn "Not a git repository. Skipping pull."
fi

# ─────────────────────────────────────────────
# [2/7] System Dependencies
# ─────────────────────────────────────────────
log "[2/7] Ensuring System Core Dependencies..."
export DEBIAN_FRONTEND=noninteractive
sudo apt update -qq

sudo apt install -y python3.12 python3.12-venv nodejs nginx sqlite3 curl git \
    build-essential systemd-timesyncd avahi-daemon ufw

if ! command -v npm &>/dev/null; then
    warn "npm not found in nodejs package, installing separately..."
    sudo apt install -y npm || true
fi

# Enforce hostname → nari (powers nari.local via avahi mDNS)
CURRENT_HOSTNAME=$(hostname)
if [ "$CURRENT_HOSTNAME" != "nari" ]; then
    sudo hostnamectl set-hostname nari
    if ! grep -q "127.0.1.1 nari" /etc/hosts; then
        echo "127.0.1.1 nari" | sudo tee -a /etc/hosts > /dev/null
    fi
    sudo systemctl restart avahi-daemon
    ok "Hostname set to 'nari' → accessible via http://nari.local"
fi

# Firewall
if command -v ufw &>/dev/null; then
    sudo ufw allow 80/tcp  comment 'NARI HTTP'  || true
    sudo ufw allow 443/tcp comment 'NARI HTTPS' || true
    sudo ufw allow 5353/udp comment 'NARI mDNS' || true
    sudo ufw --force enable || true
    ok "Firewall: ports 80, 443, 5353 open."
fi

# ─────────────────────────────────────────────
# [3/7] Legacy Container Teardown
# ─────────────────────────────────────────────
SEARXNG_CONTAINERS=""
if command -v docker &>/dev/null; then
    SEARXNG_CONTAINERS=$(sudo docker ps -a --filter "name=searxng" -q 2>/dev/null || true)
fi

if [ -d "$PROJECT_ROOT/deploy/searxng" ] || [ -n "$SEARXNG_CONTAINERS" ]; then
    log "[3/7] Decommissioning legacy SearXNG Docker container..."
    if [ -d "$PROJECT_ROOT/deploy/searxng" ]; then
        cd "$PROJECT_ROOT/deploy/searxng"
        if command -v docker &>/dev/null; then
            sudo docker compose down -v 2>/dev/null || sudo docker-compose down -v 2>/dev/null || true
        fi
        cd "$PROJECT_ROOT"
        rm -rf "$PROJECT_ROOT/deploy/searxng"
    fi
    if [ -n "$SEARXNG_CONTAINERS" ]; then
        sudo docker stop $SEARXNG_CONTAINERS 2>/dev/null || true
        sudo docker rm -f $SEARXNG_CONTAINERS 2>/dev/null || true
    fi
    ok "SearXNG container decommissioned (freed server RAM)."
fi


# ─────────────────────────────────────────────
# [4/7] Permissions
# ─────────────────────────────────────────────
log "[4/7] Calibrating Neural Permissions..."
cd "$PROJECT_ROOT"
sudo chown -R "$ORIGINAL_USER":"$ORIGINAL_USER" "$PROJECT_ROOT"
find "$PROJECT_ROOT" -type d -exec chmod 755 {} +
find "$PROJECT_ROOT" -type f -exec chmod 644 {} +

# Sensitive files
[ -f "$BACKEND_DIR/.env" ]        && chmod 600 "$BACKEND_DIR/.env"
[ -f "$FRONTEND_DIR/.env" ]       && chmod 600 "$FRONTEND_DIR/.env"
[ -d "$BACKEND_DIR/data" ]        && chmod 700 "$BACKEND_DIR/data"
[ -f "$BACKEND_DIR/data/nari.db" ] && chmod 600 "$BACKEND_DIR/data/nari.db"

# Executable bits
chmod +x "$PROJECT_ROOT"/*.sh
chmod +x "$BACKEND_DIR/run.py"
[ -f "$PROJECT_ROOT/cli/nari.py" ] && chmod +x "$PROJECT_ROOT/cli/nari.py"
[ -d "$BACKEND_DIR/.venv/bin" ] && chmod +x "$BACKEND_DIR"/.venv/bin/* || true
[ -d "$FRONTEND_DIR/node_modules/.bin" ] && chmod +x "$FRONTEND_DIR"/node_modules/.bin/* || true
ok "Permissions calibrated."

# ─────────────────────────────────────────────
# [5/7] Backend Sync
# ─────────────────────────────────────────────
log "[5/7] Recalibrating Backend & Database..."
cd "$BACKEND_DIR"

# ── ENV SYNC ──
# IMPORTANT: We do NOT overwrite NARI_ALLOWED_ORIGINS here.
# The user's ngrok URL, nari.run.place, and nari.lan are already
# in main.py's hardcoded list. The .env NARI_ALLOWED_ORIGINS is
# additive for any extra origins the user set manually.
# Only ensure required keys exist without clobbering existing values.
if [ -f .env ]; then
    # Remove deprecated SEARXNG_URL if present
    if grep -q "^SEARXNG_URL=" .env; then
        sed -i '/^SEARXNG_URL=/d' .env
        ok "Removed deprecated SEARXNG_URL from .env"
    fi

    # Add AI_ENABLED if missing
    if ! grep -q "^AI_ENABLED=" .env; then
        echo "AI_ENABLED=false" >> .env
    fi

    # Propagate backend API key to frontend
    EXTRACTED_KEY=$(grep "^NARI_API_KEY=" .env | cut -d'=' -f2- | tr -d '\r"'"'" )
    if [ -n "$EXTRACTED_KEY" ] && [ -d "$FRONTEND_DIR" ]; then
        if [ -f "$FRONTEND_DIR/.env" ]; then
            sed -i "s/VITE_NARI_API_KEY=.*/VITE_NARI_API_KEY=$EXTRACTED_KEY/" "$FRONTEND_DIR/.env"
        else
            echo "VITE_NARI_API_KEY=$EXTRACTED_KEY" > "$FRONTEND_DIR/.env"
        fi
        chmod 600 "$FRONTEND_DIR/.env"
        ok "Frontend API key synchronized."
    fi
else
    warn "backend/.env not found — run setup.sh first."
fi

# ── NGINX ──
log "Synchronizing Nginx configuration..."
cat > /tmp/nari_nginx.conf <<NGINX
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

sudo cp /tmp/nari_nginx.conf /etc/nginx/sites-available/nari
sudo ln -sf /etc/nginx/sites-available/nari /etc/nginx/sites-enabled/nari
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/nari-home
sudo nginx -t && ok "Nginx config valid." || { fail "Nginx config invalid — check manually."; exit 1; }

# ── PYTHON DEPS & MIGRATIONS ──
log "Synchronizing Python dependencies..."
if command -v uv &>/dev/null; then
    uv sync --quiet
    sudo chmod +x "$BACKEND_DIR"/.venv/bin/* || true
    log "Running database migrations..."
    uv run alembic upgrade head
else
    warn "uv not found — falling back to pip..."
    pip install -r requirements.txt --quiet || true
    alembic upgrade head
fi
ok "Backend recalibrated."

# ─────────────────────────────────────────────
# [6/7] Frontend Build
# ─────────────────────────────────────────────
log "[6/7] Recompiling User Interface..."
cd "$FRONTEND_DIR"
npm install --silent
[ -d "node_modules/.bin" ] && sudo chmod +x node_modules/.bin/* || true
npm run build
sudo chmod -R 755 "$FRONTEND_DIR/dist"
ok "Frontend compiled."

# ─────────────────────────────────────────────
# [7/7] Restart Services & Neural Diagnostic
# ─────────────────────────────────────────────
log "[7/7] Pulsing System Services & Running Neural Diagnostic..."
sudo systemctl daemon-reload
sudo systemctl restart nari
sudo systemctl reload nginx

log "⏳ Waiting 12 seconds for service stabilization..."
sleep 12

EXTRACTED_KEY=$(grep "^NARI_API_KEY=" "$BACKEND_DIR/.env" | cut -d'=' -f2- | tr -d '\r"'"'" )
PRIMARY_IP=$(hostname -I | awk '{print $1}')

check_service() {
    local name="$1" url="$2" expected="$3" auth="$4"
    echo -n "   🔍 $name... "
    local RESP
    if [ -n "$auth" ]; then
        RESP=$(curl -s -m 8 -H "Authorization: Bearer $auth" "$url" 2>/dev/null || echo "curl_failed")
    else
        RESP=$(curl -s -m 8 "$url" 2>/dev/null || echo "curl_failed")
    fi
    if echo "$RESP" | grep -q "$expected"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

DIAG_ERRORS=0
check_service "Backend Health"   "http://127.0.0.1:8000/api/v1/health" "healthy"    "$EXTRACTED_KEY" || DIAG_ERRORS=$((DIAG_ERRORS+1))
check_service "Database"         "http://127.0.0.1:8000/api/v1/health" "database"   "$EXTRACTED_KEY" || DIAG_ERRORS=$((DIAG_ERRORS+1))
check_service "Nginx → Frontend" "http://127.0.0.1/index.html"         "nari\|NARI" ""               || DIAG_ERRORS=$((DIAG_ERRORS+1))

echo ""
if [ $DIAG_ERRORS -eq 0 ]; then
    echo -e "${GREEN}🛡️  System Integrity: VERIFIED — All systems nominal.${NC}"
else
    echo -e "${YELLOW}⚠️  System Integrity: $DIAG_ERRORS anomaly(s) detected.${NC}"
    echo "   → Run: journalctl -u nari -f"
fi

# Cleanup stale dev scripts
log "Purging tactical remnants..."
cd "$PROJECT_ROOT"
rm -f check_db.py cleanup_proofs.py create_final_proof.py create_official_test.py \
      create_official_test_v2.py debug_500.py ghost_test*.py mock_searxng.py \
      test_web_search_utility.py test_location_voter.mjs trigger_test_notification.py

# ─────────────────────────────────────────────
# Final Summary
# ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✅ NARI UPGRADED SUCCESSFULLY          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e " ${BLUE}Access Points:${NC}"
echo -e "   LAN (mDNS):   ${GREEN}http://nari.local${NC}"
echo -e "   LAN (Router): ${GREEN}http://nari.lan${NC}"
echo -e "   LAN (IP):     ${GREEN}http://$PRIMARY_IP${NC}"
echo -e "   Public DDNS:  ${GREEN}http://nari.run.place${NC}"
echo -e "   Secure DDNS:  ${GREEN}https://nari.run.place${NC}  (if SSL configured)"
NGROK_URL=$(grep "^NARI_ALLOWED_ORIGINS=" "$BACKEND_DIR/.env" 2>/dev/null | cut -d'=' -f2- | tr ',' '\n' | grep "ngrok" | head -1 | tr -d '\r')
if [ -n "$NGROK_URL" ]; then
    echo -e "   ngrok Tunnel: ${GREEN}$NGROK_URL${NC}"
fi
echo ""
echo -e " ${BLUE}API Key:${NC}      ${GREEN}$EXTRACTED_KEY${NC}"
echo -e " ${BLUE}Logs:${NC}         journalctl -u nari -f"
echo -e " ${BLUE}Web Research:${NC} Keyless Engine (DDG + Jina + LLaMA Reasoning)"
echo ""
