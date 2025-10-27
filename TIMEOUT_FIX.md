# AI Agent Timeout Fix

## Issue Diagnosed
The AI Travel Planner was returning a **504 Gateway Timeout** error after 60 seconds when trying to generate travel plans.

### Root Cause
- **Ollama LLM** takes 2-3 minutes to generate responses, especially on the first request
- Backend timeout was only **60 seconds** (too short)
- Frontend timeout was not explicitly set

## Solution Applied

### 1. Backend Timeout Increased
**File**: `apps/backend/controllers/agentController.js`

Changed axios timeout from 60 seconds to 5 minutes:
```javascript
// Before
timeout: 60000,  // 60 second timeout

// After
timeout: 300000,  // 5 minute timeout (Ollama can be slow on first request)
```

### 2. Frontend Timeout Added
**File**: `apps/frontend/src/services/api.ts`

Added explicit 5-minute timeout to axios instance:
```typescript
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 300000, // 5 minute timeout for AI agent requests
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## Services Restarted
- ✅ Backend (port 5001) - Restarted
- ✅ Frontend (port 5173) - Restarted  
- ✅ Agent Service (port 8000) - Already running with all services healthy

## Testing
All services are now ready:

**Check Agent Service Health:**
```bash
curl http://localhost:8000/health
```

Expected output:
```json
{
  "status": "healthy",
  "services": {
    "api": "healthy",
    "mysql": "connected",
    "ollama": "connected",
    "tavily": "configured"
  }
}
```

## What to Expect
1. **First Request**: May take 2-3 minutes (Ollama loads the model into memory)
2. **Subsequent Requests**: Should be faster (30-60 seconds)
3. **Frontend**: Shows "Generating your plan..." during processing
4. **Error Handling**: Now properly handles long-running requests

## Performance Tips
- First request after server restart is always slowest
- Ollama keeps the model in memory for faster subsequent requests
- Consider using a smaller/faster model if speed is critical
- Future enhancement: Add streaming responses for real-time updates

---
**Fixed**: October 25, 2025
**Issue**: 504 Gateway Timeout after 60 seconds
**Resolution**: Increased timeouts to 5 minutes across the stack

