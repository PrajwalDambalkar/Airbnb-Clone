# 🚀 Agent Service - Postman API Guide

**Base URL:** `http://localhost:8000`

**Authentication:** All endpoints require a secret token in the request body.

**Secret Token:** `change-this-secret-in-production` (from `.env` file: `AGENT_SERVICE_SECRET`)

---

## 📋 Table of Contents

1. [Health & Test Endpoints](#health--test-endpoints)
2. [Agent Endpoints (POST)](#agent-endpoints-post)
3. [Admin Endpoints](#admin-endpoints)
4. [Complete Example Workflow](#complete-example-workflow)

---

## 🏥 Health & Test Endpoints

### 1. Health Check
**Method:** `GET`  
**URL:** `http://localhost:8000/health`  
**Description:** Check if all services are running

**Request:** No body required

**Response Example:**
```json
{
  "status": "healthy",
  "services": {
    "api": "healthy",
    "mysql": "connected",
    "ollama": "connected",
    "tavily": "configured"
  },
  "timestamp": "2025-10-27T12:57:29.024771"
}
```

---

### 2. Test MySQL Connection
**Method:** `GET`  
**URL:** `http://localhost:8000/test-mysql`  
**Description:** Test MySQL database connection

**Request:** No body required

**Response Example:**
```json
{
  "mysql": "connected",
  "message": "Successfully connected to MySQL"
}
```

---

### 3. Test Ollama Connection
**Method:** `GET`  
**URL:** `http://localhost:8000/test-ollama`  
**Description:** Test Ollama LLM connection

**Request:** No body required

**Response Example:**
```json
{
  "ollama": "connected",
  "model": "llama3.1",
  "message": "Ollama is responding"
}
```

---

## 🤖 Agent Endpoints (POST)

### 1. Chat with AI Assistant
**Method:** `POST`  
**URL:** `http://localhost:8000/agent/chat`  
**Description:** Conversational interface for the AI travel assistant

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": 1,
  "message": "Show me my bookings",
  "booking_id": null,
  "conversation_history": [],
  "secret": "change-this-secret-in-production"
}
```

**Request Body (with booking context):**
```json
{
  "user_id": 1,
  "message": "Give me plan for los angeles",
  "booking_id": 23,
  "conversation_history": [
    {
      "role": "user",
      "content": "Show me my bookings"
    },
    {
      "role": "assistant",
      "content": "You have 1 active booking! ✅ Malibu Beach Cottage in Los Angeles, CA"
    }
  ],
  "secret": "change-this-secret-in-production"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | integer | ✅ Yes | User ID from database |
| `message` | string | ✅ Yes | User's message/query |
| `booking_id` | integer | ❌ No | Optional booking context for planning |
| `conversation_history` | array | ❌ No | Previous conversation messages |
| `secret` | string | ✅ Yes | Authentication token |

**Response Example (Show Bookings):**
```json
{
  "message": "You have 1 active booking! 🎉\n✅ Malibu Beach Cottage in Los Angeles, CA\n\nWould you like me to help you plan any of these trips?",
  "data": {
    "bookings": [
      {
        "booking_id": 23,
        "property_name": "Malibu Beach Cottage",
        "city": "Los Angeles",
        "state": "CA",
        "check_in": "2025-11-15",
        "check_out": "2025-11-18",
        "status": "ACCEPTED"
      }
    ]
  }
}
```

**Response Example (Generate Plan):**
```json
{
  "message": "🎉 **Your Personalized Los Angeles Itinerary**\n📅 2025-11-15 to 2025-11-18\n\n📋 **DAILY ITINERARY**\n\n**Day 1 - 2025-11-15**\n  🌅 **Morning (9:00 AM)**\n     • Griffith Observatory\n     Stunning city views...",
  "data": {
    "plan": {
      "booking_id": 23,
      "destination": "Los Angeles, CA",
      "dates": {
        "check_in": "2025-11-15",
        "check_out": "2025-11-18"
      },
      "itinerary": [...],
      "activities": [...],
      "restaurants": [...],
      "packing_list": [...],
      "local_tips": [...]
    }
  }
}
```

---

### 2. Create Travel Plan (Structured)
**Method:** `POST`  
**URL:** `http://localhost:8000/agent/plan`  
**Description:** Generate a complete structured travel plan for a booking

**Headers:**
```
Content-Type: application/json
```

**Request Body (Minimal):**
```json
{
  "booking_id": 23,
  "user_id": 1,
  "query": "Create a travel plan for my Los Angeles trip",
  "secret": "change-this-secret-in-production"
}
```

**Request Body (With Preferences):**
```json
{
  "booking_id": 23,
  "user_id": 1,
  "query": "Create a budget-friendly travel plan with vegan restaurants",
  "preferences": {
    "budget": "low",
    "interests": ["beaches", "food", "culture"],
    "dietary_restrictions": ["vegan"],
    "mobility_needs": {
      "wheelchair": false,
      "child_friendly": true
    }
  },
  "secret": "change-this-secret-in-production"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `booking_id` | integer | ✅ Yes | Booking ID from database |
| `user_id` | integer | ✅ Yes | User ID from database |
| `query` | string | ❌ No | Natural language query |
| `preferences` | object | ❌ No | User preferences (see below) |
| `secret` | string | ✅ Yes | Authentication token |

**Preferences Object:**
| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `budget` | string | `low`, `medium`, `high`, `luxury` | Budget tier |
| `interests` | array | `adventure`, `food`, `culture`, `relaxation`, `beaches`, `nightlife` | Activities of interest |
| `dietary_restrictions` | array | `vegan`, `vegetarian`, `gluten-free`, `kosher`, `halal` | Dietary needs |
| `mobility_needs` | object | `wheelchair`, `elderly_friendly`, `child_friendly` | Accessibility requirements |

**Response Example:**
```json
{
  "booking_id": 23,
  "destination": "Los Angeles, CA",
  "dates": {
    "check_in": "2025-11-15",
    "check_out": "2025-11-18"
  },
  "itinerary": [
    {
      "day_number": 1,
      "date": "2025-11-15",
      "morning": {
        "time": "9:00 AM",
        "activity": "Griffith Observatory",
        "description": "Start your day with stunning city views from this iconic landmark. Free admission with paid parking."
      },
      "afternoon": {
        "time": "2:00 PM",
        "activity": "Venice Beach Boardwalk",
        "description": "Stroll along the famous boardwalk, watch street performers, and enjoy the ocean breeze."
      },
      "evening": {
        "time": "7:00 PM",
        "activity": "Dinner at Gracias Madre",
        "description": "Award-winning vegan Mexican cuisine in a beautiful setting."
      }
    }
  ],
  "activities": [
    {
      "title": "Griffith Observatory",
      "description": "Iconic observatory with city views, exhibits, and planetarium shows",
      "duration": "2-3 hours",
      "price_tier": "free",
      "tags": ["culture", "outdoor", "views"],
      "accessibility": {
        "wheelchair": true,
        "child_friendly": true
      }
    }
  ],
  "restaurants": [
    {
      "name": "Gracias Madre",
      "cuisine": "Mexican (Vegan)",
      "dietary_tags": ["vegan", "vegetarian", "gluten-free options"],
      "price_tier": "$$",
      "description": "Organic, plant-based Mexican food in a trendy atmosphere"
    }
  ],
  "packing_list": [
    "Sunscreen (SPF 50+)",
    "Comfortable walking shoes",
    "Light layers for varying temperatures",
    "Reusable water bottle",
    "Camera for stunning views"
  ],
  "local_tips": [
    "Parking can be expensive - consider using Metro or rideshare",
    "Best time to visit beaches is late morning to avoid morning fog",
    "Many museums offer free admission on certain days"
  ],
  "weather_summary": "Expect sunny days with temperatures 70-75°F. Mornings may be foggy near coast.",
  "generated_at": "2025-10-27T13:00:00.000000"
}
```

---

### 3. Process Natural Language Query
**Method:** `POST`  
**URL:** `http://localhost:8000/agent/query`  
**Description:** Process a natural language query (form data)

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Request Body (Form Data):**
```
query=find vegan restaurants near Santa Monica
booking_id=23
secret=change-this-secret-in-production
```

**Or as JSON:**
```json
{
  "query": "find vegan restaurants near Santa Monica",
  "booking_id": 23,
  "secret": "change-this-secret-in-production"
}
```

**Response Example:**
```json
{
  "query": "find vegan restaurants near Santa Monica",
  "result": "Based on your search, here are some vegan restaurants..."
}
```

---

## 🔧 Admin Endpoints

### 1. Ingest Policy Documents
**Method:** `POST`  
**URL:** `http://localhost:8000/admin/ingest-policies`  
**Description:** Load policy documents into RAG vector store

**Request:** No body required

**Response Example:**
```json
{
  "success": true,
  "message": "Policy documents ingested successfully"
}
```

---

### 2. Search Policies
**Method:** `GET`  
**URL:** `http://localhost:8000/admin/search-policies?query=cancellation&n_results=3`  
**Description:** Test policy search functionality

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ Yes | Search query |
| `n_results` | integer | ❌ No | Number of results (default: 3) |

**Response Example:**
```json
{
  "success": true,
  "query": "cancellation",
  "results_count": 3,
  "results": [
    {
      "content": "Cancellation Policy: Guests can cancel their booking...",
      "metadata": {
        "policy_type": "Cancellation Policy",
        "filename": "cancellation_policy.pdf"
      },
      "distance": 0.45
    }
  ]
}
```

---

### 3. Get Policy Statistics
**Method:** `GET`  
**URL:** `http://localhost:8000/admin/policy-stats`  
**Description:** Get statistics about loaded policies

**Request:** No body required

**Response Example:**
```json
{
  "success": true,
  "total_chunks": 42,
  "policy_types": [
    "Cancellation Policy",
    "Guest Rules",
    "Payment Policy",
    "Privacy Policy"
  ],
  "policy_files": [
    "cancellation_policy.pdf",
    "guest_rules.pdf",
    "payment_policy.pdf"
  ]
}
```

---

## 🔄 Complete Example Workflow

### Step 1: Check Health
```bash
curl http://localhost:8000/health
```

### Step 2: Chat - Show Bookings
```bash
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Show me my bookings",
    "secret": "change-this-secret-in-production"
  }'
```

### Step 3: Chat - Request Itinerary
```bash
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "message": "Give me plan for los angeles with low budget",
    "booking_id": 23,
    "conversation_history": [
      {
        "role": "user",
        "content": "Show me my bookings"
      },
      {
        "role": "assistant",
        "content": "You have 1 active booking!"
      }
    ],
    "secret": "change-this-secret-in-production"
  }'
```

### Step 4: Generate Structured Plan
```bash
curl -X POST http://localhost:8000/agent/plan \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 23,
    "user_id": 1,
    "query": "Create a budget-friendly travel plan",
    "preferences": {
      "budget": "low",
      "interests": ["beaches", "food"],
      "dietary_restrictions": ["vegan"]
    },
    "secret": "change-this-secret-in-production"
  }'
```

---

## 📝 Common Use Cases

### Use Case 1: Show User's Bookings
```json
POST /agent/chat
{
  "user_id": 1,
  "message": "Show me my bookings",
  "secret": "change-this-secret-in-production"
}
```

### Use Case 2: Ask About Policies
```json
POST /agent/chat
{
  "user_id": 1,
  "message": "What is your cancellation policy?",
  "secret": "change-this-secret-in-production"
}
```

### Use Case 3: Plan a Trip with Context
```json
POST /agent/chat
{
  "user_id": 1,
  "message": "Make itinerary for los angeles",
  "booking_id": 23,
  "secret": "change-this-secret-in-production"
}
```

### Use Case 4: Custom Preferences
```json
POST /agent/plan
{
  "booking_id": 23,
  "user_id": 1,
  "query": "Plan my trip focusing on beaches and vegan food",
  "preferences": {
    "budget": "medium",
    "interests": ["beaches", "food", "relaxation"],
    "dietary_restrictions": ["vegan"],
    "mobility_needs": {
      "child_friendly": true
    }
  },
  "secret": "change-this-secret-in-production"
}
```

---

## 🔐 Authentication Notes

- All POST endpoints require the `secret` field in the request body
- Default secret: `change-this-secret-in-production`
- Change this in production via environment variable: `AGENT_SERVICE_SECRET`
- GET endpoints for admin and testing don't require authentication

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "detail": "user_id is required"
}
```

### 403 Forbidden
```json
{
  "detail": "Invalid authentication token"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to generate travel plan: Database connection error"
}
```

---

## 📦 Import to Postman

1. Create a new collection: "Airbnb Agent Service"
2. Set collection variable: `base_url` = `http://localhost:8000`
3. Set collection variable: `secret` = `change-this-secret-in-production`
4. Add each endpoint using the URLs and bodies above
5. Use `{{base_url}}` and `{{secret}}` variables in requests

---

## 🧪 Testing Tips

1. **Start with Health Check**: Always verify services are running
2. **Use Real Data**: Test with actual booking IDs from your database
3. **Test Conversations**: Build up conversation history to test context
4. **Try Different Preferences**: Test various budget/interest combinations
5. **Monitor Logs**: Watch terminal output for debugging

---

**Last Updated:** October 27, 2025  
**Version:** 1.0.0  
**Base URL:** http://localhost:8000
