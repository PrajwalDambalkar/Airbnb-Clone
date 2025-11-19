# AI Agent Troubleshooting Guide

## Error: "Failed to generate travel plan. Please try again."

This error can have multiple causes. Follow these steps to diagnose and fix:

---

## ✅ Step 1: Check if Agent Service is Running

### Test Command:
```bash
curl http://localhost:8000/health
```

### Expected Response:
```json
{
  "status": "healthy",
  "services": {
    "api": "healthy",
    "mongodb": "connected",
    "ollama": "connected"
  }
}
```

### If you get "Connection refused":
**Problem**: Agent service is not running

**Solution**:
```bash
cd apps/agent-service
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows
python main.py
```

---

## ✅ Step 2: Check MongoDB Connection

### Test Command:
```bash
curl http://localhost:8000/test-mongodb
```

### Expected Response:
```json
{
  "status": "success",
  "message": "MongoDB connection successful"
}
```

### If MongoDB fails:

**Check 1: Is MongoDB reachable from the agent container?**
```bash
docker compose exec agent-service python - <<'PY'
from utils.mongo_client import mongo_client
print("connected" if mongo_client.test_connection() else "failed")
PY
```

**Check 2: Are credentials correct in .env?**
```bash
grep MONGODB apps/agent-service/.env
```

Should show:
```
MONGODB_URI=mongodb://admin:Somalwar1!@localhost:27017/airbnb_backend?authSource=admin
MONGODB_DB_NAME=airbnb_backend
```

**Fix**:
```bash
# Update .env file
nano apps/agent-service/.env

# Make sure MONGODB_URI points to the correct database
```

---

## ✅ Step 3: Check Ollama

### Test Command:
```bash
curl http://localhost:8000/test-ollama
```

### Expected Response:
```json
{
  "status": "success",
  "model": "llama3",
  "response": "Hello! ..."
}
```

### If Ollama fails:

**Check 1: Is Ollama running?**
```bash
curl http://localhost:11434/api/tags
```

**Check 2: Is Llama3 model downloaded?**
```bash
ollama list
```

**Fix**:
```bash
# Start Ollama
ollama serve

# In another terminal, download model
ollama pull llama3
```

---

## ✅ Step 4: Check Backend Connection to Agent

### Check Backend .env:
```bash
cat apps/backend/.env | grep AGENT
```

Should show:
```
AGENT_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_SECRET=your-secret
```

### Check Secrets Match:
```bash
# Backend secret
grep AGENT_SERVICE_SECRET apps/backend/.env

# Agent secret
grep AGENT_SERVICE_SECRET apps/agent-service/.env

# These MUST be identical!
```

**Fix**:
```bash
# Update both files to use same secret
echo "AGENT_SERVICE_SECRET=my-secret-123" >> apps/backend/.env
echo "AGENT_SERVICE_SECRET=my-secret-123" >> apps/agent-service/.env
```

---

## ✅ Step 5: Check Booking Exists

### In MongoDB:
```bash
mongosh "mongodb://admin:Somalwar1!@localhost:27017/airbnb_backend?authSource=admin"
```

```javascript
// Check your bookings
db.bookings.aggregate([
  { $match: { traveler_id: ObjectId("YOUR_USER_ID") } },
  { $lookup: { from: "properties", localField: "property_id", foreignField: "_id", as: "property" } },
  { $unwind: "$property" },
  { $project: { status: 1, "property.property_name": 1, "property.city": 1, "property.state": 1 } }
]).pretty()

// Ensure status is ACCEPTED or PENDING and note the booking _id
```

---

## ✅ Step 6: View Logs

### Backend Logs (Terminal 1):
Look for:
```
🤖 Agent plan request: { booking_id: 123, userId: 1, query: '...' }
📡 Forwarding to agent service: http://localhost:8000
```

**Errors to look for:**
- `ECONNREFUSED` → Agent service not running
- `ETIMEDOUT` → Agent taking too long
- `404` → Booking not found

### Agent Service Logs (Terminal 2):
Look for:
```
🚀 Starting plan generation for booking 123
📊 STEP 1: Fetching booking details...
✅ Booking fetched: Los Angeles, CA
```

**Errors to look for:**
- `❌ MongoDB connection error` → Database issue
- `❌ Error fetching booking` → Booking doesn't exist
- `Booking X not found` → Wrong booking ID

---

## 🔧 Common Fixes

