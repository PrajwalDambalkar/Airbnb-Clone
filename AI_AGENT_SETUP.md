# AI Agent Service Setup Guide

Complete setup and usage guide for the AI Travel Planner feature.

---

## 📋 Prerequisites

### Required Software

1. **Python 3.10+**
   ```bash
   python --version  # Should be 3.10 or higher
   ```

2. **Node.js 18+** (already installed for backend)

3. **MySQL** (already running for main app)

4. **Ollama** (Local LLM)
   - Download from: https://ollama.ai/
   - Install and run:
     ```bash
     # Install Ollama
     curl -fsSL https://ollama.ai/install.sh | sh
     
     # Pull Llama3 model
     ollama pull llama3
     
     # Verify Ollama is running
     ollama list
     ```

5. **Tavily API Key** (Optional but recommended)
   - Sign up at: https://tavily.com/
   - Free tier: 1,000 searches/month
   - Copy your API key

---

## 🚀 Installation

### Step 1: Agent Service Setup

```bash
# Navigate to agent service directory
cd apps/agent-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Required .env variables:**
```env
# MySQL connection (same as your backend)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=airbnb_db

# Ollama configuration
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434

# Tavily API (get from https://tavily.com/)
TAVILY_API_KEY=your_tavily_api_key

# Security secret (must match backend)
AGENT_SERVICE_SECRET=your-secret-key-here
```

### Step 3: Backend Configuration

Update your backend `.env` file:

```bash
cd ../backend
nano .env  # Add these lines:
```

```env
# Agent Service Configuration
AGENT_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_SECRET=your-secret-key-here  # MUST match agent service
```

### Step 4: Verify Installations

```bash
# Test Ollama
curl http://localhost:11434/api/tags

# Test MySQL connection
mysql -u root -p airbnb_db -e "SELECT COUNT(*) FROM bookings;"

# Test Python dependencies
cd apps/agent-service
python -c "import fastapi, langchain, mysql.connector; print('All dependencies OK')"
```

---

## ▶️ Running the System

You need to run **3 services** simultaneously:

### Terminal 1: Backend (Express)
```bash
cd apps/backend
npm run dev
# Should run on: http://localhost:5000
```

### Terminal 2: Agent Service (FastAPI)
```bash
cd apps/agent-service
source venv/bin/activate  # Activate virtual environment
python main.py
# Should run on: http://localhost:8000

# Or use uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 3: Frontend (React)
```bash
cd apps/frontend
npm run dev
# Should run on: http://localhost:5173
```

---

## 🧪 Testing the System

### 1. Health Checks

**Agent Service Health:**
```bash
curl http://localhost:8000/health
```

Expected response:
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

**Test Ollama:**
```bash
curl http://localhost:8000/test-ollama
```

**Test MySQL:**
```bash
curl http://localhost:8000/test-mysql
```

### 2. Create a Test Booking

1. Log in to the app as a traveler
2. Make a booking (any property, any dates)
3. Wait for owner to accept (or manually update in DB):
   ```sql
   UPDATE bookings SET status = 'ACCEPTED' WHERE id = 1;
   ```

### 3. Generate Your First Itinerary

1. Go to **Bookings** page
2. Find your accepted booking
3. Click **"AI Travel Planner"** button
4. Fill in preferences (optional):
   - Budget level
   - Interests (food, culture, etc.)
   - Dietary restrictions
   - Accessibility needs
5. Enter natural language query (optional):
   ```
   "We're a family with two kids, vegan diet, love outdoor activities"
   ```
6. Click **"Generate Travel Plan"**
7. Wait 15-30 seconds for generation
8. View your personalized itinerary!

---

## 🔧 Troubleshooting

### Issue: "Ollama not available"

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it:
ollama serve

# Pull Llama3 model if missing:
ollama pull llama3
```

---

### Issue: "MySQL connection error"

**Solution:**
```bash
# Verify MySQL is running
mysql -u root -p

# Check credentials in .env match
cat apps/agent-service/.env | grep DB_

