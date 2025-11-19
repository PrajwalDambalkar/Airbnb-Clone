#!/bin/bash

# Start the AI Agent Service
echo "🤖 Starting AI Agent Service..."
echo "📍 Location: $(pwd)"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found"
    exit 1
fi

echo "✅ Python: $(python3 --version)"

# Check if uvicorn is installed
if ! python3 -c "import uvicorn" 2>/dev/null; then
    echo "❌ Uvicorn not installed. Installing dependencies..."
    pip3 install -r requirements.txt
fi

# Check environment variables
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating .env from example..."
cat > .env << 'EOF'
# Agent Service Secret (must match backend)
AGENT_SERVICE_SECRET=change-this-secret-in-production

# MongoDB
MONGODB_URI=mongodb://admin:Somalwar1!@localhost:27017/airbnb_backend?authSource=admin
MONGODB_DB_NAME=airbnb_backend

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Tavily API (for web search)
TAVILY_API_KEY=your_tavily_api_key_here

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db

# Environment
ENVIRONMENT=development
EOF
    echo "⚠️  Please edit .env and update the values!"
    echo ""
fi

echo ""
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📊 Health check: http://localhost:8000/health"
echo "📚 API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the server
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

