#!/bin/bash

echo "🔄 Restarting Agent Service"
echo "=========================="
echo ""

# Kill existing uvicorn processes
echo "1️⃣  Stopping existing agent service processes..."
pkill -f "uvicorn main:app" 2>/dev/null
sleep 2

# Check if still running
if pgrep -f "uvicorn main:app" > /dev/null; then
    echo "⚠️  Force killing..."
    pkill -9 -f "uvicorn main:app" 2>/dev/null
    sleep 1
fi

echo "✅ Stopped existing processes"
echo ""

# Navigate to agent service directory
cd "$(dirname "$0")" || exit 1

echo "2️⃣  Starting agent service..."
echo "   Port: 8000"
echo "   Log file: agent.log"
echo ""

# Start the service in the background with logging
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > agent.log 2>&1 &

# Get the PID
SERVICE_PID=$!
echo "✅ Service started with PID: $SERVICE_PID"
echo ""

echo "3️⃣  Waiting for service to initialize..."
sleep 5

# Check if it's running
if ps -p $SERVICE_PID > /dev/null 2>&1; then
    echo "✅ Service is running!"
    echo ""
    
    # Test the health endpoint
    echo "4️⃣  Testing health endpoint..."
    sleep 2
    
    HEALTH_CHECK=$(curl -s http://localhost:8000/health 2>&1)
    if [ $? -eq 0 ]; then
        echo "✅ Health check passed: $HEALTH_CHECK"
    else
        echo "⚠️  Health check failed, but service is running"
        echo "   Check logs: tail -f agent.log"
    fi
else
    echo "❌ Service failed to start"
    echo "   Check logs: tail agent.log"
    exit 1
fi

echo ""
echo "=========================="
echo "📊 Service Status"
echo "=========================="
echo ""
echo "Service URL: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Health: http://localhost:8000/health"
echo ""
echo "View logs:"
echo "  tail -f agent.log"
echo ""
echo "Stop service:"
echo "  pkill -f 'uvicorn main:app'"
echo ""


