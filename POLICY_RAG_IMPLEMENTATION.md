# Policy Knowledge Base with RAG Implementation

## Overview
Add a Retrieval Augmented Generation (RAG) system to answer policy questions using actual Airbnb policy documents.

## Architecture

### Components
1. **Document Ingestion** - Load and process policy documents
2. **Embedding Generation** - Convert text to vectors
3. **Vector Storage** - ChromaDB for semantic search
4. **Intent Detection** - Identify policy-related queries
5. **Retrieval** - Find relevant policy sections
6. **Answer Generation** - LLM creates natural response

### Data Flow

```
Policy Document → Chunks → Embeddings → ChromaDB
                                           ↓
User Query → Embedding → Similarity Search → Top Chunks
                                              ↓
                            LLM + Context → Answer
```

## Implementation Steps

### Step 1: Create Policy Document Structure

Create a policies folder:
```
apps/agent-service/
  ├── policies/
  │   ├── cancellation_policy.md
  │   ├── payment_policy.md
  │   ├── house_rules.md
  │   └── refund_policy.md
```

### Step 2: Add Policy Ingestion Script

**File: `apps/agent-service/rag/policy_loader.py`**

```python
import os
import logging
from typing import List, Dict
from pathlib import Path
from rag.vector_store import vector_store
from rag.embeddings import embedding_model

logger = logging.getLogger(__name__)

class PolicyLoader:
    """Load and index policy documents"""
    
    def __init__(self):
        self.policies_dir = Path(__file__).parent.parent / "policies"
        self.collection_name = "airbnb_policies"
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                if last_period > chunk_size * 0.7:  # At least 70% through
                    end = start + last_period + 1
                    chunk = text[start:end]
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return chunks
    
    def load_policy_file(self, filepath: Path) -> Dict:
        """Load a single policy file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract metadata from filename
            policy_type = filepath.stem.replace('_', ' ').title()
            
            return {
                'filename': filepath.name,
                'policy_type': policy_type,
                'content': content
            }
        except Exception as e:
            logger.error(f"Error loading {filepath}: {e}")
            return None
    
    def ingest_policies(self):
        """Load all policy documents into vector store"""
        logger.info("📚 Starting policy ingestion...")
        
        if not self.policies_dir.exists():
            logger.warning(f"⚠️ Policies directory not found: {self.policies_dir}")
            return
        
        all_chunks = []
        all_metadatas = []
        all_ids = []
        
        policy_files = list(self.policies_dir.glob("*.md")) + \
                      list(self.policies_dir.glob("*.txt"))
        
        for policy_file in policy_files:
            logger.info(f"📄 Processing: {policy_file.name}")
            
            policy_data = self.load_policy_file(policy_file)
            if not policy_data:
                continue
            
            # Chunk the policy text
            chunks = self.chunk_text(policy_data['content'])
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{policy_data['filename']}_{i}"
                
                all_chunks.append(chunk)
                all_metadatas.append({
                    'policy_type': policy_data['policy_type'],
                    'filename': policy_data['filename'],
                    'chunk_index': i,
                    'source': 'policy_document'
                })
                all_ids.append(chunk_id)
            
            logger.info(f"  ✅ Created {len(chunks)} chunks from {policy_file.name}")
        
        if not all_chunks:
            logger.warning("⚠️ No policy chunks to ingest")
            return
        
        # Generate embeddings
        logger.info(f"🔢 Generating embeddings for {len(all_chunks)} chunks...")
        embeddings = embedding_model.encode(all_chunks).tolist()
        
        # Store in ChromaDB
        logger.info("💾 Storing in vector database...")
        collection = vector_store.get_or_create_collection(self.collection_name)
        
        collection.add(
            ids=all_ids,
            embeddings=embeddings,
            documents=all_chunks,
            metadatas=all_metadatas
        )
        
        logger.info(f"✅ Ingested {len(all_chunks)} policy chunks from {len(policy_files)} files")
    
    def search_policies(self, query: str, n_results: int = 3) -> List[Dict]:
        """Search for relevant policy sections"""
        try:
            # Generate query embedding
            query_embedding = embedding_model.encode([query])[0].tolist()
            
            # Search vector store
            collection = vector_store.get_or_create_collection(self.collection_name)
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            # Format results
            formatted_results = []
            if results['documents'] and len(results['documents']) > 0:
                for i, doc in enumerate(results['documents'][0]):
                    formatted_results.append({
                        'content': doc,
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                        'distance': results['distances'][0][i] if results['distances'] else None
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ Policy search error: {e}")
            return []

# Global instance
policy_loader = PolicyLoader()
```

### Step 3: Update Agent Service to Handle Policy Queries

**File: `apps/agent-service/services/agent_service.py`**

Add policy query intent detection:

