#!/bin/bash

# Start System - Launch both frontend and backend
echo "🚀 Starting Active Metadata Workflow System"
echo "============================================="

# Check dependencies
echo "📋 Checking dependencies..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check ExifTool
if ! command -v exiftool &> /dev/null; then
    echo "❌ ExifTool is required but not installed"
    echo "Install with: brew install exiftool (macOS) or apt-get install libimage-exiftool-perl (Ubuntu)"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

echo "✅ All dependencies found"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install flask flask-cors pillow

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Start API Bridge in background
echo "🔧 Starting API Bridge (Python backend)..."
cd scripts
python api_bridge.py &
API_PID=$!
cd ..

# Wait for API to start
sleep 3

# Start Next.js frontend
echo "🌐 Starting Web Frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 System Started Successfully!"
echo "================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:5000"
echo ""
echo "📁 Repository: multi-step-selfflow (main:cd3a520)"
echo "⚙️  Workers: captioner, translator, resizer, optimizer"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $API_PID $FRONTEND_PID; exit" INT
wait