### Fix 1: Restart All Services

```bash
# Stop everything (Ctrl+C in each terminal)

# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Agent Service
cd apps/agent-service
source venv/bin/activate
python main.py

# Terminal 3 - Frontend
cd apps/frontend
npm run dev
```

### Fix 2: Reinstall Python Dependencies

```bash
cd apps/agent-service
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Fix 3: Test Direct API Call

```bash
# Replace YOUR_BOOKING_ID and YOUR_SECRET
curl -X POST http://localhost:8000/agent/plan \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 1,
    "user_id": 1,
    "query": "test",
    "preferences": {},
    "_secret": "my-secret-123"
  }'
```

**Expected**: Should return JSON with itinerary
**If error**: Check the exact error message

---

## 📊 Quick Diagnostic Script

Save this as `check_agent.sh`:

```bash
#!/bin/bash

echo "🔍 AI Agent Diagnostics"
echo "======================="
echo ""

echo "1. Backend (Port 5000):"
curl -s http://localhost:5000/api/health > /dev/null && echo "✅ Running" || echo "❌ Not running"

echo "2. Agent Service (Port 8000):"
curl -s http://localhost:8000/health > /dev/null && echo "✅ Running" || echo "❌ Not running"

echo "3. Ollama (Port 11434):"
curl -s http://localhost:11434/api/tags > /dev/null && echo "✅ Running" || echo "❌ Not running"

echo "4. MongoDB:"
mongosh --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1 && echo "✅ Connected" || echo "❌ Not connected"

echo ""
echo "5. Environment Variables:"
echo "   Backend AGENT_SERVICE_URL: $(grep AGENT_SERVICE_URL apps/backend/.env | cut -d'=' -f2)"
echo "   Agent MONGODB_URI: $(grep MONGODB_URI apps/agent-service/.env | cut -d'=' -f2)"
echo "   Agent MONGODB_DB_NAME: $(grep MONGODB_DB_NAME apps/agent-service/.env | cut -d'=' -f2)"

echo ""
echo "6. Secrets Match:"
BACKEND_SECRET=$(grep AGENT_SERVICE_SECRET apps/backend/.env | cut -d'=' -f2)
AGENT_SECRET=$(grep AGENT_SERVICE_SECRET apps/agent-service/.env | cut -d'=' -f2)
if [ "$BACKEND_SECRET" = "$AGENT_SECRET" ]; then
  echo "✅ Secrets match"
else
  echo "❌ Secrets don't match!"
  echo "   Backend: $BACKEND_SECRET"
  echo "   Agent:   $AGENT_SECRET"
fi
```

Run it:
```bash
chmod +x check_agent.sh
./check_agent.sh
```

---

## 🆘 Still Not Working?

### Get Detailed Error:

1. **Open Browser Console** (F12)
2. **Go to Network tab**
3. **Try generating plan again**
4. **Click on the failed request**
5. **Look at Response**

Copy the exact error message and check:

- `"Agent service is not available"` → Agent not running
- `"Agent service timed out"` → Ollama taking too long (first request)
- `"Booking not found"` → Wrong booking ID or not your booking
- `"Invalid authentication token"` → Secrets don't match
- `"MongoDB connection error"` → Database issue

---

## 💡 Most Common Issues (90% of errors)

1. **Agent service not running** (40%)
   - Solution: `cd apps/agent-service && python main.py`

2. **Ollama not running** (25%)
   - Solution: `ollama serve` + `ollama pull llama3`

3. **MongoDB URI incorrect** (15%)
   - Solution: Fix `DB_PASSWORD` in `.env`

4. **Secrets don't match** (10%)
   - Solution: Make sure `AGENT_SERVICE_SECRET` is same in both files

5. **First request timeout** (10%)
   - Solution: Wait for model to load, try again

---

## ✅ Success Checklist

- [ ] Agent service running on port 8000
- [ ] `/health` returns "healthy"
- [ ] MongoDB connection works
- [ ] Ollama running with llama3 model
- [ ] Backend and Agent secrets match
- [ ] Valid booking exists for your user
- [ ] All 3 terminals running services

If all checked, the system should work! 🎉

---

## 🔍 Advanced Debugging

### Enable Detailed Logging:

In `apps/agent-service/main.py`, change:
```python
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

Restart agent service to see detailed logs.

---

**Need more help?** Check the main setup guide: `AI_AGENT_SETUP.md`

