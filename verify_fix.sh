#!/bin/bash

echo "Starting verification..."

# Function to check a service
check_service() {
    SERVICE_DIR=$1
    PORT=$2
    NAME=$3

    echo "----------------------------------------"
    echo "Checking $NAME on port $PORT..."
    
    cd "$SERVICE_DIR"
    # Start in background, redirect logs to /dev/null to keep output clean
    PORT=$PORT node server.js > /dev/null 2>&1 &
    PID=$!
    
    # Wait for startup
    sleep 3
    
    # Check root route
    RESPONSE=$(curl -s http://localhost:$PORT/)
    
    echo "Response: $RESPONSE"
    
    # Kill process
    kill $PID
    wait $PID 2>/dev/null
    
    cd - > /dev/null
}

# Check all services
check_service "apps/booking-service" 5004 "Booking Service"
check_service "apps/property-service" 5003 "Property Service"
check_service "apps/owner-service" 5002 "Owner Service"
check_service "apps/traveler-service" 5005 "Traveler Service"

echo "----------------------------------------"
echo "Verification complete."
