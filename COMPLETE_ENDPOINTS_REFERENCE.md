# 🌐 Airbnb Clone - Complete Endpoints Reference

**Project:** Airbnb Clone with AI Travel Assistant  
**Last Updated:** October 27, 2025

---

## 📋 Table of Contents

1. [Frontend Routes (Port 5173)](#frontend-routes-port-5173)
2. [Backend API Endpoints (Port 5000)](#backend-api-endpoints-port-5000)
3. [Agent Service API Endpoints (Port 8000)](#agent-service-api-endpoints-port-8000)
4. [Quick Reference Tables](#quick-reference-tables)

---

## Frontend Routes (Port 5173)

**Base URL:** `http://localhost:5173`

### Public Routes (No Authentication Required)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page with property search |
| `/login` | Login | User login page |
| `/signup` | Signup | User registration page |
| `/properties` | PropertyList | Browse all properties with filters |
| `/properties/:id` | PropertyDetail | View individual property details |
| `/about` | About | About the platform |
| `/contact` | Contact | Contact page |

### Protected Routes (Authentication Required)

#### Traveler Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/profile` | Profile | User profile management |
| `/bookings` | MyBookings | View user's bookings |
| `/bookings/:id` | BookingDetail | View booking details |
| `/favorites` | Favorites | View saved properties |
| `/chat` | AIChat | Chat with AI travel assistant |

#### Owner Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/owner/properties` | OwnerProperties | Manage properties |
| `/owner/properties/new` | CreateProperty | Create new property |
| `/owner/properties/:id/edit` | EditProperty | Edit existing property |
| `/owner/bookings` | OwnerBookings | Manage booking requests |
| `/owner/dashboard` | OwnerDashboard | Owner analytics dashboard |

#### Admin Routes (Optional)
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | AdminDashboard | Admin control panel |
| `/admin/users` | UserManagement | Manage users |
| `/admin/properties` | PropertyManagement | Manage all properties |

---

## Backend API Endpoints (Port 5000)

**Base URL:** `http://localhost:5000`

### 1. Authentication API (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/signup` | Register new user | ❌ No |
| `POST` | `/api/auth/login` | Login user (create session) | ❌ No |
| `POST` | `/api/auth/logout` | Logout user (destroy session) | ✅ Yes |
| `GET` | `/api/auth/session` | Get current session info | ❌ No |

**Request Body Examples:**

**Signup:**
```json
{
  "username": "john_traveler",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "role": "traveler"
}
```

**Login:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

---

### 2. User Profile API (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/profile` | Get user profile | ✅ Yes |
| `PUT` | `/api/profile` | Update user profile | ✅ Yes |
| `POST` | `/api/profile/picture` | Upload profile picture | ✅ Yes |

**Request Body Example (Update Profile):**
```json
{
  "full_name": "John Michael Doe",
  "phone": "+1234567890",
  "bio": "Adventure seeker and travel enthusiast",
  "location": "San Francisco, CA"
}
```

---

### 3. Property Management API (`/api/properties`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/properties` | Get all properties (with filters) | ❌ No |
| `GET` | `/api/properties/:id` | Get property details | ❌ No |
| `POST` | `/api/properties` | Create new property | ✅ Yes (Owner) |
| `PUT` | `/api/properties/:id` | Update property | ✅ Yes (Owner) |
| `DELETE` | `/api/properties/:id` | Delete property | ✅ Yes (Owner) |
| `GET` | `/api/properties/:id/booked-dates` | Get booked dates for property | ❌ No |

**Query Parameters for GET /api/properties:**
- `city` - Filter by city
- `state` - Filter by state
- `country` - Filter by country
- `min_price` - Minimum price per night
- `max_price` - Maximum price per night
- `guests` - Number of guests
- `property_type` - Property type (Villa, Apartment, etc.)
- `bedrooms` - Number of bedrooms
- `bathrooms` - Number of bathrooms

**Request Body Example (Create Property):**
```json
{
  "title": "Luxury Beachfront Villa",
  "description": "Stunning ocean views with private beach access",
  "property_type": "Villa",
  "price_per_night": 350,
  "address": "123 Pacific Coast Highway",
  "city": "Los Angeles",
  "state": "CA",
  "country": "USA",
  "zipcode": "90265",
  "bedrooms": 4,
  "bathrooms": 3,
  "max_guests": 8,
  "amenities": ["WiFi", "Pool", "Beach Access", "Kitchen"],
  "images": ["/uploads/villa1.jpg", "/uploads/villa2.jpg"]
}
```

---

### 4. Booking Management API (`/api/bookings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/bookings` | Create new booking | ✅ Yes (Traveler) |
| `GET` | `/api/bookings` | Get user's bookings | ✅ Yes (Traveler) |
| `GET` | `/api/bookings/:id` | Get booking details | ✅ Yes |
| `GET` | `/api/bookings/owner` | Get owner's property bookings | ✅ Yes (Owner) |
| `PUT` | `/api/bookings/:id/status` | Update booking status | ✅ Yes (Owner/Traveler) |
| `GET` | `/api/bookings/history` | Get booking history | ✅ Yes |
| `DELETE` | `/api/bookings/:id` | Cancel booking | ✅ Yes |

**Query Parameters:**
- `status` - Filter by status (PENDING, ACCEPTED, CANCELLED)
- `property_id` - Filter by property (owner only)

**Request Body Example (Create Booking):**
```json
{
  "property_id": 1,
  "check_in": "2025-12-01",
  "check_out": "2025-12-05",
  "number_of_guests": 4,
  "party_type": "family",
  "special_requests": "Late check-in preferred"
}
```

**Request Body Example (Update Status):**
```json
{
  "status": "ACCEPTED"
}
```

**Request Body Example (Cancel):**
```json
{
  "status": "CANCELLED",
  "cancellation_reason": "Change in travel plans"
}
```

---

### 5. Favorites API (`/api/favorites`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/favorites` | Add property to favorites | ✅ Yes |
| `GET` | `/api/favorites` | Get user's favorites | ✅ Yes |
| `DELETE` | `/api/favorites/:id` | Remove from favorites | ✅ Yes |

**Request Body Example (Add to Favorites):**
```json
{
  "property_id": 1
}
```

---

### 6. AI Agent Proxy API (`/api/agent`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/agent/chat` | Chat with AI assistant | ✅ Yes |
| `GET` | `/api/agent/health` | Check AI service health | ✅ Yes |

**Request Body Example (Chat):**
```json
{
  "message": "Show me my bookings",
  "booking_id": null,
  "conversation_history": []
}
```

---

### 7. Reviews API (`/api/reviews`) (Optional)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/reviews` | Create review | ✅ Yes |
| `GET` | `/api/reviews/:property_id` | Get property reviews | ❌ No |
| `PUT` | `/api/reviews/:id` | Update review | ✅ Yes |
| `DELETE` | `/api/reviews/:id` | Delete review | ✅ Yes |

---

### 8. Search API (`/api/search`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/search` | Search properties | ❌ No |
| `GET` | `/api/search/autocomplete` | Autocomplete suggestions | ❌ No |

---

## Agent Service API Endpoints (Port 8000)

**Base URL:** `http://localhost:8000`

### 1. Health & Test Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | Root endpoint | ❌ No |
| `GET` | `/health` | Health check (all services) | ❌ No |
| `GET` | `/test-mongodb` | Test MongoDB connection | ❌ No |
| `GET` | `/test-ollama` | Test Ollama LLM connection | ❌ No |

---

### 2. Agent Endpoints (`/agent`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/agent/chat` | Conversational AI chat | ✅ Yes (Secret) |
| `POST` | `/agent/plan` | Generate structured travel plan | ✅ Yes (Secret) |
| `POST` | `/agent/query` | Process natural language query | ✅ Yes (Secret) |

**Request Body Example (Chat):**
```json
{
  "user_id": "665c1f2a9b1e4f4c8d2a1b23",
  "message": "Show me my bookings",
  "booking_id": null,
  "conversation_history": [],
  "secret": "change-this-secret-in-production"
}
```

**Request Body Example (Plan):**
```json
{
  "booking_id": "665c1f2a9b1e4f4c8d2a1b45",
  "user_id": "665c1f2a9b1e4f4c8d2a1b23",
  "query": "Create a travel plan for Los Angeles",
  "preferences": {
    "budget": "low",
    "interests": ["beaches", "food"],
    "dietary_restrictions": ["vegan"]
  },
  "secret": "change-this-secret-in-production"
}
```

---

### 3. Admin Endpoints (`/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/admin/ingest-policies` | Load policy documents into RAG | ❌ No |
| `GET` | `/admin/search-policies` | Search policy documents | ❌ No |
| `GET` | `/admin/policy-stats` | Get policy statistics | ❌ No |

**Query Parameters for Search:**
- `query` - Search query string
- `n_results` - Number of results (default: 3)

---

## Quick Reference Tables

### Complete Endpoint Count

| Service | Category | Endpoints | Total |
|---------|----------|-----------|-------|
| **Frontend** | Public Routes | 7 | - |
| **Frontend** | Traveler Routes | 5 | - |
| **Frontend** | Owner Routes | 5 | - |
| **Frontend** | Admin Routes | 3 | **20** |
| **Backend** | Authentication | 4 | - |
| **Backend** | Profile | 3 | - |
| **Backend** | Properties | 6 | - |
| **Backend** | Bookings | 7 | - |
| **Backend** | Favorites | 3 | - |
| **Backend** | Agent Proxy | 2 | - |
| **Backend** | Reviews | 4 | - |
| **Backend** | Search | 2 | **31** |
| **Agent Service** | Health | 4 | - |
| **Agent Service** | Agent | 3 | - |
| **Agent Service** | Admin | 3 | **10** |
| | | **TOTAL** | **61** |

---

### HTTP Methods Summary

| Method | Backend Count | Agent Service Count | Total |
|--------|---------------|---------------------|-------|
| `GET` | 15 | 7 | 22 |
| `POST` | 9 | 3 | 12 |
| `PUT` | 3 | 0 | 3 |
| `DELETE` | 4 | 0 | 4 |
| **Total** | **31** | **10** | **41** |

---

### Authentication Requirements

| Service | Public | Session Auth | Secret Auth |
|---------|--------|--------------|-------------|
| **Backend API** | 10 endpoints | 21 endpoints | 0 |
| **Agent Service** | 4 endpoints | 0 | 6 endpoints |
| **Total** | **14** | **21** | **6** |

---

### URLs for Quick Copy-Paste

#### Frontend
```
http://localhost:5173/
http://localhost:5173/login
http://localhost:5173/signup
http://localhost:5173/properties
http://localhost:5173/profile
http://localhost:5173/bookings
http://localhost:5173/favorites
http://localhost:5173/chat
http://localhost:5173/owner/properties
http://localhost:5173/owner/bookings
```

#### Backend API
```
http://localhost:5000/api/auth/signup
http://localhost:5000/api/auth/login
http://localhost:5000/api/auth/logout
http://localhost:5000/api/auth/session
http://localhost:5000/api/profile
http://localhost:5000/api/properties
http://localhost:5000/api/bookings
http://localhost:5000/api/favorites
http://localhost:5000/api/agent/chat
```

#### Agent Service
```
http://localhost:8000/health
http://localhost:8000/test-mongodb
http://localhost:8000/test-ollama
http://localhost:8000/agent/chat
http://localhost:8000/agent/plan
http://localhost:8000/admin/ingest-policies
http://localhost:8000/admin/search-policies
http://localhost:8000/admin/policy-stats
```

---

### Environment Setup

#### Development Ports
```bash
Frontend:        http://localhost:5173
Backend:         http://localhost:5000
Agent Service:   http://localhost:8000
MongoDB:         mongodb://localhost:27017 (airbnb_backend)
Ollama:          http://localhost:11434
```

#### Required Services
```bash
✅ Node.js (v16+)      - Frontend & Backend
✅ Python (v3.9+)      - Agent Service
✅ MongoDB (v6+)       - Database
✅ Ollama              - LLM Service
```

---

### Testing Workflow

#### 1. Start All Services
```bash
# Terminal 1 - Backend
cd apps/backend && npm start

# Terminal 2 - Frontend
cd apps/frontend && npm run dev

# Terminal 3 - Agent Service
cd apps/agent-service && python3 main.py
```

#### 2. Test Health Checks
```bash
curl http://localhost:5000/api/auth/session
curl http://localhost:8000/health
```

#### 3. Test Authentication Flow
```bash
# 1. Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","full_name":"Test User","role":"traveler"}' \
  -c cookies.txt

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt

# 3. Get Profile
curl http://localhost:5000/api/profile -b cookies.txt
```

#### 4. Test Complete User Flow
```bash
# Browse properties
curl "http://localhost:5000/api/properties?city=Los Angeles"

# Create booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"property_id":1,"check_in":"2025-12-01","check_out":"2025-12-05","number_of_guests":2}'

# Chat with AI
curl -X POST http://localhost:5000/api/agent/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"message":"Show me my bookings"}'
```

---

### Common API Patterns

#### Pagination (Future Enhancement)
```
GET /api/properties?page=1&limit=20
GET /api/bookings?page=2&limit=10
```

#### Sorting (Future Enhancement)
```
GET /api/properties?sort=price&order=asc
GET /api/properties?sort=created_at&order=desc
```

#### Filtering
```
GET /api/properties?city=Los Angeles&min_price=100&max_price=500
GET /api/bookings?status=ACCEPTED
GET /api/bookings/owner?property_id=1&status=PENDING
```

---

### Error Response Format

All APIs follow this error format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Success Response Format

All APIs follow this success format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

---

## Documentation Files

For detailed API documentation, refer to:

1. **BACKEND_API_GUIDE.md** - Complete backend API reference with request/response examples
2. **POSTMAN_API_GUIDE.md** - Agent service API reference with examples
3. **Backend_API.postman_collection.json** - Importable Postman collection for backend
4. **Airbnb_Agent_Service.postman_collection.json** - Importable Postman collection for agent service

---

**Note:** This is a comprehensive reference of all endpoints in the Airbnb Clone application. For detailed request/response schemas and examples, refer to the specific API guide documents.

**Version:** 1.0.0  
**Last Updated:** October 27, 2025
