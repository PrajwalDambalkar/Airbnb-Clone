#!/bin/bash

# Script to test the agent service after fixes
echo "🧪 Testing Agent Service"
echo "========================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if service is running
echo "1️⃣  Checking if agent service container is running..."
if docker ps | grep -q agent-service; then
    echo -e "${GREEN}✅ Agent service container is running${NC}"
else
    echo -e "${RED}❌ Agent service container is not running${NC}"
    echo -e "${YELLOW}💡 Try: docker-compose up -d agent-service${NC}"
    exit 1
fi
echo ""

# Test 2: Check health endpoint
echo "2️⃣  Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health endpoint responding${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health endpoint not responding${NC}"
    echo -e "${YELLOW}💡 Check logs: docker-compose logs agent-service${NC}"
fi
echo ""

# Test 3: Check MongoDB connection in logs
echo "3️⃣  Checking MongoDB connection..."
if docker-compose logs agent-service 2>/dev/null | grep -q "MongoDB connection successful"; then
    echo -e "${GREEN}✅ MongoDB connected successfully${NC}"
elif docker-compose logs agent-service 2>/dev/null | grep -q "MongoDB connection failed"; then
    echo -e "${RED}❌ MongoDB connection failed${NC}"
    echo -e "${YELLOW}💡 Check MongoDB URI in environment variables${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB connection status unclear${NC}"
fi
echo ""

# Test 4: Check Ollama connection in logs
echo "4️⃣  Checking Ollama connection..."
if docker-compose logs agent-service 2>/dev/null | grep -q "Ollama connection successful"; then
    echo -e "${GREEN}✅ Ollama connected successfully${NC}"
elif docker-compose logs agent-service 2>/dev/null | grep -q "Ollama connection failed"; then
    echo -e "${RED}❌ Ollama connection failed${NC}"
    echo -e "${YELLOW}💡 Check if ollama container is running and model is pulled${NC}"
else
    echo -e "${YELLOW}⚠️  Ollama connection status unclear${NC}"
fi
echo ""

# Test 5: Check if Ollama container has the model
echo "5️⃣  Checking if Ollama has the required model..."
if docker exec ollama ollama list 2>/dev/null | grep -q "llama3.2"; then
    echo -e "${GREEN}✅ Ollama model llama3.2:1b is available${NC}"
else
    echo -e "${YELLOW}⚠️  Model may not be pulled yet${NC}"
    echo -e "${YELLOW}💡 Pull manually: docker exec -it ollama ollama pull llama3.2:1b${NC}"
fi
echo ""

# Test 6: Check recent errors in logs
echo "6️⃣  Checking for recent errors..."
ERROR_COUNT=$(docker-compose logs --tail=50 agent-service 2>/dev/null | grep -c "ERROR\|❌")
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No recent errors found${NC}"
else
    echo -e "${YELLOW}⚠️  Found $ERROR_COUNT error message(s) in recent logs${NC}"
    echo -e "${YELLOW}💡 View logs: docker-compose logs agent-service${NC}"
fi
echo ""

# Test 7: Test API endpoint
echo "7️⃣  Testing API endpoint (docs)..."
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs 2>/dev/null)
if [ "$DOCS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API documentation accessible at http://localhost:8000/docs${NC}"
else
    echo -e "${YELLOW}⚠️  API docs returned status: $DOCS_STATUS${NC}"
fi
echo ""

# Summary
echo "========================"
echo "📊 Test Summary"
echo "========================"
echo ""
echo "Service URL: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Health Check: http://localhost:8000/health"
echo ""
echo "To view full logs:"
echo "  docker-compose logs -f agent-service"
echo ""
echo "To restart the service:"
echo "  docker-compose restart agent-service"
echo ""
echo "To rebuild after changes:"
echo "  docker-compose build agent-service && docker-compose up -d agent-service"
echo ""

