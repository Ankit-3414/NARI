# NARI Backend

Stage 0 backend foundation for NARI.

## Setup

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv sync
Copy-Item .env.example .env
```

Update `NARI_API_KEY` in `.env` before running the server.

## Database

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv run alembic upgrade head
```

Alembic owns schema changes. Runtime startup only prepares SQLite directories,
applies WAL pragmas, and checks connectivity.

## Run

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv run python run.py
```

Health check:

```powershell
Invoke-RestMethod `
  -Uri http://192.168.1.100:8000/api/v1/health `
  -Headers @{ Authorization = 'Bearer changeme-your-api-key-here' }
```

## CLI

From the repo root:

```powershell
.\nari.ps1 add "Revise physics" --due today --priority high
.\nari.ps1 list
.\nari.ps1 done 1
```

If PowerShell script execution gets in the way, use the batch shim:

```powershell
.\nari.bat list
```

## Test

```powershell
$env:UV_CACHE_DIR='C:\tmp\uv-cache-nari'
uv run pytest
```
