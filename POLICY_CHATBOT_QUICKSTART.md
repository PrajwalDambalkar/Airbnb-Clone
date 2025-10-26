# Quick Start: Adding Policy Knowledge to Chatbot

## 🎯 Goal
Enable the chatbot to answer policy questions like:
- "What's your cancellation policy?"
- "When do I get charged?"
- "Can I bring my pet?"
- "What are the house rules?"

## 🚀 How It Works (Simple Version)

```
1. You give the bot policy documents (markdown files)
2. Bot breaks them into small chunks
3. Bot converts chunks into math vectors (embeddings)
4. When user asks a question:
   → Bot finds most relevant chunks
   → Bot reads those chunks
   → Bot answers in natural language
```

## 📁 Files to Create

### 1. Policy Documents (Simple Markdown)
**Location:** `apps/agent-service/policies/`

```
policies/
├── cancellation_policy.md  ← Create this
├── payment_policy.md       ← Create this  
└── house_rules.md          ← Create this
```

Just write policies in plain English! Example:

```markdown
# Cancellation Policy

You can cancel for free within 48 hours of booking.

If you cancel 7+ days before check-in, you get a 50% refund.
If you cancel less than 7 days before check-in, no refund.
```

### 2. Policy Loader (Python)
**Location:** `apps/agent-service/rag/policy_loader.py`

This reads your policy files and makes them searchable.

### 3. Update Agent Service (Python)
**Location:** `apps/agent-service/services/agent_service.py`

Add policy intent detection so bot knows when user is asking about policies.

## 🔧 Implementation Steps

### Step 1: Create Policy Files (10 minutes)
```bash
cd apps/agent-service
mkdir policies
cd policies

# Create cancellation_policy.md
# Create payment_policy.md
# Create house_rules.md
```

Copy content from `POLICY_RAG_IMPLEMENTATION.md` → Step 4

### Step 2: Add Policy Loader (15 minutes)
```bash
cd apps/agent-service/rag
# Create policy_loader.py
```

Copy code from `POLICY_RAG_IMPLEMENTATION.md` → Step 2

### Step 3: Update Agent Service (10 minutes)
Edit: `apps/agent-service/services/agent_service.py`

Add the policy query handling code from `POLICY_RAG_IMPLEMENTATION.md` → Step 3

### Step 4: Auto-load Policies on Startup (5 minutes)
Edit: `apps/agent-service/main.py`

Add startup code from `POLICY_RAG_IMPLEMENTATION.md` → Step 6

### Step 5: Test! (5 minutes)
```bash
# Restart agent service
cd apps/agent-service
./start.sh

# In chatbot, try:
# "What's your cancellation policy?"
# "Can I get a refund?"
# "When do I pay?"
```

## 💬 Example Conversation

```
User: show my bookings

Bot: You have 2 bookings:
     ✓ Malibu Beach Cottage in Los Angeles
     ✓ Mission Hills Classic in San Diego

User: what's your cancellation policy?

Bot: Our cancellation policy varies by type:
     
     • Flexible: Full refund if cancelled 24+ hours before check-in
     • Moderate: Full refund 5+ days before, 50% refund 2-5 days before  
     • Strict: 50% refund if cancelled 7+ days before
     
     You can cancel for free within 48 hours of booking if 
     check-in is 14+ days away.
     
     📋 Source: Cancellation Policy

User: what if the host cancels?

Bot: If a host cancels your reservation, you'll receive a full 
     refund plus an additional 10% credit for your next booking!
     
     📋 Source: Cancellation Policy

User: ok plan my LA trip with beaches

Bot: 🎉 Creating your LA beach itinerary...
     [Shows full travel plan]
```

## 🎨 The Magic Behind It

### Without RAG (Bad ❌)
```
User: "What's the cancellation policy?"
Bot: "I don't have information about that. Please contact support."
```

### With RAG (Good ✅)
```
User: "What's the cancellation policy?"

Behind the scenes:
1. Bot searches policy database
2. Finds: "cancellation_policy.md" chunks
3. Reads relevant sections
4. Generates natural answer

Bot: "Our cancellation policy varies..." [accurate answer]
     📋 Source: Cancellation Policy
```