```python
# Add to process_chat method after existing intents

# INTENT 5: Policy Query
is_policy_query = any(keyword in message_lower for keyword in [
    'policy', 'policies', 'cancellation', 'refund', 'cancel',
    'payment', 'rules', 'house rules', 'guest rules', 'terms',
    'conditions', 'fee', 'fees', 'charge'
])

if is_policy_query and not (is_booking_query or is_plan_query):
    logger.info("🎯 Intent: Policy query")
    
    from rag.policy_loader import policy_loader
    
    # Search policy documents
    policy_results = policy_loader.search_policies(message, n_results=3)
    
    if not policy_results:
        return {
            "message": "I couldn't find specific information about that policy. Please contact our support team for detailed policy information.",
            "data": None
        }
    
    # Build context from retrieved policies
    policy_context = "\n\n".join([
        f"[{result['metadata'].get('policy_type', 'Policy')}]\n{result['content']}"
        for result in policy_results
    ])
    
    # Build conversation context
    context_messages = "\n".join([
        f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
        for msg in conversation_history[-4:]
    ])
    
    # Use LLM to generate natural answer
    prompt = f"""You are a helpful AI assistant for an Airbnb-like platform.

CONVERSATION HISTORY:
{context_messages if context_messages else 'No previous conversation'}

USER'S QUESTION: "{message}"

RELEVANT POLICY INFORMATION:
{policy_context}

Based ONLY on the policy information provided above, answer the user's question clearly and concisely.
If the provided information doesn't fully answer the question, say so and suggest they contact support.
Keep the response under 4 sentences and use a friendly, helpful tone.

Answer:"""
    
    llm_response = await self.llm.chat(prompt)
    
    # Add source attribution
    sources = list(set([r['metadata'].get('policy_type', 'Policy') for r in policy_results]))
    source_text = f"\n\n📋 Source: {', '.join(sources)}"
    
    return {
        "message": llm_response + source_text,
        "data": {
            "policy_sources": sources,
            "retrieved_chunks": len(policy_results)
        }
    }
```

### Step 4: Create Sample Policy Documents

**File: `apps/agent-service/policies/cancellation_policy.md`**

```markdown
# Cancellation Policy

## Free Cancellation Period
Guests can cancel their reservation for free up to 48 hours after booking, as long as the check-in date is at least 14 days away.

## Flexible Cancellation
- Full refund if cancelled at least 24 hours before check-in
- No refund for cancellations made within 24 hours of check-in

## Moderate Cancellation
- Full refund if cancelled at least 5 days before check-in
- 50% refund if cancelled within 5 days but more than 24 hours before check-in
- No refund if cancelled within 24 hours of check-in

## Strict Cancellation
- Full refund if cancelled within 48 hours of booking and at least 14 days before check-in
- 50% refund if cancelled at least 7 days before check-in
- No refund if cancelled less than 7 days before check-in

## Host Cancellation
If a host cancels a reservation, the guest receives a full refund and an additional 10% credit for their next booking.

## Emergency Circumstances
In cases of emergency or extenuating circumstances (natural disasters, serious illness, etc.), we may offer full refunds on a case-by-case basis. Guests must provide documentation.
```

**File: `apps/agent-service/policies/payment_policy.md`**

```markdown
# Payment Policy

## When Payment is Charged
- At booking: Service fee (typically 14% of the subtotal)
- 24 hours before check-in: Remaining balance (accommodation cost + taxes)

## Accepted Payment Methods
- Credit cards (Visa, Mastercard, American Express)
- Debit cards
- PayPal
- Apple Pay
- Google Pay

## Service Fees
- Guest service fee: 0-20% of the booking subtotal (typically 14%)
- Host service fee: 3% of the booking subtotal

## Security Deposit
Some hosts may require a security deposit, which is:
- Held (not charged) at the time of booking
- Released 14 days after checkout if no damage is reported
- Up to $500 for most properties

## Currency Conversion
Prices are shown in your local currency, but may be charged in the host's currency. Your bank may charge a foreign transaction fee.

## Failed Payments
If payment fails:
1. You'll receive a notification
2. You have 72 hours to update payment method
3. After 72 hours, the reservation may be automatically cancelled
```

**File: `apps/agent-service/policies/house_rules.md`**

```markdown
# House Rules and Guest Guidelines

## Check-in / Check-out
- Standard check-in: 3:00 PM - 11:00 PM
- Standard check-out: 11:00 AM
- Early check-in or late checkout may be available by arrangement

## Guest Capacity
- Maximum number of guests is specified in the listing
- Additional unauthorized guests may result in extra fees or cancellation
- Infants under 2 years old don't count toward the guest limit

## Smoking Policy
- Most properties are non-smoking
- Violation may result in cleaning fees ($200-$500)
- Designated outdoor smoking areas may be available

## Pets
- Pets allowed only if explicitly stated in listing
- Service animals are always welcome (with proper documentation)
- Unauthorized pets may result in cleaning fees and immediate cancellation

## Noise and Quiet Hours
- Quiet hours typically 10:00 PM - 8:00 AM
- No parties or events unless approved by host
- Excessive noise complaints may result in immediate eviction without refund

## Damage and Cleanliness
- Guests are responsible for damages beyond normal wear and tear
- Leave property in similar condition to arrival
- Report any damage immediately to avoid disputes

## Safety
- No illegal activities
- Follow all fire safety regulations
- Don't tamper with smoke detectors or security equipment
- Emergency contact information provided at check-in
```

