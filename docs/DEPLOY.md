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

## 7. Bypassing CGNAT and Exposing Securely (ngrok)

If your server is behind a Carrier-Grade NAT (CGNAT) or you cannot port-forward on your home router, you can expose NARI to the internet securely over HTTPS for free using **ngrok**. This is required to enable **PWA Web Push Notifications** on mobile devices.

### 1. Install and Configure ngrok
1. Sign up on [ngrok.com](https://ngrok.com) and get your free authtoken and static domain (e.g. `your-subdomain.ngrok-free.dev`).
2. Install ngrok via snap on the server:
   ```bash
   sudo snap install ngrok
   ```
3. Authenticate the ngrok client:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

### 2. Update Backend CORS Allowed Origins
1. Open your backend environment configuration:
   ```bash
   nano backend/.env
   ```
2. Add your ngrok domain (with `https://`) to `NARI_ALLOWED_ORIGINS`:
   ```env
   NARI_ALLOWED_ORIGINS=http://nari.local,https://your-subdomain.ngrok-free.dev
   ```
3. Restart NARI service:
   ```bash
   sudo systemctl restart nari
   ```

### 3. Automate ngrok to Run 24/7
1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/ngrok.service
   ```
2. Paste the following configuration:
   ```ini
   [Unit]
   Description=ngrok Secure Public Tunnel
   After=network.target nginx.service

   [Service]
   ExecStart=/snap/bin/ngrok http 80 --domain=your-subdomain.ngrok-free.dev
   Restart=always
   RestartSec=5
   User=qua39
   Group=qua39

   [Install]
   WantedBy=multi-user.target
   ```
3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable ngrok
   sudo systemctl start ngrok
   ```

