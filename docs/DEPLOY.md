# NARI - Server Migration Guide

Follow these steps to port your NARI instance to a new server (Ubuntu 24.04).

## 1. Prepare the New Server
Ensure you have root access and the server is connected to the network.

## 2. Transfer the Codebase
Zip the `NARI` folder and transfer it to the server using `scp` or `rsync`.

```bash
# Example from your local machine
scp -r nari.zip user@192.168.1.100:/home/user/
```

## 3. The One-Click Installation
Once the code is on the server, unzip it, enter the directory, and run the deployment engine.

```bash
cd NARI
sudo chmod +x setup.sh
sudo ./setup.sh
```

**What this does:**
1. Installs Python 3.12, Node.js, Nginx, and SQLite.
2. Configures the Python virtual environment with `uv`.
3. Runs database migrations (`alembic`).
4. Builds the React dashboard for production.
5. Sets up the Nginx Reverse Proxy for the server's current IP.
6. Creates a `systemd` service to keep NARI running 24/7.

## 4. Porting Existing Data
If you have data on another machine:
1. Locate the SQLite database: `backend/data/nari.db`.
2. Copy it to the new server's `backend/data/` directory.
3. Restart the service: `sudo systemctl restart nari`.

## 5. Verification
After the script finishes, open your browser and navigate to:
`http://192.168.1.100`

Use the Neural Link key provided at the end of the installation.

## 6. Maintenance Commands
- **Check Status:** `sudo systemctl status nari`
- **View Live Logs:** `sudo journalctl -u nari -f`
- **Restart NARI:** `sudo systemctl restart nari`
- **Update Code:** `git pull && sudo ./setup.sh`
