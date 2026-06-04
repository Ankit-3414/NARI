#!/bin/bash

# NARI Upgrade Engine (Neural Recalibration)
# Purpose: Automate the transition to the latest NARI version on Server-01.
# This script is designed to be fully autonomous ("Zero-Touch").

set -e # Exit on error

# Configuration - Defensive Pathing
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🌌 [NARI] Initiating System Upgrade..."
echo "📍 Root: $PROJECT_ROOT"

# 1. Pull latest code
echo "📦 [1/6] Synchronizing Neural Repository..."
cd "$PROJECT_ROOT"

# Resolve Git Ownership (Defensive)
git config --global --add safe.directory "$PROJECT_ROOT" || true

# Check if it's a git repo
if [ -d .git ]; then
    git fetch --all
    git reset --hard origin/main
fi

# 1.5 System Dependencies (Autonomous Dependency Management)
echo "🔧 [2/6] Ensuring System Core Dependencies..."
# Get the original user who called sudo (for uv pathing)
ORIGINAL_USER=${SUDO_USER:-$(whoami)}
HOME_DIR=$(getent passwd "$ORIGINAL_USER" | cut -d: -f6)

# Ensure uv is in the path for this script
export PATH="$HOME_DIR/.local/bin:$PATH"
# Ensure basic build tools and required services
export DEBIAN_FRONTEND=noninteractive
sudo apt update

# Fix for Node.js conflict: NodeSource provides npm inside nodejs package
# We install nodejs first, then check if npm is available
sudo apt install -y python3.12 python3.12-venv nodejs nginx sqlite3 curl git build-essential systemd-timesyncd avahi-daemon ufw

if ! command -v npm &> /dev/null; then
    echo "📦 npm not found in nodejs package, installing separately..."
    sudo apt install -y npm || true
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
    sudo ufw --force enable || true
fi

# 2. Docker & SearXNG (Self-Healing Search Infrastructure)
echo "🔍 [3/6] Synchronizing Local Meta-Search (SearXNG)..."

# Autonomous Docker Installation
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker not found. Commencing Autonomous Installation..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $(whoami)
    rm get-docker.sh
    echo "✅ Docker engine installed successfully."
fi

# Determine the correct docker compose command
DOCKER_COMPOSE="docker compose"
if ! docker compose version &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        echo "🐳 Installing Docker Compose plugin..."
        sudo apt install -y docker-compose-v2
    fi
fi

# Deploy/Update SearXNG
if [ -d "$PROJECT_ROOT/deploy/searxng" ]; then
    cd "$PROJECT_ROOT/deploy/searxng"
    # Ensure settings.yml is initialized if not present (defensive check)
    if [ ! -f settings.yml ]; then
        echo "⚠️ SearXNG settings missing. Reconstructing from template..."
        # Add a minimal default settings if missing
        cat > settings.yml <<EOF
use_default_settings: true
server:
  port: 8080
  bind_address: "0.0.0.0"
  secret_key: "$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)"
  base_url: http://localhost:8080/
search:
  formats: [html, json]
EOF
    fi
    # Replace default weak secret key with a secure, random 32-character key if the default key is found in settings.yml
    if [ -f settings.yml ]; then
        if grep -q "nari_searxng_secret_key_change_me" settings.yml; then
            echo "🔑 Generating secure random secret key for SearXNG..."
            RANDOM_SECRET=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
            sed -i "s/secret_key: \"nari_searxng_secret_key_change_me\"/secret_key: \"$RANDOM_SECRET\"/" settings.yml
        fi
    fi
    sudo $DOCKER_COMPOSE pull && sudo $DOCKER_COMPOSE up -d
    echo "✅ SearXNG Meta-Search is online and optimized."
fi

# 3. Robust Permission Protocol
echo "🛡️ [4/6] Calibrating Neural Permissions..."
cd "$PROJECT_ROOT"
# Force Ownership to current user
sudo chown -R $(whoami):$(whoami) "$PROJECT_ROOT"
# Set standard Directory (755) and File (644) permissions
sudo find "$PROJECT_ROOT" -type d -exec chmod 755 {} +
sudo find "$PROJECT_ROOT" -type f -exec chmod 644 {} +

# Lock down sensitive environment files and database files (Security Enhancement)
echo "🔒 Enforcing strict permissions on credential and database stores..."
[ -f "$BACKEND_DIR/.env" ] && chmod 600 "$BACKEND_DIR/.env"
[ -f "$FRONTEND_DIR/.env" ] && chmod 600 "$FRONTEND_DIR/.env"
[ -d "$BACKEND_DIR/data" ] && chmod 700 "$BACKEND_DIR/data"
[ -f "$BACKEND_DIR/data/nari.db" ] && chmod 600 "$BACKEND_DIR/data/nari.db"

# Ensure original user owns these files so the service can read them
sudo chown "$ORIGINAL_USER":"$ORIGINAL_USER" "$BACKEND_DIR/.env" "$FRONTEND_DIR/.env" "$BACKEND_DIR/data/nari.db" || true

