#!/bin/bash

# Kai Agent - 2-Click Startup Script
# Click 1: chmod +x start.sh
# Click 2: ./start.sh

echo "Starting Kai Agent Phase 4..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Run the agent
bun run start.ts