## 🔄 The Complete Pipeline

```
┌─────────────────────────────────────────────────────────┐
│  YOU                                                    │
│  ├── Write policies in markdown                         │
│  └── Drop files in policies/ folder                     │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  SYSTEM (Automatic)                                     │
│  ├── Reads all .md files                                │
│  ├── Breaks into chunks (500 char each)                 │
│  ├── Converts to vectors (math representation)          │
│  └── Stores in ChromaDB                                 │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  USER QUERY                                             │
│  User: "What's the cancellation policy?"                │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  SEARCH (Semantic - understands meaning)                │
│  ├── Convert question to vector                         │
│  ├── Find similar vectors in database                   │
│  └── Return top 3 most relevant chunks                  │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  LLM (Ollama/LLaMA)                                     │
│  ├── Read retrieved policy chunks                       │
│  ├── Understand user's question                         │
│  ├── Generate natural language answer                   │
│  └── Add source citation                                │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  RESPONSE                                               │
│  Bot: [Natural answer] + 📋 Source: [Policy Name]      │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Key Benefits

1. **Easy Updates**: Just edit markdown files, restart service
2. **Accurate**: Bot only uses actual policy content
3. **Source Citations**: Shows where info came from
4. **Smart Search**: Understands meaning, not just keywords
5. **Conversational**: Natural language responses

## 📊 What Gets Created

```
ChromaDB Database Structure:

Collection: "airbnb_policies"
├── Chunk 1: "Free cancellation within 48 hours..." 
│   └── Vector: [0.234, -0.156, 0.089, ...]
│
├── Chunk 2: "Flexible policy: Full refund if..."
│   └── Vector: [0.189, -0.201, 0.145, ...]
│
├── Chunk 3: "Payment charged 24 hours before..."
│   └── Vector: [0.267, -0.112, 0.078, ...]
│
└── ... (all policy chunks)
```

## 🔍 Query Matching Example

```
User Query: "Can I get money back if I cancel?"
Query Vector: [0.221, -0.167, 0.095, ...]

Search Results (by similarity):
1. Match: 89% → "Full refund if cancelled 5+ days..."
2. Match: 85% → "Flexible cancellation policy allows..."
3. Match: 82% → "Host cancellation: guest receives full..."

Bot uses these 3 chunks to answer!
```

## 🚦 Status Indicators

When testing, you'll see logs like:

```
✅ Policy documents loaded           ← Good
📚 Loading policy documents...       ← In progress
⚠️ Policy loading failed            ← Check policy files exist
❌ Policy search error              ← Check ChromaDB
```

## 📝 Common Questions

**Q: Do I need to write code?**
A: Just copy-paste the provided code. Main work is writing policy content in markdown.

**Q: What if I update a policy?**
A: Edit the .md file, restart agent service. Automatic!

**Q: Can it handle complex questions?**
A: Yes! LLM can reason about the retrieved policy content.

**Q: What if it can't find an answer?**
A: Bot says "I don't have info about that, contact support."

**Q: How do I add more policies?**
A: Drop new .md files in `policies/` folder, restart service.

## 🎓 Advanced: What You Could Add Later

- **PDF Support**: Read policy PDFs directly
- **Version Control**: Track policy changes over time
- **Multi-language**: Translate policies automatically
- **Analytics**: Track which policies users ask about
- **Admin Panel**: Update policies via web interface

## 📚 Full Documentation

- **Implementation Guide**: `POLICY_RAG_IMPLEMENTATION.md`
- **Visual Diagrams**: `POLICY_RAG_FLOW_DIAGRAM.md`
- **This Quickstart**: `POLICY_CHATBOT_QUICKSTART.md`

## 🚀 Ready to Implement?

1. Read the implementation guide
2. Create policy files (10 min)
3. Add Python code (30 min)
4. Test and enjoy! (5 min)

Total time: ~45 minutes for full implementation

---

**Need help?** Check the logs when testing:
- `apps/agent-service/` output shows ingestion status
- Frontend console shows query/response flow
- Backend logs show request forwarding

Good luck! 🎉

