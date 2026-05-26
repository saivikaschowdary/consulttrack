@echo off
title ConsultTrack Local Server
echo.
echo ================================================
echo   ConsultTrack — Starting Local Server...
echo ================================================
echo.

:: Try Python first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo   Using Python...
    python server.py
    goto :end
)

python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo   Using Python3...
    python3 server.py
    goto :end
)

:: Try Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo   Using Node.js...
    node server.js
    goto :end
)

echo   ERROR: Neither Python nor Node.js found.
echo   Please install Python from https://python.org
echo   or Node.js from https://nodejs.org
echo.
pause

:end
