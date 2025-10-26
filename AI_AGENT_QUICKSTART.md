# 🚀 AI Agent Quick Start (5 Minutes)

Get the AI Travel Planner running in 5 minutes!

---

## Step 1: Install Ollama (2 min)

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Pull Llama3 model (1.5 GB download)
ollama pull llama3

# Verify it's running
ollama list
# Should show: llama3
```

---

## Step 2: Setup Python Environment (1 min)

```bash
cd apps/agent-service

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

---

## Step 3: Configure Environment (1 min)

Create `apps/agent-service/.env`:

```env
# MySQL (use same as backend)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=airbnb_db

# Ollama
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434

# Security (MUST match backend .env)
AGENT_SERVICE_SECRET=my-secret-key-123

# Tavily (optional - get free key from tavily.com)
TAVILY_API_KEY=
```

Update `apps/backend/.env` (add these lines):

```env
AGENT_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_SECRET=my-secret-key-123
```

---

## Step 4: Run All Services (1 min)

Open **3 terminals:**

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Agent Service:**
```bash
cd apps/agent-service
source venv/bin/activate
python main.py
```

**Terminal 3 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

---

## Step 5: Test It! (30 sec)

1. Open browser: http://localhost:5173
2. Login as traveler
3. Go to **Bookings** page
4. Click **"AI Travel Planner"** button (✨ Sparkles icon)
5. Click **"Generate Travel Plan"**
6. Wait ~20 seconds
7. See your personalized itinerary! 🎉

---

## Quick Health Check

```bash
# Check all services
curl http://localhost:5000/api/health  # Backend
curl http://localhost:8000/health      # Agent
curl http://localhost:11434/api/tags   # Ollama
```

All should return 200 OK.

---

## Troubleshooting

### "Ollama not available"
```bash
ollama serve  # Start Ollama
ollama pull llama3  # Download model
```

### "MySQL connection error"
- Check DB credentials in `.env`
- Verify MySQL is running

### "Agent service timeout"
- First request loads model (slow)
- Subsequent requests are faster
- Try again!

---

## What's Happening Behind the Scenes?

```
You click button
    ↓
Frontend → Backend (validates session)
    ↓
Backend → Agent Service (generates plan)
    ↓
Agent Service:
  1. Fetches your booking from MySQL
  2. Searches web for local attractions (Tavily)
  3. Asks Ollama LLM to create itinerary
  4. Returns structured JSON
    ↓
Frontend displays beautiful UI
```

---

## Next Steps

- ✅ Generated your first itinerary? Awesome!
- 📖 Read full setup guide: [AI_AGENT_SETUP.md](AI_AGENT_SETUP.md)
- 🎯 Try different queries and preferences
- 🔑 Get Tavily API key for better recommendations: https://tavily.com/
- 🚀 Deploy to production (see setup guide)

---

**Enjoy your AI Travel Planner! ✈️🌍**

