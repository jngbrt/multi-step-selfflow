#!/bin/bash

# Start Enhanced System with Database Integration
echo "🚀 Starting Enhanced Active Metadata Workflow System"
echo "===================================================="

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

# Check environment variables
echo "🔍 Checking database configuration..."
if [ -z "$UPSTASH_VECTOR_REST_URL" ] || [ -z "$UPSTASH_VECTOR_REST_TOKEN" ]; then
    echo "❌ Missing Upstash Vector environment variables"
    echo "Please set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN"
    exit 1
fi

echo "✅ Database configuration found"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install flask flask-cors pillow requests

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Test database connection
echo "🔍 Testing database connection..."
cd scripts
python -c "
from database_manager import DatabaseManager
try:
    db = DatabaseManager()
    stats = db.get_system_stats()
    print('✅ Database connection successful!')
    print(f'📊 Database status: {stats.get(\"database_status\", \"unknown\")}')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo "❌ Database test failed. Please check your configuration."
    exit 1
fi

# Start Enhanced API Bridge in background
echo "🔧 Starting Enhanced API Bridge with Database Integration..."
python enhanced_api_bridge.py &
API_PID=$!
cd ..

# Wait for API to start
sleep 3

# Start Next.js frontend
echo "🌐 Starting Enhanced Web Frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Enhanced System Started Successfully!"
echo "======================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:5000"
echo "🗄️  Database: Upstash Vector (Connected)"
echo ""
echo "📁 Repository: multi-step-selfflow (main:cd3a520)"
echo "⚙️  Workers: captioner, translator, resizer, optimizer"
echo "🔍 Features: Vector Search, Analytics, Persistence"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $API_PID $FRONTEND_PID; exit" INT
wait
