#!/bin/bash

# Script to start backend service for JMeter testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Backend Service for JMeter Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker daemon is not running${NC}"
    echo ""
    echo "Please start Docker Desktop first, then run this script again."
    echo ""
    echo "Alternatively, start the backend locally:"
    echo "  cd $PROJECT_ROOT/apps/backend"
    echo "  npm start"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if backend container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^backend$"; then
    echo "Backend container exists. Checking status..."
    if docker ps --format '{{.Names}}' | grep -q "^backend$"; then
        echo -e "${GREEN}✓ Backend container is already running${NC}"
    else
        echo "Starting existing backend container..."
        docker start backend
    fi
else
    echo "Starting backend service with Docker Compose..."
    cd "$PROJECT_ROOT"
    docker-compose up -d backend
fi

echo ""
echo "Waiting for backend to be ready..."
sleep 3

# Check if backend is responding
MAX_RETRIES=10
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s -f http://localhost:5001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is responding on port 5001${NC}"
        echo ""
        echo -e "${YELLOW}⚠ IMPORTANT: Backend is running on port 5001${NC}"
        echo "   Your JMeter tests are configured for port 5000"
        echo ""
        echo "Options:"
        echo "1. Update JMeter BASE_URL to http://localhost:5001"
        echo "2. Or run backend locally on port 5000:"
        echo "   cd $PROJECT_ROOT/apps/backend && npm start"
        echo ""
        break
    else
        RETRY=$((RETRY + 1))
        echo "Waiting... ($RETRY/$MAX_RETRIES)"
        sleep 2
    fi
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠ Backend may still be starting. Check logs with:${NC}"
    echo "   docker logs backend"
fi

echo ""
echo "Backend service status:"
docker ps --filter "name=backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

