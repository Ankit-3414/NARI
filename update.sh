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

# 4. Robust Permission Protocol & Pulse
echo "🛡️ [4/5] Calibrating Neural Permissions..."
cd "$PROJECT_ROOT"

# Ensure the original user owns everything (prevents permission locked-out)
# We use sudo only if we aren't already root/owner
OWNER=$(ls -ld . | awk '{print $3}')
sudo chown -R "$OWNER":"$OWNER" "$PROJECT_ROOT"

# Set standard Directory (755) and File (644) permissions
find "$PROJECT_ROOT" -type d -exec chmod 755 {} +
find "$PROJECT_ROOT" -type f -exec chmod 644 {} +

# Grant Execute bits to all operational scripts and CLI
chmod +x *.sh
chmod +x backend/run.py
chmod +x cli/nari.py

# Ensure the database directory is WRITABLE by the system
chmod -R 775 "$BACKEND_DIR/data"

# Ensure web-accessible files are readable by Nginx
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
