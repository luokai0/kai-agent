#!/bin/bash
# =============================================================================
# KAI AGENT - QUICK START SCRIPT
# =============================================================================
# Double-click this file to start Kai Agent!

cd "$(dirname "$0")"

echo "Starting Kai Agent..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent 2>/dev/null || bun install --silent 2>/dev/null
fi

# Run the agent
echo "Launching Kai Agent CLI..."
echo ""

if command -v bun &> /dev/null; then
    bun run src/cli/start.ts
else
    npx tsx src/cli/start.ts
fi