### Step 5: Add Ingestion Endpoint

**File: `apps/agent-service/routes/admin_routes.py`** (new file)

```python
from fastapi import APIRouter, HTTPException
from rag.policy_loader import policy_loader
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/ingest-policies")
async def ingest_policies():
    """
    Manually trigger policy document ingestion
    Use this whenever policy documents are updated
    """
    try:
        logger.info("🔄 Manual policy ingestion triggered")
        policy_loader.ingest_policies()
        
        return {
            "success": True,
            "message": "Policy documents ingested successfully"
        }
    except Exception as e:
        logger.error(f"❌ Policy ingestion failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest policies: {str(e)}"
        )

@router.get("/search-policies")
async def search_policies(query: str, n_results: int = 3):
    """Test policy search"""
    try:
        results = policy_loader.search_policies(query, n_results)
        return {
            "query": query,
            "results": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
```

Add to main.py:
```python
from routes import admin_routes
app.include_router(admin_routes.router)
```

### Step 6: Auto-ingest on Startup

**File: `apps/agent-service/main.py`**

```python
@app.on_event("startup")
async def startup_event():
    # ... existing startup code ...
    
    # Ingest policy documents
    try:
        from rag.policy_loader import policy_loader
        logger.info("📚 Loading policy documents...")
        policy_loader.ingest_policies()
        logger.info("✅ Policy documents loaded")
    except Exception as e:
        logger.warning(f"⚠️ Policy loading failed (non-critical): {e}")
```

## Usage Examples

### Example 1: Cancellation Policy

```
User: "What's your cancellation policy?"

AI: "Our cancellation policy varies by booking type:

- **Flexible**: Full refund if cancelled 24+ hours before check-in
- **Moderate**: Full refund if cancelled 5+ days before, 50% refund if 2-5 days before
- **Strict**: 50% refund if cancelled 7+ days before check-in

You can cancel for free within 48 hours of booking if check-in is 14+ days away. Check your booking details to see which policy applies to your reservation.

📋 Source: Cancellation Policy"
```

### Example 2: Payment Questions

```
User: "When will I be charged?"

AI: "You'll be charged in two parts:
1. Service fee (around 14%) is charged immediately at booking
2. The remaining balance is charged 24 hours before your check-in date

We accept credit cards, PayPal, Apple Pay, and Google Pay. If you have any payment concerns, let me know!

📋 Source: Payment Policy"
```

### Example 3: House Rules

```
User: "Can I bring my dog?"

AI: "Pets are only allowed if explicitly stated in the property listing. However, service animals are always welcome with proper documentation. If you bring an unauthorized pet, you may face cleaning fees and possible cancellation. I recommend checking the specific listing or contacting the host to ask about their pet policy!

📋 Source: House Rules And Guest Guidelines"
```

## Testing

### 1. Ingest Policies

```bash
# Create policy files first
curl -X POST http://localhost:8000/admin/ingest-policies
```

### 2. Test Search

```bash
curl "http://localhost:8000/admin/search-policies?query=cancellation&n_results=3"
```

### 3. Test in Chatbot

- "What's the cancellation policy?"
- "When do I get charged?"
- "Can I smoke in the property?"
- "What if I need to cancel?"
- "Are pets allowed?"

## Advantages

1. **Always Up-to-date**: Edit markdown files, re-ingest
2. **Source Attribution**: Shows which policy was referenced
3. **Semantic Search**: Finds relevant info even with different wording
4. **Context-Aware**: Considers conversation history
5. **Scalable**: Add more policies easily

## File Structure

```
apps/agent-service/
├── policies/                    # ← New
│   ├── cancellation_policy.md
│   ├── payment_policy.md
│   ├── house_rules.md
│   └── refund_policy.md
├── rag/
│   ├── policy_loader.py        # ← New
│   ├── embeddings.py           # ← Existing
│   ├── vector_store.py         # ← Existing
│   └── retriever.py
├── routes/
│   ├── admin_routes.py         # ← New
│   └── agent_routes.py
└── services/
    └── agent_service.py         # ← Modified
```

## Summary

This implementation uses RAG to:
1. Store policy documents as searchable vectors
2. Retrieve relevant sections based on user questions
3. Generate natural, accurate answers using LLM + retrieved context
4. Provide source attribution for transparency

The user can simply drop policy files into the `policies/` folder and restart the service!

