#!/bin/bash
# Kai Agent - 2-Click Start Script
# 
# Click 1: chmod +x start-train.sh
# Click 2: ./start-train.sh

echo "🚀 Starting Kai Agent Training..."
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Run training
echo "🧠 Running training pipeline..."
bun run train.ts
