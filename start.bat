@echo off
REM =============================================================================
REM KAI AGENT - QUICK START SCRIPT FOR WINDOWS
REM =============================================================================
REM Double-click this file to start Kai Agent!

cd /d "%~dp0"

echo Starting Kai Agent...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install --silent 2>nul
)

echo Launching Kai Agent CLI...
echo.

npx tsx src/cli/start.ts

pause
