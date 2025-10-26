# Environment Variables Setup

Complete environment configuration for the AI Agent system.

---

## 📝 Agent Service Environment (.env)

Create file: `apps/agent-service/.env`

```env
# ============================================
# AI Agent Service - Environment Variables
# ============================================

# Server Configuration
AGENT_PORT=8000

# Security - MUST match backend .env
AGENT_SERVICE_SECRET=change-this-secret-in-production-use-strong-secret

# ============================================
# MySQL Database (same as backend)
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=airbnb_db

# ============================================
# Ollama Configuration (Local LLM)
# ============================================
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434

# Model options:
# - llama3:8b   (Faster, 8B parameters, ~4GB RAM)
# - llama3:70b  (Slower, 70B parameters, ~40GB RAM, better quality)
# - llama3      (Default, usually llama3:8b)

# ============================================
# Tavily API (Web Search)
# ============================================
# Get free API key from: https://tavily.com/
# Free tier: 1,000 searches/month
# Leave empty to use fallback data

TAVILY_API_KEY=

# ============================================
# ChromaDB Configuration (RAG)
# ============================================
CHROMA_PERSIST_DIR=./chroma_db
```

---

## 📝 Backend Environment (Add to existing .env)

Add these lines to: `apps/backend/.env`

```env
# ============================================
# AI Agent Configuration
# ============================================

# Agent Service URL (internal, not public)
AGENT_SERVICE_URL=http://localhost:8000

# Security Secret - MUST match agent-service/.env
AGENT_SERVICE_SECRET=change-this-secret-in-production-use-strong-secret
```

**Your complete backend .env should look like:**

```env
# Existing variables
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=airbnb_db

# Session
SESSION_SECRET=your-session-secret

# NEW: AI Agent Configuration
AGENT_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_SECRET=change-this-secret-in-production-use-strong-secret
```

---

## 🔐 Generating Secure Secrets

### For Production

```bash
# Generate strong secret (32 bytes)
openssl rand -hex 32

# Example output:
# a3f9c2e8b7d6f1e4a3b9c2d8e7f6a1b4c3d2e1f9a8b7c6d5e4f3a2b1c9d8e7f6

# Use this for both:
# - backend/.env → AGENT_SERVICE_SECRET
# - agent-service/.env → AGENT_SERVICE_SECRET
```

### For Development

Use any consistent string (must match in both .env files):

```env
AGENT_SERVICE_SECRET=my-dev-secret-123
```

---

## 🗂️ Complete File Structure

```
Airbnb-Clone/
│
├── apps/
│   │
│   ├── backend/
│   │   └── .env                    ← Add AGENT_SERVICE_URL + SECRET
│   │
│   ├── agent-service/
│   │   └── .env                    ← Create this file (see template above)
│   │
│   └── frontend/
│       └── .env                    ← No changes needed
│
└── ...
```

---

## ✅ Verification Checklist

After creating .env files:

### 1. Check Agent Service .env

```bash
cd apps/agent-service
cat .env | grep -E "DB_|OLLAMA|AGENT_SERVICE_SECRET"
```

Should show:
- DB credentials (same as backend)
- OLLAMA_MODEL=llama3
- AGENT_SERVICE_SECRET=<your-secret>

### 2. Check Backend .env

```bash
cd apps/backend
cat .env | grep -E "AGENT"
```

Should show:
- AGENT_SERVICE_URL=http://localhost:8000
- AGENT_SERVICE_SECRET=<same-as-agent-service>

### 3. Verify Secrets Match

```bash
# Extract secrets from both files
BACKEND_SECRET=$(grep AGENT_SERVICE_SECRET apps/backend/.env | cut -d'=' -f2)
AGENT_SECRET=$(grep AGENT_SERVICE_SECRET apps/agent-service/.env | cut -d'=' -f2)

# Compare (should be identical)
if [ "$BACKEND_SECRET" = "$AGENT_SECRET" ]; then
  echo "✅ Secrets match!"
else
  echo "❌ Secrets don't match - fix this!"
fi
```

---

## 🌍 Environment-Specific Configurations

### Development

```env
# agent-service/.env
OLLAMA_MODEL=llama3:8b          # Faster for development
TAVILY_API_KEY=                 # Optional, use fallback
AGENT_SERVICE_SECRET=dev-secret-123
```

### Staging

```env
# agent-service/.env
OLLAMA_MODEL=llama3:70b         # Better quality
TAVILY_API_KEY=your-key         # Use real API
AGENT_SERVICE_SECRET=$(openssl rand -hex 32)
```

### Production

```env
# agent-service/.env
OLLAMA_BASE_URL=http://ollama-gpu-server:11434  # Dedicated GPU server
OLLAMA_MODEL=llama3:70b
TAVILY_API_KEY=your-production-key
AGENT_SERVICE_SECRET=$(openssl rand -hex 32)
DB_HOST=production-mysql-server
```

---

## 🔧 Troubleshooting

### "Secrets don't match" Error

**Symptom:** Backend → Agent requests return 403 Forbidden

**Solution:**
```bash
# Check both secrets
grep AGENT_SERVICE_SECRET apps/backend/.env
grep AGENT_SERVICE_SECRET apps/agent-service/.env

# Make sure they're identical
# Update both to match:
AGENT_SERVICE_SECRET=my-matching-secret-123
```

### "Database connection failed"

**Symptom:** Agent service health check shows MySQL: "disconnected"

**Solution:**
```bash
# Test MySQL connection
mysql -h localhost -u root -p airbnb_db

# Verify credentials match
grep DB_ apps/backend/.env
grep DB_ apps/agent-service/.env

# Both should have same values
```

### "Ollama not found"

**Symptom:** Agent service health check shows Ollama: "error"

**Solution:**
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# If not running:
ollama serve

# Check model is downloaded:
ollama list
# If llama3 not listed:
ollama pull llama3

# Update .env if using different port:
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 📦 Docker Environment Variables

If using Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  agent-service:
    build: ./apps/agent-service
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=mysql
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - OLLAMA_BASE_URL=http://ollama:11434
      - AGENT_SERVICE_SECRET=${AGENT_SERVICE_SECRET}
    depends_on:
      - mysql
      - ollama
  
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama-data:/root/.ollama
    ports:
      - "11434:11434"
  
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  ollama-data:
  mysql-data:
```

---

## 🎯 Quick Setup Commands

```bash
# 1. Create agent service .env
cd apps/agent-service
cat > .env << 'EOF'
AGENT_PORT=8000
AGENT_SERVICE_SECRET=my-dev-secret-123
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=airbnb_db
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434
TAVILY_API_KEY=
CHROMA_PERSIST_DIR=./chroma_db
EOF

# 2. Update backend .env
cd ../backend
echo "" >> .env
echo "# AI Agent Configuration" >> .env
echo "AGENT_SERVICE_URL=http://localhost:8000" >> .env
echo "AGENT_SERVICE_SECRET=my-dev-secret-123" >> .env

# 3. Verify
echo "✅ Environment configured!"
echo "Backend secret: $(grep AGENT_SERVICE_SECRET ../backend/.env | cut -d'=' -f2)"
echo "Agent secret:   $(grep AGENT_SERVICE_SECRET .env | cut -d'=' -f2)"
```

---

## 📚 Additional Resources

- **MySQL Connection Strings**: https://dev.mysql.com/doc/
- **Ollama Models**: https://ollama.ai/library
- **Tavily API Docs**: https://docs.tavily.com/
- **FastAPI Settings**: https://fastapi.tiangolo.com/advanced/settings/

---

**Environment setup complete! Ready to run the system.** 🚀

