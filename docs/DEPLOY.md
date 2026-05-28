# NARI Server Migration and Deployment Guide

Use this guide to move NARI to a new Ubuntu 24.04 server or reinstall it on Server-01.

## 1. Prepare the Server

Ensure the server has:

- Ubuntu Server 24.04 or a compatible Debian-based distribution.
- Network access.
- A user with sudo permissions.
- The intended static or reserved IP address, usually `192.168.1.100` for Server-01.

## 2. Transfer the Codebase

Transfer the `NARI` folder to the server with `scp`, `rsync`, git, or a zip archive.

Example:

```bash
scp -r NARI user@192.168.1.100:/home/user/
```

## 3. Run One-Click Setup

On the server:

```bash
cd NARI
sudo chmod +x setup.sh
sudo ./setup.sh
```

The setup script installs required system packages, prepares Python dependencies with `uv`, runs Alembic migrations, builds the React frontend, configures Nginx, and creates the systemd service.

## 4. Port Existing Data

If moving an existing NARI instance:

1. Stop the backend service on the target server.
2. Copy the SQLite database into `backend/data/nari.db`.
3. Run migrations if needed.
4. Restart the service.

Typical commands:

```bash
sudo systemctl stop nari
cp nari.db backend/data/nari.db
cd backend
uv run alembic upgrade head
sudo systemctl restart nari
```

If your setup script creates a differently named service, use that service name consistently. The current one-click setup is expected to use `nari`.

## 5. Verify the Deployment

Open:

```text
http://192.168.1.100
```

Then verify:

- The frontend loads.
- The API key login works.
- `GET /api/v1/health` succeeds with the configured API key.
- WebSocket status turns connected.
- Browser notifications are permitted if reminders are used.

## 6. Maintenance Commands

```bash
sudo systemctl status nari
sudo journalctl -u nari -f
sudo systemctl restart nari
sudo ./update.sh
```

Use `update.sh` for production updates instead of manually chaining `git pull` and setup commands.
