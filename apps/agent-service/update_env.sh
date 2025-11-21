#!/bin/bash

# Script to update the .env file with correct values
ENV_FILE=".env"

echo "🔧 Updating Agent Service .env file..."
echo ""

# Backup existing .env if it exists
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backed up existing .env file"
fi

# Create new .env file with correct values
cat > "$ENV_FILE" << 'EOF'
# Server
AGENT_PORT=8000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000,http://localhost:5001

# Authentication
AGENT_SERVICE_SECRET=change-this-agent-secret

# MongoDB - Using MongoDB Atlas
MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority
MONGODB_DB_NAME=airbnb_db

# LangChain / Ollama - UPDATED MODEL
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
CHROMA_PERSIST_DIR=./chroma_db

# External APIs
TAVILY_API_KEY=

EOF

echo "✅ Updated .env file with correct values:"
echo "   - MongoDB: MongoDB Atlas (airbnb_db)"
echo "   - Ollama Model: llama3.2:1b"
echo ""
echo "🔍 Current .env contents:"
echo "----------------------------------------"
cat "$ENV_FILE"
echo "----------------------------------------"
echo ""
echo "🚀 To apply changes, restart the service:"
echo "   pkill -f 'uvicorn main:app' || true"
echo "   python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""


