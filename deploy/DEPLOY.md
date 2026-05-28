# NARI Manual Deployment Notes

The preferred production path is `setup.sh` for first install and `update.sh` for maintenance. This file documents the manual pieces those scripts manage.

## Frontend Build

```bash
cd frontend
npm install
npm run build
```

Nginx serves `frontend/dist`.

## Nginx

Copy or adapt the provided Nginx config:

```bash
sudo cp deploy/nari.nginx.conf /etc/nginx/sites-available/nari
sudo ln -s /etc/nginx/sites-available/nari /etc/nginx/sites-enabled/nari
sudo nginx -t
sudo systemctl restart nginx
```

Make sure the config points to the correct absolute `frontend/dist` path and proxies `/api` and `/ws` to the backend on port 8000.

## Backend Service

The one-click setup is expected to create a service named `nari`. If creating it manually:

```ini
[Unit]
Description=NARI Backend Service
After=network.target

[Service]
User=ankit
Group=www-data
WorkingDirectory=/home/ankit/NARI/backend
ExecStart=/home/ankit/.local/bin/uv run python run.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nari
sudo systemctl start nari
```

## Verification

Open:

```text
http://192.168.1.100
```

Confirm the frontend loads, API requests succeed, and WebSocket status is connected.
