#!/bin/bash

# NARI Upgrade Engine (Neural Recalibration)
# Purpose: Automate the transition to the latest NARI version on Server-01.

set -e # Exit on error

# Configuration - Defensive Pathing
# Use the directory where the script lives as the source of truth
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

# 2. Update Backend
echo "🧠 [2/5] Recalibrating Backend & Database..."
cd "$BACKEND_DIR"
if command -v uv &> /dev/null; then
    uv sync
    uv run alembic upgrade head
else
    pip install -r pyproject.toml
    alembic upgrade head
fi

# 3. Build Frontend
echo "🎨 [3/5] Recompiling User Interface..."
cd "$FRONTEND_DIR"
npm install
npm run build

# 4. Robust Permission Protocol & Pulse
echo "🛡️ [4/5] Calibrating Neural Permissions..."
cd "$PROJECT_ROOT"

# Force Ownership to current user (the one running the script)
sudo chown -R $(whoami):$(whoami) "$PROJECT_ROOT"

# Set standard Directory (755) and File (644) permissions across the whole tree
sudo find "$PROJECT_ROOT" -type d -exec chmod 755 {} +
sudo find "$PROJECT_ROOT" -type f -exec chmod 644 {} +

# Grant Execute bits to operational scripts
sudo chmod +x "$PROJECT_ROOT"/*.sh
sudo chmod +x "$BACKEND_DIR"/run.py
sudo chmod +x "$PROJECT_ROOT"/cli/nari.py

# Ensure Database directory is fully writable by the system
sudo chmod -R 775 "$BACKEND_DIR/data"

# Ensure web assets are readable by Nginx
sudo chmod -R 755 "$FRONTEND_DIR/dist"

echo "⚡ Pulsing System Services..."
sudo systemctl restart nari
sudo systemctl reload nginx

# 5. Cleanup & Verification
echo "🧹 [5/5] Purging Tactical Remnants..."
cd "$PROJECT_ROOT"
rm -f check_db.py cleanup_proofs.py create_final_proof.py create_official_test.py create_official_test_v2.py debug_500.py ghost_test*.py

echo "✅ Neural Link Established."
echo "------------------------------------------------"
echo "NARI has been upgraded to the latest version."
echo "Backend: http://localhost:8000"
echo "Frontend: http://192.168.1.100"
echo "------------------------------------------------"
