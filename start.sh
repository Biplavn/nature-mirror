#!/bin/bash

# Nature Mirror - Development Server Launcher
# Usage: ./start.sh

cd "$(dirname "$0")"

echo "🌿 Starting Nature Mirror..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting development server..."
echo "   Open http://localhost:5173 in your browser"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

npm run dev
