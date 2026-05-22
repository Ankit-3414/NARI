#!/bin/bash

# NARI Upgrade Engine (Neural Recalibration)
# Purpose: Automate the transition to the latest NARI version on Server-01.

set -e # Exit on error

# Configuration
PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🌌 [NARI] Initiating System Upgrade..."

# 1. Pull latest code (Force sync to match GitHub source)
echo "📦 [1/5] Synchronizing Neural Repository..."
git fetch --all
git reset --hard origin/main

# 2. Update Backend Dependencies and Migrations
echo "🧠 [2/5] Recalibrating Backend & Database..."
cd "$BACKEND_DIR"
# Use absolute path for uv if possible, or assume it's in path
if command -v uv &> /dev/null; then
    uv sync
    echo "⚙️ Running Database Migrations..."
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

# 4. Permissions & Pulse
echo "🛡️ [4/5] Securing Neural Infrastructure..."
# Grant execute permissions to all operational scripts
chmod +x nari.sh
chmod +x setup.sh
chmod +x update.sh
chmod +x nari.bat
chmod +x nari.ps1

# Ensure web-accessible files are readable
chmod -R 755 "$FRONTEND_DIR/dist"

echo "⚡ Pulsing System Services..."
# The service is named 'nari' as per setup.sh
sudo systemctl restart nari
sudo systemctl reload nginx

# 5. Cleanup & Verification
echo "🧹 [5/5] Purging Tactical Remnants..."
rm -f check_db.py cleanup_proofs.py create_final_proof.py create_official_test.py create_official_test_v2.py debug_500.py ghost_test*.py

echo "✅ Neural Link Established."
echo "------------------------------------------------"
echo "NARI has been upgraded to the latest version."
echo "Backend: http://localhost:8000"
echo "Frontend: http://192.168.1.100"
echo "------------------------------------------------"
