# Agent Service Error Fix Summary

## Issues Identified and Fixed

### 1. MongoDB Authentication Error ❌ → ✅
**Error:** `Authentication failed. (code: 18)`

**Root Cause:** 
- The agent service was using a local MongoDB connection string with basic authentication
- The actual setup uses MongoDB Atlas with different credentials

**Fix Applied:**
- Updated default MongoDB URI in `utils/mongo_client.py` to use MongoDB Atlas connection string
- Changed default database name from `airbnb_backend` to `airbnb_db`
- Updated `env.example` with correct defaults

**Files Modified:**
- `apps/agent-service/utils/mongo_client.py`
- `apps/agent-service/env.example`

### 2. Ollama Model Mismatch Error ❌ → ✅
**Error:** `model "llama3.1" not found, try pulling it first`

**Root Cause:**
- Docker-compose specified `llama3.2:1b` as the model
- Agent service code defaulted to `llama3` when environment variable wasn't set properly
- The running service was using an outdated default

**Fix Applied:**
- Updated default model in `utils/llm_client.py` from `llama3` to `llama3.2:1b`
- Updated `env.example` to reflect the correct model
- Updated docker-compose.yml to ensure proper health checks and dependencies

**Files Modified:**
- `apps/agent-service/utils/llm_client.py`
- `apps/agent-service/env.example`
- `docker-compose.yml`

### 3. Model Availability Issue ❌ → ✅
**Problem:** Ollama container may not have the required model pulled

**Fix Applied:**
- Created `init_ollama.sh` script to automatically check and pull the model
- Updated Dockerfile to run the initialization script on startup
- Added curl to Docker image for API health checks
- Configured proper health check dependencies in docker-compose

**Files Created/Modified:**
- `apps/agent-service/init_ollama.sh` (new)
- `apps/agent-service/Dockerfile`

## Summary of Changes

### Configuration Files Updated
1. **utils/mongo_client.py**
   - Default MongoDB URI: MongoDB Atlas connection
   - Default DB name: `airbnb_db`

2. **utils/llm_client.py**
   - Default Ollama model: `llama3.2:1b`

3. **docker-compose.yml**
   - Added `ALLOWED_ORIGINS` environment variable
   - Added health check dependency for Ollama service
   - Added restart policy for agent service
   - Improved health check timing for Ollama

4. **Dockerfile**
   - Added `curl` package for API checks
   - Updated CMD to run initialization script before starting server
   - Increased health check start period to 120s

### New Files Created
1. **init_ollama.sh**
   - Waits for Ollama service to be ready
   - Checks if model is available
   - Automatically pulls model if needed
   - Handles timeouts gracefully

## How to Apply the Fixes

### Option 1: Rebuild and Restart (Recommended)
```bash
# Stop the current containers
docker-compose down

# Rebuild the agent service
docker-compose build agent-service

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f agent-service
```

### Option 2: Quick Restart (if containers are already built)
```bash
# Restart just the agent service
docker-compose restart agent-service

# Monitor logs
docker-compose logs -f agent-service
```

### Option 3: Manual Pull of Ollama Model
If you want to pull the model manually first:
```bash
# Access the Ollama container
docker exec -it ollama bash

# Pull the model
ollama pull llama3.2:1b

# Exit
exit

# Restart agent service
docker-compose restart agent-service
```

## Expected Startup Logs (Healthy Service)

After the fixes, you should see:
```
🤖 Checking Ollama service...
✅ Ollama service is ready
✅ Model llama3.2:1b already available
🚀 Ollama initialization complete

🚀 Starting Airbnb AI Agent Service...
✅ MongoDB connection successful
✅ Ollama connection successful
📚 Loading policy documents...
✅ Policy documents loaded successfully
✅ Agent service ready!
```

## Verification Steps

1. **Check service health:**
   ```bash
   curl http://localhost:8000/health
   ```
   Expected: `{"status":"healthy"}`

2. **Check MongoDB connection:**
   ```bash
   docker-compose logs agent-service | grep MongoDB
   ```
   Should show: `✅ MongoDB connection successful`

3. **Check Ollama connection:**
   ```bash
   docker-compose logs agent-service | grep Ollama
   ```
   Should show: `✅ Ollama connection successful`

4. **Access API documentation:**
   Open browser: http://localhost:8000/docs

## Troubleshooting

### If MongoDB still fails:
1. Verify the MongoDB Atlas credentials in your `.env` file
2. Check if your IP is whitelisted in MongoDB Atlas
3. Test connection manually:
   ```bash
   docker exec -it agent-service python -c "from utils.mongo_client import mongo_client; print(mongo_client.test_connection())"
   ```

### If Ollama model pull is slow:
- The model is ~700MB, initial pull may take time
- Check progress: `docker-compose logs -f ollama`
- The service will start with fallback mode if model isn't ready immediately

### If service keeps restarting:
1. Check logs: `docker-compose logs agent-service`
2. Verify all environment variables are set correctly
3. Ensure Ollama container is healthy: `docker ps`

## Environment Variables Reference

Key environment variables for agent service:
```bash
MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority
MONGODB_DB_NAME=airbnb_db
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:1b
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5001
TAVILY_API_KEY=<your-key-if-needed>
```

## Testing the Fix

After applying fixes, test the chatbot:
1. Open the frontend: http://localhost:5173
2. Click on the AI chat icon
3. Try asking: "Tell me about my bookings"
4. The agent should respond without errors

## Notes

- The service now uses a fallback mode if Ollama is unavailable
- MongoDB Atlas connection requires internet access
- Policy documents are loaded from the `policies/` directory
- ChromaDB vector store is persisted in `chroma_db/` directory

## Date Fixed
November 20, 2025

