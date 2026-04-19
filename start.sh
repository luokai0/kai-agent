#!/bin/bash
# Kai Agent - Quick Start Script (2 Clicks)
# Run: ./start.sh

echo "🧠 Starting Kai Agent..."
cd "$(dirname "$0")"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install it first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Build and run
bun run build && bun run src/cli/start.ts
