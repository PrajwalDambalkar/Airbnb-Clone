# 🚀 How to Start the AI Agent Service

## The Error You're Seeing
```
🤖 AI service is not available. Please start the agent service and try again.
```

This means the FastAPI Agent Service is not running on port 8000.

## Quick Start (3 Steps)

### Step 1: Create Environment File
```bash
cd /Users/spartan/BNB/Airbnb-Clone/apps/agent-service
cp .env.example .env
```

Then edit `.env` and update these values:
- `DB_PASSWORD`: Your MySQL root password
- `TAVILY_API_KEY`: Get from https://tavily.com/ (or leave as placeholder for testing)

### Step 2: Install Dependencies (if not done)
```bash
pip3 install -r requirements.txt
```

### Step 3: Start the Service
#### Option A: Using the startup script
```bash
./start.sh
```

#### Option B: Direct command
```bash
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Verify It's Running

### 1. Check Health Endpoint
Open browser to: http://localhost:8000/health

You should see:
```json
{
  "status": "healthy",
  "service": "AI Travel Agent",
  "version": "1.0.0"
}
```

### 2. Check API Docs
Open browser to: http://localhost:8000/docs

You should see the FastAPI interactive documentation.

### 3. Check Port
```bash
lsof -i :8000
```

Should show Python/uvicorn running.

## Common Issues

### Issue 1: Port Already in Use
```bash
# Kill any process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Issue 2: MySQL Connection Error
The agent service needs to connect to your MySQL database. Make sure:
- MySQL is running
- Database credentials in `.env` are correct
- Database `airbnb_db` exists

Test MySQL connection:
```bash
mysql -u root -p -e "SELECT 1 FROM users LIMIT 1;" airbnb_db
```

### Issue 3: Ollama Not Running
The agent service uses Ollama for AI generation. Make sure Ollama is running:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# If not, start Ollama (depends on your installation)
ollama serve
```

### Issue 4: Missing Dependencies
```bash
cd /Users/spartan/BNB/Airbnb-Clone/apps/agent-service
pip3 install -r requirements.txt
```

## Full Startup Sequence

If starting from scratch, run these in separate terminals:

### Terminal 1: MySQL
Make sure MySQL is running

### Terminal 2: Ollama
```bash
ollama serve
```

### Terminal 3: Backend
```bash
cd /Users/spartan/BNB/Airbnb-Clone/apps/backend
npm start
```

### Terminal 4: Frontend
```bash
cd /Users/spartan/BNB/Airbnb-Clone/apps/frontend
npm run dev
```

### Terminal 5: Agent Service
```bash
cd /Users/spartan/BNB/Airbnb-Clone/apps/agent-service
./start.sh
```

## After Starting

Once all services are running:
1. Open http://localhost:5173
2. Log in as a traveler
3. Click the AI Travel Planner button (bottom right)
4. Click "Generate Travel Plan"
5. You should now see the AI generating your itinerary! ✨

## Logs to Watch

When you click "Generate Travel Plan", you should see:

**Frontend Console (Browser):**
```
📡 [Frontend] Calling API: /api/agent/plan
📦 [Frontend] Request payload: {booking_id: 23, ...}
```

**Backend Terminal:**
```
🔵 [Backend] POST /api/agent/plan - Request received
✅ [Backend] Booking exists
✅ [Backend] Booking belongs to user!
🚀 [Backend] Forwarding to agent service
✅ [Backend] Agent service responded successfully
```

**Agent Service Terminal:**
```
INFO:     127.0.0.1:XXXXX - "POST /agent/plan HTTP/1.1" 200 OK
```

## Need Help?

If you're still having issues, share:
1. The agent service terminal output
2. Any error messages from browser console
3. MySQL connection status

