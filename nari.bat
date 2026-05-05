@echo off
setlocal

if "%UV_CACHE_DIR%"=="" set "UV_CACHE_DIR=C:\tmp\uv-cache-nari"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0nari.ps1" %*
exit /b %ERRORLEVEL%
