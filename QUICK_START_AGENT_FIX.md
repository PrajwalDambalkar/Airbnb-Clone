# Quick Start: Agent Service Fix

## Problem Summary
The agent service had two critical errors:
1. ❌ **MongoDB Authentication Failed** - Wrong connection string
2. ❌ **Ollama Model Not Found** - Model name mismatch (llama3.1 vs llama3.2:1b)

## ✅ Fixed!

All issues have been resolved. Here's how to apply the fixes:

## Quick Fix (3 Steps)

### Step 1: Rebuild the Service
```bash
cd /Users/spartan/finaldemo/Airbnb-Clone
docker-compose build agent-service
```

### Step 2: Restart the Service
```bash
docker-compose up -d agent-service
```

### Step 3: Verify It's Working
```bash
# Check health
curl http://localhost:8000/health

# Or run our test script
./scripts/test_agent_service.sh
```

## Alternative: Use the Helper Script
```bash
./scripts/restart_agent_service.sh
```

## What Was Fixed?

### 1. MongoDB Connection
- **Before:** Used local MongoDB with basic auth
- **After:** Uses MongoDB Atlas with correct credentials
- **File:** `apps/agent-service/utils/mongo_client.py`

### 2. Ollama Model
- **Before:** Defaulted to `llama3` or `llama3.1`
- **After:** Uses `llama3.2:1b` (matches docker-compose)
- **File:** `apps/agent-service/utils/llm_client.py`

### 3. Auto-Initialize Ollama
- **New:** Created `init_ollama.sh` to auto-pull the model
- **Updated:** Dockerfile to run initialization before starting
- **Benefit:** Service automatically downloads the model if missing

## Expected Result

After restart, logs should show:
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

## Testing the Chatbot

1. Open frontend: http://localhost:5173
2. Login as a traveler
3. Click the chat icon
4. Ask: "What are my upcoming bookings?"
5. The AI should respond without errors! 🎉

## Troubleshooting

### If MongoDB still fails:
```bash
# Check if MongoDB Atlas credentials are correct
docker-compose logs agent-service | grep MongoDB
```

### If Ollama model is slow to download:
```bash
# The model is ~700MB, be patient on first run
# Check progress:
docker-compose logs -f ollama
```

### If service won't start:
```bash
# View full logs
docker-compose logs agent-service

# Force rebuild
docker-compose build --no-cache agent-service
docker-compose up -d agent-service
```

## Helper Scripts

We've created two helper scripts for you:

1. **Test the service:**
   ```bash
   ./scripts/test_agent_service.sh
   ```
   Runs 7 automated tests to verify everything is working

2. **Rebuild and restart:**
   ```bash
   ./scripts/restart_agent_service.sh
   ```
   One-command rebuild and restart with status checks

## Key URLs

- **Health Check:** http://localhost:8000/health
- **API Docs:** http://localhost:8000/docs
- **Frontend:** http://localhost:5173

## Files Modified

1. `apps/agent-service/utils/mongo_client.py` - Fixed MongoDB connection
2. `apps/agent-service/utils/llm_client.py` - Fixed Ollama model name
3. `apps/agent-service/env.example` - Updated defaults
4. `apps/agent-service/Dockerfile` - Added initialization
5. `docker-compose.yml` - Improved health checks and dependencies

## Files Created

1. `apps/agent-service/init_ollama.sh` - Auto-pull Ollama model
2. `scripts/test_agent_service.sh` - Test automation
3. `scripts/restart_agent_service.sh` - Quick restart helper
4. `AGENT_SERVICE_FIX.md` - Detailed documentation
5. `QUICK_START_AGENT_FIX.md` - This file

## Next Steps

1. Apply the fix (rebuild and restart)
2. Run the test script to verify
3. Test the chatbot in the frontend
4. If any issues persist, check the detailed documentation in `AGENT_SERVICE_FIX.md`

---

**Fixed on:** November 20, 2025  
**Status:** ✅ Ready to deploy

