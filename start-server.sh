#!/bin/bash
# ConsultTrack Local Server Launcher
# Make executable: chmod +x start-server.sh
# Run: ./start-server.sh

echo ""
echo "================================================"
echo "  ConsultTrack — Starting Local Server..."
echo "================================================"
echo ""

cd "$(dirname "$0")"

# Try Python 3 first
if command -v python3 &>/dev/null; then
    echo "  Using Python 3..."
    python3 server.py
    exit 0
fi

# Try Python 2
if command -v python &>/dev/null; then
    echo "  Using Python..."
    python server.py
    exit 0
fi

# Try Node.js
if command -v node &>/dev/null; then
    echo "  Using Node.js..."
    node server.js
    exit 0
fi

echo "  ERROR: Python or Node.js is required."
echo "  Install Python from https://python.org"
echo "  or Node.js from https://nodejs.org"
echo ""
exit 1
