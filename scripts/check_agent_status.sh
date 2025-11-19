#!/bin/bash

# AI Agent Service Diagnostic Script
# Run this to check if everything is configured correctly

echo "🔍 AI Agent Service Diagnostics"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Backend
echo -n "1. Backend (Port 5000): "
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    echo "   → Start with: cd apps/backend && npm run dev"
fi

# Check 2: Agent Service
echo -n "2. Agent Service (Port 8000): "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    
    # Check health details
    HEALTH=$(curl -s http://localhost:8000/health)
    MONGODB_STATUS=$(echo "$HEALTH" | grep -o '"mongodb":"[^"]*"' | cut -d'"' -f4)
    OLLAMA_STATUS=$(echo "$HEALTH" | grep -o '"ollama":"[^"]*"' | cut -d'"' -f4)
    
    echo "   MongoDB: $MONGODB_STATUS"
    echo "   Ollama: $OLLAMA_STATUS"
else
    echo -e "${RED}❌ Not running${NC}"
    echo "   → Start with: cd apps/agent-service && source venv/bin/activate && python main.py"
fi

# Check 3: Ollama
echo -n "3. Ollama (Port 11434): "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
    
    # Check if llama3 is installed
    if curl -s http://localhost:11434/api/tags | grep -q "llama3"; then
        echo "   llama3 model: ✅ Installed"
    else
        echo -e "   llama3 model: ${RED}❌ Not installed${NC}"
        echo "   → Install with: ollama pull llama3"
    fi
else
    echo -e "${RED}❌ Not running${NC}"
    echo "   → Start with: ollama serve"
fi

# Check 4: MongoDB
echo -n "4. MongoDB Connection: "
if command -v mongosh > /dev/null 2>&1; then
    mongosh --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1 && echo -e "${GREEN}✅ Connected${NC}" || echo -e "${RED}❌ Cannot connect${NC}"
else
    echo -e "${YELLOW}⚠️  mongosh client not found${NC}"
fi

echo ""
echo "5. Environment Variables:"
if [ -f "apps/agent-service/.env" ]; then
    echo "   Agent .env exists: ✅"
    echo "   MONGODB_URI: $(grep MONGODB_URI apps/agent-service/.env 2>/dev/null | cut -d'=' -f2)"
    echo "   MONGODB_DB_NAME: $(grep MONGODB_DB_NAME apps/agent-service/.env 2>/dev/null | cut -d'=' -f2)"
    echo "   OLLAMA_MODEL: $(grep OLLAMA_MODEL apps/agent-service/.env 2>/dev/null | cut -d'=' -f2)"
else
    echo -e "   ${RED}❌ apps/agent-service/.env not found${NC}"
    echo "   → Copy from: cp apps/agent-service/.env.template apps/agent-service/.env"
fi

if [ -f "apps/backend/.env" ]; then
    echo "   Backend .env exists: ✅"
else
    echo -e "   ${RED}❌ apps/backend/.env not found${NC}"
fi

echo ""
echo "6. Secrets Match:"
if [ -f "apps/backend/.env" ] && [ -f "apps/agent-service/.env" ]; then
    BACKEND_SECRET=$(grep AGENT_SERVICE_SECRET apps/backend/.env 2>/dev/null | cut -d'=' -f2)
    AGENT_SECRET=$(grep AGENT_SERVICE_SECRET apps/agent-service/.env 2>/dev/null | cut -d'=' -f2)
    
    if [ "$BACKEND_SECRET" = "$AGENT_SECRET" ] && [ ! -z "$BACKEND_SECRET" ]; then
        echo -e "   ${GREEN}✅ Secrets match${NC}"
    else
        echo -e "   ${RED}❌ Secrets don't match or are empty!${NC}"
        echo "   Backend: '$BACKEND_SECRET'"
        echo "   Agent:   '$AGENT_SECRET'"
        echo "   → Fix: Make sure AGENT_SERVICE_SECRET is the same in both files"
    fi
else
    echo -e "   ${YELLOW}⚠️  Cannot check (missing .env files)${NC}"
fi

echo ""
echo "7. Python Dependencies:"
if [ -d "apps/agent-service/venv" ]; then
    echo -e "   Virtual environment: ${GREEN}✅ Exists${NC}"
else
    echo -e "   Virtual environment: ${RED}❌ Not found${NC}"
    echo "   → Create with: cd apps/agent-service && python -m venv venv"
fi

echo ""
echo "=================================="
echo ""
echo "📊 Summary:"
echo ""

# Count issues
ISSUES=0

curl -s http://localhost:5000/api/health > /dev/null 2>&1 || ((ISSUES++))
curl -s http://localhost:8000/health > /dev/null 2>&1 || ((ISSUES++))
curl -s http://localhost:11434/api/tags > /dev/null 2>&1 || ((ISSUES++))

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All services are running!${NC}"
    echo ""
    echo "If you're still getting errors, check:"
    echo "  1. Browser console (F12) for detailed error messages"
    echo "  2. Agent service logs for MongoDB/Ollama errors"
    echo "  3. TROUBLESHOOTING_AGENT.md for detailed guide"
else
    echo -e "${RED}❌ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Fix the issues above, then try again."
    echo "See TROUBLESHOOTING_AGENT.md for detailed help."
fi

echo ""