# Grant Execute bits to operational scripts
sudo chmod +x "$PROJECT_ROOT"/*.sh
sudo chmod +x "$BACKEND_DIR"/run.py
sudo chmod +x "$PROJECT_ROOT"/cli/nari.py

# AUTHORIZE BINARIES (Python & Node)
[ -d "$BACKEND_DIR/.venv/bin" ] && sudo chmod +x "$BACKEND_DIR"/.venv/bin/* || true
[ -d "$FRONTEND_DIR/node_modules/.bin" ] && sudo chmod +x "$FRONTEND_DIR"/node_modules/.bin/* || true

# 4. Update Backend
echo "🧠 [5/6] Recalibrating Backend & Database..."
cd "$BACKEND_DIR"

# DYNAMIC ENVIRONMENT SYNC
PRIMARY_IP=$(hostname -I | awk '{print $1}')
ALLOWED_ORIGINS="http://nari.local,http://server-01.local,http://$PRIMARY_IP"
if [ -f .env ]; then
    # Synchronize Allowed Origins
    sed -i "/NARI_ALLOWED_ORIGINS=/d" .env
    echo "NARI_ALLOWED_ORIGINS=$ALLOWED_ORIGINS" >> .env
    
    # Ensure SEARXNG_URL is present
    if ! grep -q "SEARXNG_URL=" .env; then
        echo "SEARXNG_URL=http://localhost:8080" >> .env
    fi

    # HANDSHAKE SYNC: Propagate Backend API Key to Frontend
    EXTRACTED_KEY=$(grep "NARI_API_KEY=" .env | cut -d'=' -f2)
    if [ ! -z "$EXTRACTED_KEY" ]; then
        # Sync to Frontend (Vite bundles this for client-side access)
        if [ -d "$FRONTEND_DIR" ]; then
            if [ -f "$FRONTEND_DIR/.env" ]; then
                sed -i "s/VITE_NARI_API_KEY=.*/VITE_NARI_API_KEY=$EXTRACTED_KEY/" "$FRONTEND_DIR/.env"
            else
                echo "VITE_NARI_API_KEY=$EXTRACTED_KEY" > "$FRONTEND_DIR/.env"
            fi
            chmod 600 "$FRONTEND_DIR/.env"
        fi
    fi
fi

# RECALIBRATE NGINX
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
echo "✅ Nginx configuration updated."

echo "📦 Synchronizing Python dependencies and AI models (this may take a few minutes)..."
if command -v uv &> /dev/null; then
    uv sync --quiet
    sudo chmod +x "$BACKEND_DIR"/.venv/bin/*
    echo "⚙️ Running database migrations..."
    uv run alembic upgrade head
else
    # Fallback to standard pip if uv is not present
    pip install -r pyproject.toml --quiet
    echo "⚙️ Running database migrations..."
    alembic upgrade head
fi
echo "✅ Backend recalibration complete."

# 5. Build Frontend
echo "🎨 [6/6] Recompiling User Interface..."
cd "$FRONTEND_DIR"
npm install
[ -d "node_modules/.bin" ] && sudo chmod +x node_modules/.bin/* || true
npm run build
sudo chmod -R 755 "$FRONTEND_DIR/dist"

# 6. Pulse & Cleanup
echo "⚡ [7/7] Pulsing System Services & Neural Diagnostic..."
sudo systemctl daemon-reload
sudo systemctl restart nari
sudo systemctl reload nginx

# --- NEURAL DIAGNOSTIC PHASE ---
echo "🧠 Initiating Post-Update Validation..."
sleep 3 # Allow backend to bind and stabilize

# Extract API Key for Authenticated Health Check
EXTRACTED_KEY=$(grep "NARI_API_KEY=" "$BACKEND_DIR/.env" | cut -d'=' -f2)
PRIMARY_IP=$(hostname -I | awk '{print $1}')

check_service() {
    local name=$1
    local url=$2
    local expected=$3
    local auth=$4
    
    echo -n "🔍 Testing $name... "
    if [ ! -z "$auth" ]; then
        RESPONSE=$(curl -s -H "Authorization: Bearer $auth" "$url" | grep -o "$expected" || true)
    else
        RESPONSE=$(curl -s "$url" | grep -o "$expected" || true)
    fi

    if [ "$RESPONSE" == "$expected" ]; then
        echo -e "✅ [OK]"
        return 0
    else
        echo -e "❌ [FAILED]"
        return 1
    fi
}

# Run diagnostics
DIAG_ERRORS=0
check_service "Backend Health" "http://localhost:8000/api/v1/health" "healthy" "$EXTRACTED_KEY" || DIAG_ERRORS=$((DIAG_ERRORS+1))
check_service "Database Link" "http://localhost:8000/api/v1/health" "database\": \"ok" "$EXTRACTED_KEY" || DIAG_ERRORS=$((DIAG_ERRORS+1))
check_service "Nginx Frontend" "http://localhost/index.html" "NARI" || DIAG_ERRORS=$((DIAG_ERRORS+1))
check_service "SearXNG (Internal)" "http://localhost:8080" "SearXNG" || DIAG_ERRORS=$((DIAG_ERRORS+1))

if [ $DIAG_ERRORS -eq 0 ]; then
    echo -e "🛡️  System Integrity: VERIFIED."
else
    echo -e "⚠️  System Integrity: ANOMALIES DETECTED ($DIAG_ERRORS errors)."
    echo "Check logs with: journalctl -u nari -f"
fi

echo "🧹 Purging Tactical Remnants..."
cd "$PROJECT_ROOT"
rm -f check_db.py cleanup_proofs.py create_final_proof.py create_official_test.py create_official_test_v2.py debug_500.py ghost_test*.py mock_searxng.py test_web_search_utility.py

# Final display
echo "✅ Neural Link Re-established."
echo "------------------------------------------------"
echo "NARI has been upgraded to the latest version."
echo "Neural Hostnames: http://nari.local"
echo "                  http://server-01.local"
echo "Dynamic IP:       http://$PRIMARY_IP"
echo "Web Co-pilot:     SearXNG Active @ :8080"
echo "------------------------------------------------"
