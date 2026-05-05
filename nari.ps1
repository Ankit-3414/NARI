$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$cli = Join-Path $root "cli\nari.py"
$python = Join-Path $backend ".venv\Scripts\python.exe"

if (-not $env:UV_CACHE_DIR) {
    $env:UV_CACHE_DIR = "C:\tmp\uv-cache-nari"
}

Push-Location $backend
try {
    $venvWorks = $false
    if (Test-Path $python) {
        & $python -c "pass" *> $null
        $venvWorks = $LASTEXITCODE -eq 0
    }

    if ($venvWorks) {
        & $python $cli @args
    }
    else {
        uv run python $cli @args
    }
}
finally {
    Pop-Location
}
