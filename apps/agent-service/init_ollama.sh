#!/bin/bash

# Script to ensure Ollama model is pulled and ready
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3.2:1b}"

echo "🤖 Checking Ollama service..."
echo "📍 URL: $OLLAMA_BASE_URL"
echo "🔍 Model: $OLLAMA_MODEL"

# Wait for Ollama service to be ready
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "${OLLAMA_BASE_URL}/api/tags" > /dev/null 2>&1; then
        echo "✅ Ollama service is ready"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for Ollama service... (${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Ollama service not available after ${MAX_RETRIES} attempts"
    echo "⚠️  Continuing anyway - service will use fallback mode"
    exit 0
fi

# Check if model is already pulled
echo "🔍 Checking if model ${OLLAMA_MODEL} is available..."
if curl -s "${OLLAMA_BASE_URL}/api/tags" | grep -q "\"${OLLAMA_MODEL}\""; then
    echo "✅ Model ${OLLAMA_MODEL} already available"
else
    echo "📥 Pulling model ${OLLAMA_MODEL}... (this may take a while)"
    
    # Pull the model
    curl -X POST "${OLLAMA_BASE_URL}/api/pull" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"${OLLAMA_MODEL}\"}" &
    
    PULL_PID=$!
    
    # Wait for pull to complete (with timeout)
    PULL_TIMEOUT=300  # 5 minutes
    ELAPSED=0
    
    while kill -0 $PULL_PID 2>/dev/null && [ $ELAPSED -lt $PULL_TIMEOUT ]; do
        sleep 5
        ELAPSED=$((ELAPSED + 5))
        echo "⏳ Still pulling... (${ELAPSED}s elapsed)"
    done
    
    if kill -0 $PULL_PID 2>/dev/null; then
        echo "⚠️  Model pull is taking longer than expected, continuing in background"
    else
        echo "✅ Model ${OLLAMA_MODEL} pulled successfully"
    fi
fi

echo "🚀 Ollama initialization complete"