# Test connection
python -c "import mysql.connector; mysql.connector.connect(host='localhost', user='root', password='YOUR_PASSWORD', database='airbnb_db')"
```

---

### Issue: "Tavily API error"

**Solutions:**

1. **No API key:**
   - System will use fallback data
   - Recommendations will be generic
   - Get free key at: https://tavily.com/

2. **Rate limit exceeded:**
   - Free tier: 1,000 searches/month
   - Wait until next month or upgrade
   - Fallback data will be used

3. **Invalid API key:**
   - Verify key in `.env`
   - Check for extra spaces or quotes

---

### Issue: "Agent service timeout"

**Symptoms:**
- Request takes > 60 seconds
- Backend returns 504 error

**Solutions:**

1. **Ollama is slow:**
   ```bash
   # Check system resources
   top
   
   # Use smaller model (faster but less quality):
   # In .env, change to:
   OLLAMA_MODEL=llama3:8b  # Instead of llama3:70b
   ```

2. **First request always slow:**
   - Ollama loads model on first use
   - Subsequent requests are faster
   - Solution: Make a test request after starting

---

### Issue: "Invalid JSON response from LLM"

**Symptoms:**
- Error message about parsing JSON
- Falls back to generic itinerary

**Solutions:**

1. **Try again** - LLMs are non-deterministic
2. **Simplify query** - Shorter queries work better
3. **Check logs** - Agent service shows raw LLM output:
   ```bash
   # In agent-service terminal, look for:
   # "🔍 Parsing LLM response..."
   ```

---

## 📊 Monitoring

### View Agent Service Logs

```bash
# In agent-service terminal, you'll see:
# 🚀 Starting plan generation for booking 123
# 📊 STEP 1: Fetching booking details...
# ✅ Booking fetched: San Diego, CA
# 🔍 STEP 2: RAG retrieval...
# 🌐 STEP 3: Tavily web search...
# 🤖 STEP 4: Generating itinerary with LLM...
# ✅ Itinerary generated
# 🎉 Plan generation completed
```

### Check ChromaDB (RAG Vector Store)

```bash
# Location
ls apps/agent-service/chroma_db/

# Count stored itineraries
python -c "from rag.vector_store import vector_store; print(f'Stored itineraries: {vector_store.count()}')"
```

---

## 🎯 Performance Tips

### Speed Up Generation

1. **Use smaller Ollama model:**
   ```env
   OLLAMA_MODEL=llama3:8b  # Faster, 8B parameters
   # Instead of:
   OLLAMA_MODEL=llama3:70b  # Slower, 70B parameters
   ```

2. **Reduce Tavily searches:**
   - Service already uses 1 combined search
   - Cached for 24 hours per location

3. **Preload model:**
   ```bash
   # After starting Ollama, preload model:
   curl http://localhost:8000/test-ollama
   ```

### RAG Improvement Over Time

- System stores each generated itinerary
- After ~50 itineraries, RAG starts providing value
- Similar trips = better recommendations
- Check progress:
  ```bash
  curl http://localhost:8000/health | jq '.services.rag_count'
  ```

---

## 🔒 Security Notes

1. **AGENT_SERVICE_SECRET:**
   - Must match between backend and agent service
   - Change default value in production
   - Used to authenticate backend → agent requests

2. **Port 8000:**
   - Agent service should NOT be publicly accessible
   - Only backend should communicate with it
   - In production, use internal network

3. **Tavily API Key:**
   - Keep secret
   - Don't commit to Git
   - Use environment variables only

---

## 📈 Production Deployment

### Recommended Architecture

```
Internet
    ↓
[Load Balancer]
    ↓
[Frontend Servers] ← React app
    ↓
[Backend Servers] ← Express API
    ↓ (Internal Network Only)
[Agent Service Servers] ← FastAPI
    ↓
[Ollama GPU Server] ← LLM inference
```

### Docker Deployment (Optional)

```dockerfile
# apps/agent-service/Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

```env
# Use strong secrets
AGENT_SERVICE_SECRET=$(openssl rand -hex 32)

# Use cloud Ollama or GPU server
OLLAMA_BASE_URL=http://ollama-server:11434

# Or use OpenAI instead of Ollama:
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4
```

---

## 🆘 Getting Help

### Check Logs

1. **Agent Service:** Terminal 2 shows detailed logs
2. **Backend:** Terminal 1 shows proxy logs
3. **Frontend:** Browser console (F12)

### Common Commands

```bash
# Restart agent service
cd apps/agent-service
source venv/bin/activate
python main.py

# Check which ports are in use
lsof -i :8000  # Agent service
lsof -i :5000  # Backend
lsof -i :5173  # Frontend
lsof -i :11434 # Ollama

# View Python errors
cd apps/agent-service
python -m pytest  # If tests exist
```

---

## ✅ Success Checklist

- [ ] Ollama installed and running
- [ ] Llama3 model downloaded
- [ ] Python dependencies installed
- [ ] Environment variables configured
- [ ] MySQL connection working
- [ ] All 3 services running
- [ ] Health check returns "healthy"
- [ ] Test booking created
- [ ] AI Travel Planner button visible
- [ ] First itinerary generated successfully

---

## 🎉 Next Steps

1. **Test with different queries:**
   - "Family vacation with kids"
   - "Romantic getaway, fine dining"
   - "Budget backpacking trip"

2. **Explore different cities:**
   - Each location will have unique recommendations
   - Tavily provides local context

3. **Watch RAG improve:**
   - After 50+ itineraries, system learns patterns
   - Similar trips get better recommendations

4. **Customize prompts:**
   - Edit `utils/llm_client.py` → `build_prompt()`
   - Adjust tone, structure, detail level

5. **Add more data sources:**
   - Weather APIs
   - Flight prices
   - Hotel recommendations

---

**Congratulations! Your AI Agent is ready! 🚀**

