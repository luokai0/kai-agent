@echo off
REM Kai Agent - Quick Start Script (2 Clicks)
REM Run: start.bat

echo 🧠 Starting Kai Agent...
cd /d "%~dp0"

REM Check if bun is installed
where bun >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Bun is not installed. Please install it first:
    echo    powershell -c "irm bun.sh/install.ps1 | iex"
    pause
    exit /b 1
)

REM Build and run
bun run build
bun run src/cli/start.ts

pause
