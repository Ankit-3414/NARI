# 🚀 NARI Deployment Guide (Home Server)

This guide explains how to host NARI permanently on your home server (e.g., Ubuntu/Debian) at `192.168.1.100`.

## 1. Build the Frontend
On your server, go to the frontend directory and build the production files:
```bash
cd frontend
npm install
npm run build
```
This creates a `dist/` folder. This is what Nginx will serve.

## 2. Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

## 3. Apply Nginx Configuration
Copy the provided config to Nginx's available sites:
```bash
sudo cp deploy/nari.nginx.conf /etc/nginx/sites-available/nari
```
**Edit the config** to match your server's folder path:
```bash
sudo nano /etc/nginx/sites-available/nari
# Change the 'root' line to point to your /home/ankit/NARI/frontend/dist
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/nari /etc/nginx/sites-enabled/
sudo nginx -t  # Test the config
sudo systemctl restart nginx
```

## 4. Run the Backend as a Service (Systemd)
To keep the backend running forever, create a service file:
```bash
sudo nano /etc/systemd/system/nari-backend.service
```
Paste this:
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

Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nari-backend
sudo systemctl start nari-backend
```

## 🏁 Done!
You can now access NARI at `http://192.168.1.100` from any device on your network without needing to type any port numbers.
