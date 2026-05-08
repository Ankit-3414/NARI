#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}        NARI Initialization (Linux)         ${NC}"
echo -e "${BLUE}==============================================${NC}"

# Check for Python 3.12
if ! command -v python3.12 &> /dev/null; then
    echo "Error: Python 3.12 is required but not found."
    echo "Please install it using: sudo apt update && sudo apt install python3.12 python3.12-venv"
    exit 1
fi

# Check for Node/NPM
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not found."
    echo "Please install it using: sudo apt install nodejs npm"
    exit 1
fi

# Install uv if not present
if ! command -v uv &> /dev/null; then
    echo -e "${BLUE}Installing uv (modern Python package manager)...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # Refresh shell environment for the current script
    export PATH="$HOME/.local/bin:$PATH"
fi

# Backend setup
echo -e "${BLUE}--- Setting up Backend ---${NC}"
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created backend/.env from example."
fi
mkdir -p data
uv sync
echo -e "${GREEN}Running database migrations...${NC}"
uv run alembic upgrade head
cd ..

# Frontend setup
echo -e "${BLUE}--- Setting up Frontend ---${NC}"
cd frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created frontend/.env from example."
fi
npm install
cd ..

# Script permissions
chmod +x nari.sh
chmod +x setup.sh

echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}    Setup complete! Welcome to NARI.        ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "To use the CLI: ${BLUE}./nari.sh <command>${NC}"
echo -e "To start backend: ${BLUE}cd backend && uv run python run.py${NC}"
echo -e "To start frontend: ${BLUE}cd frontend && npm run dev -- --host${NC}"
echo -e ""
echo -e "${BLUE}TIP:${NC} For 24/7 server hosting (Nginx + Systemd) at 192.168.1.240,"
echo -e "run: ${GREEN}sudo ./setup_server.sh${NC}"
echo -e "${BLUE}==============================================${NC}"
