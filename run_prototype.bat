@echo off
title Jal Drishti • Geo Nexa Prototype Launcher
color 0b
echo ====================================================================
echo        JAL DRISHTI • GEO NEXA • SIH 2026 WORKING PROTOTYPE
echo   Problem Statement SIH26015 : Watershed Development & Geospatial AI
echo ====================================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in system PATH.
    echo Opening Standalone Frontend in default browser...
    start "" "%~dp0frontend\index.html"
    pause
    exit /b
)

echo [2/4] Launching Flask REST Backend on port 5000...
start "Jal Drishti Backend API" python backend\app.py

timeout /t 2 >nul

echo [3/4] Launching Multi-Device Cloudflare Tunnel for Mobile / Other PCs...
if exist "%~dp0cloudflared.exe" (
    start "Jal Drishti Multi-Device Tunnel" "%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:5000
)

echo [4/4] Opening Dashboard in default browser...
start http://127.0.0.1:5000

echo.
echo ====================================================================
echo   Prototype running successfully across ALL devices!
echo   Local PC:        http://127.0.0.1:5000
echo   Public / Mobile: Check the Cloudflare Tunnel window for the HTTPS URL!
echo ====================================================================
echo.
