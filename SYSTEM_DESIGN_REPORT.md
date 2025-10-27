# 2. System Design

## 2.1 Architecture Overview

The system follows a **three-tier microservices architecture** pattern consisting of:

1. **Presentation Layer** - React 19 frontend with TypeScript
2. **Application Layer** - Node.js/Express.js RESTful API backend
3. **Data Layer** - MySQL relational database
4. **AI Service Layer** - Python FastAPI service for intelligent travel recommendations

This architecture enables **separation of concerns**, **scalability**, and **independent deployment** of services while maintaining clear communication boundaries through well-defined RESTful APIs.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Browser                              │
│                    (React 19 + TypeScript)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Auth Pages   │  │ Property     │  │ Booking & Dashboard     │ │
│  │ Login/Signup │  │ Search/Detail│  │ Management              │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘ │
│          │                  │                     │                │
│          └──────────────────┴─────────────────────┘                │
│                             │                                      │
│                    React Router + Axios                            │
│                    (HTTP/REST Communication)                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                ┌──────────────┴────────────────┐
                │                               │
                ▼                               ▼
┌───────────────────────────────┐   ┌──────────────────────────────┐
│   Backend API (Node.js)       │   │  AI Agent Service (Python)   │
│   Express.js Framework        │   │  FastAPI Framework           │
│   Port: 5001                  │   │  Port: 8000                  │
│                               │   │                              │
│  ┌─────────────────────────┐ │   │  ┌────────────────────────┐ │
│  │  Route Controllers      │ │   │  │  LangChain Agent       │ │
│  │  • /api/auth            │ │   │  │  • Ollama (Llama 3.2)  │ │
│  │  • /api/properties      │ │   │  │  • Tavily Search API   │ │
│  │  • /api/bookings        │ │   │  │  • RAG (Policy Docs)   │ │
│  │  • /api/profile         │ │   │  │  • Travel Planning     │ │
│  │  • /api/agent (proxy)   │ │   │  └────────────────────────┘ │
│  └─────────────────────────┘ │   │                              │
│                               │   │  ChromaDB Vector Store       │
│  Session Management           │   │  (Embeddings + Retrieval)    │
│  (express-session + MySQL)    │   │                              │
└───────────────┬───────────────┘   └──────────────┬───────────────┘
                │                                   │
                └───────────────┬───────────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │    MySQL Database             │
                │    (airbnb_db)                │
                │                               │
                │  ┌─────────────────────────┐ │
                │  │ Tables:                 │ │
                │  │ • users                 │ │
                │  │ • properties            │ │
                │  │ • bookings              │ │
                │  │ • favorites             │ │
                │  │ • sessions              │ │
                │  └─────────────────────────┘ │
                │                               │
                │  Indexes & Constraints        │
                │  Foreign Keys & Triggers      │
                └───────────────────────────────┘
```

### Key Architectural Decisions

1. **RESTful API Design** - Stateless communication with session-based authentication
2. **Microservices for AI** - Separate Python service for AI capabilities to leverage specialized ML libraries
3. **MySQL for ACID Compliance** - Ensures data consistency for critical booking transactions
4. **Session-based Authentication** - Secure server-side session management with MySQL store
5. **CORS Configuration** - Secure cross-origin resource sharing between frontend and backend services

---

## 2.2 Backend Architecture (Node.js + Express.js)

### Technology Stack

| Technology                | Purpose                              | Version      |
| ------------------------- | ------------------------------------ | ------------ |
| **Node.js**               | JavaScript runtime environment       | v22.x        |
| **Express.js**            | Web application framework            | v4.21.2      |
| **MySQL2**                | Database driver with promise support | v3.12.0      |
| **bcrypt.js**             | Password hashing algorithm           | v2.4.3       |
| **express-session**       | Session management middleware        | v1.18.1      |
| **express-mysql-session** | MySQL session store                  | v3.0.3       |
| **cors**                  | Cross-origin resource sharing        | v2.8.5       |
| **dotenv**                | Environment variable management      | v16.4.7      |
| **multer**                | File upload handling                 | v1.4.5-lts.1 |

### API Endpoints Structure

#### 1. Authentication API (`/api/auth`)

```
POST   /api/auth/signup          - User registration
POST   /api/auth/login           - User login with session creation
POST   /api/auth/logout          - Session destruction
GET    /api/auth/session         - Session validation and user info
```

**Implementation Features:**

- bcrypt password hashing (10 salt rounds)
- Session-based authentication with MySQL storage
- Role-based access control (traveler/owner)
- Automatic session expiration (7 days)

#### 2. User Management API (`/api/profile`)

```
GET    /api/profile              - Get current user profile
PUT    /api/profile              - Update profile information
POST   /api/profile/picture      - Upload profile picture
```

**Features:**

- Secure file upload with multer
- Image validation and storage
- Profile completeness tracking

#### 3. Property Management API (`/api/properties`)

```
GET    /api/properties           - List properties with filtering
GET    /api/properties/:id       - Get property details with owner info
POST   /api/properties           - Create new property (owners only)
PUT    /api/properties/:id       - Update property (owner verification)
DELETE /api/properties/:id       - Delete property (owner verification)
GET    /api/properties/:id/booked-dates - Get unavailable dates
```

**Advanced Features:**

- Multi-parameter search filtering (city, state, country, price range, guests)
- JSON field handling for images and amenities
- Owner information join with LEFT JOIN for performance
- Booking date range validation

#### 4. Booking Management API (`/api/bookings`)

```
POST   /api/bookings             - Create new booking request
GET    /api/bookings             - Get user's bookings (traveler view)
GET    /api/bookings/owner       - Get property bookings (owner view)
PUT    /api/bookings/:id/status  - Update booking status (accept/cancel)
GET    /api/bookings/history     - Booking history with filters
```

**Booking State Machine:**

```
PENDING → ACCEPTED → [Check-in] → [Check-out] → COMPLETED
   ↓
CANCELLED (by traveler or owner)
```

**Features:**

- Date overlap validation
- Automatic status transitions
- Cancellation reason tracking
- Party type classification (solo, couple, family, group, business)

#### 5. Favorites API (`/api/favorites`)

```
POST   /api/favorites            - Add property to favorites
DELETE /api/favorites/:id        - Remove from favorites
GET    /api/favorites            - List user's favorite properties
```

#### 6. AI Agent API (`/api/agent`) - Proxy to Python Service

```
POST   /api/agent/chat           - Send message to AI travel agent
GET    /api/agent/health         - Check AI service availability
```

### Middleware Architecture

```javascript
// Request Processing Pipeline
Request → CORS → Body Parser → Session → Route Handler → Response
                                  ↓
                            Authentication
                            Authorization
                            Error Handling
```

**Key Middleware:**

1. **CORS Middleware**

   - Origin: `http://localhost:5173` (development)
   - Credentials: Enabled for session cookies
   - Methods: GET, POST, PUT, DELETE, OPTIONS

2. **Session Middleware**

   ```javascript
   {
     key: 'airbnb_session',
     secret: process.env.SESSION_SECRET,
     store: MySQLStore,
     cookie: { maxAge: 7 days, httpOnly: true, sameSite: 'lax' }
   }
   ```

3. **Authentication Guard**

   - Validates session existence
   - Extracts user information
   - Rejects unauthorized requests (401)

4. **Owner Authorization**

   - Verifies user role = 'owner'
   - Property ownership validation
   - Returns 403 for forbidden actions

5. **Error Handling**
   - Centralized error catching
   - Structured error responses
   - Database error sanitization

---

## 2.3 Frontend Architecture (React)

### Technology Stack

| Technology           | Purpose                               | Version  |
| -------------------- | ------------------------------------- | -------- |
| **React**            | UI library with functional components | v19.1.1  |
| **TypeScript**       | Type-safe JavaScript                  | v5.9.3   |
| **React Router**     | Client-side routing                   | v7.9.4   |
| **Axios**            | HTTP client for API communication     | v1.12.2  |
| **Tailwind CSS**     | Utility-first CSS framework           | v4.1.14  |
| **Lucide React**     | Icon library                          | v0.545.0 |
| **React DatePicker** | Date selection component              | v8.8.0   |
| **Vite**             | Build tool and dev server             | v6.4.1   |

### Component Architecture

```
src/
├── main.tsx                    # Application entry point
├── App.tsx                     # Root component with routing
├── context/
│   └── AuthContext.tsx         # Global authentication state
├── pages/
│   ├── Home.tsx                # Property search and listing
│   ├── Login.tsx               # User authentication
│   ├── Signup.tsx              # User registration
│   ├── PropertyDetail.tsx      # Property details with booking
│   ├── Profile.tsx             # User profile management
│   ├── Bookings.tsx            # Traveler booking dashboard
│   ├── OwnerDashboard.tsx      # Owner property management
│   └── OwnerBookings.tsx       # Owner booking management
├── components/
│   ├── PropertyCard.tsx        # Property listing card
│   ├── SearchFilters.tsx       # Advanced search UI
│   ├── BookingCard.tsx         # Booking information display
│   └── AIAgentChat.tsx         # AI chatbot interface
├── services/
│   ├── authService.ts          # Authentication API calls
│   ├── propertyService.ts      # Property API calls
│   ├── bookingService.ts       # Booking API calls
│   └── agentService.ts         # AI agent API calls
├── types/
│   ├── auth.ts                 # Authentication types
│   ├── property.ts             # Property and owner types
│   └── booking.ts              # Booking types
└── utils/
    ├── imageUtils.ts           # Image URL processing
    └── dateUtils.ts            # Date formatting utilities
```

### State Management Architecture

**Context API Pattern:**

```typescript
// Global State with Context API
AuthContext
  ├── isAuthenticated: boolean
  ├── user: User | null
  ├── loading: boolean
  ├── login(email, password)
  ├── signup(userData)
  ├── logout()
  └── updateProfile(profileData)

// Component-level State with React Hooks
useState() - Local UI state
useEffect() - Side effects and API calls
useNavigate() - Programmatic navigation
useParams() - Route parameters
```

### Routing Structure

```typescript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/property/:id" element={<PropertyDetail />} />

  {/* Protected Routes (Authenticated Users) */}
  <Route
    path="/profile"
    element={
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
    }
  />
  <Route
    path="/bookings"
    element={
      <PrivateRoute>
        <Bookings />
      </PrivateRoute>
    }
  />

  {/* Owner-Only Routes */}
  <Route
    path="/owner/dashboard"
    element={
      <OwnerRoute>
        <OwnerDashboard />
      </OwnerRoute>
    }
  />
  <Route
    path="/owner/bookings"
    element={
      <OwnerRoute>
        <OwnerBookings />
      </OwnerRoute>
    }
  />
</Routes>
```

### Key Features Implementation

1. **Property Search & Filtering**

   - Real-time search with debouncing
   - Multi-criteria filtering (location, price, guests, amenities)
   - Responsive grid layout with loading states

2. **Booking Flow**

   - Date range selection with availability checking
   - Guest count validation
   - Real-time price calculation
   - Booking status tracking with visual indicators

3. **Owner Dashboard**

   - Property CRUD operations
   - Image upload with preview
   - Booking request management
   - Revenue analytics

4. **AI Agent Chat Interface**

   - Conversational UI with message history
   - Context-aware suggestions
   - Loading states for AI responses
   - Error handling and retry logic

5. **Responsive Design**
   - Mobile-first approach with Tailwind CSS
   - Breakpoint-based layouts (sm, md, lg, xl)
   - Touch-friendly UI components
   - Dark mode support

---

## 2.4 AI Agent Service (Python FastAPI)

### Technology Stack

| Technology                | Purpose                              | Version |
| ------------------------- | ------------------------------------ | ------- |
| **FastAPI**               | High-performance async web framework | Latest  |
| **LangChain**             | AI agent orchestration framework     | Latest  |
| **Ollama**                | Local LLM inference (Llama 3.2 1B)   | Latest  |
| **Tavily API**            | Real-time web search integration     | Latest  |
| **ChromaDB**              | Vector database for embeddings       | Latest  |
| **Sentence Transformers** | Text embedding models                | Latest  |
| **PyPDF2**                | PDF document processing              | Latest  |
| **MySQL Connector**       | Database integration                 | Latest  |
| **python-dotenv**         | Environment configuration            | Latest  |

### AI Agent Architecture

```python
# Agent Pipeline
User Query → Context Extraction → Database Query → LLM Processing → Tool Execution → Response Generation
                                        ↓                                    ↓
                                  Booking Info                        Tavily Search
                                  User Preferences                    RAG Retrieval
                                  Property Details                    Weather API
```

### Core Components

#### 1. **LangChain Agent with Ollama**

```python
Model: Llama 3.2 1B Instruct
Temperature: 0.7
Max Tokens: 1000
Streaming: Enabled

Prompt Template:
- System: Travel planning expert role
- Context: Booking details, preferences, constraints
- Tools: Web search, policy retrieval, database queries
- Output: Structured recommendations with explanations
```

#### 2. **RAG (Retrieval-Augmented Generation) System**

- **Document Store**: Airbnb policies and guidelines (PDF)
- **Embedding Model**: all-MiniLM-L6-v2 (384 dimensions)
- **Vector Store**: ChromaDB with persistence
- **Retrieval**: Top-k similarity search (k=3)
- **Use Case**: Policy compliance, house rules, cancellation info

#### 3. **Tavily Web Search Integration**

- Real-time information retrieval
- Location-specific queries (restaurants, attractions, events)
- Weather forecasts
- Local transportation options
- Emergency services and healthcare facilities

#### 4. **MySQL Integration**

```python
# Data Access Patterns
- User booking history and preferences
- Property amenities and features
- Destination popularity metrics
- Seasonal pricing trends
```

### AI Agent Capabilities

#### 1. **Context-Aware Planning**

- Analyzes booking details (location, dates, party size, type)
- Considers user preferences from profile
- Adapts to constraints (budget, accessibility, dietary)
- Multi-day itinerary generation

#### 2. **Personalized Recommendations**

```
Input: "Plan a 3-day trip to San Diego for a family of 4"

Output:
Day 1: Beach activities + kid-friendly restaurants
Day 2: Museums and educational experiences
Day 3: Theme parks or outdoor adventures

For each day:
- Morning/afternoon/evening activities
- Restaurant recommendations
- Transportation tips
- Estimated costs
- Accessibility notes
```

#### 3. **Real-Time Information Integration**

- Current weather conditions and forecasts
- Upcoming local events and festivals
- Restaurant operating hours and availability
- Traffic and transportation updates

#### 4. **Accessibility-Aware Suggestions**

- Wheelchair accessibility information
- Mobility aid considerations
- Dietary restriction accommodations (vegan, halal, kosher, allergies)
- Sensory-friendly venue identification

#### 5. **Multi-Format Output Generation**

**A. Detailed Itineraries**

```json
{
  "days": [
    {
      "day": 1,
      "theme": "Coastal Exploration",
      "morning": {
        "activity": "La Jolla Cove",
        "duration": "2-3 hours",
        "cost": "Free",
        "accessibility": "Partially accessible"
      },
      "afternoon": {...},
      "evening": {...}
    }
  ]
}
```

**B. Activity Cards**

- Name, description, duration
- Price range, booking requirements
- Location and directions
- User ratings and reviews
- Accessibility information

**C. Packing Lists**

- Weather-appropriate clothing
- Activity-specific gear
- Travel documents
- Medical supplies
- Kid-specific items (if applicable)

**D. Local Tips**

- Cultural etiquette
- Safety precautions
- Money-saving tips
- Hidden gems and local favorites
- Emergency contact information

### API Endpoints

```python
POST /chat
- Input: { message, booking_id, user_preferences }
- Output: { response, sources, suggestions }

GET /health
- Status check for service availability

POST /policies/search
- RAG-based policy document retrieval
```

---

## 2.5 Database Design

### MySQL Schema Overview

The database uses a **normalized relational design** following **Third Normal Form (3NF)** to minimize redundancy while maintaining query performance through strategic indexing.

### Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Database Schema                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       USERS          │
│──────────────────────│
│ PK id                │◄────────┐
│    name              │         │
│    email (UNIQUE)    │         │
│    password          │         │
│    role              │         │ owner_id (FK)
│    phone_number      │         │
│    about_me          │    ┌────┴──────────────────┐
│    city              │    │     PROPERTIES        │
│    state             │    │───────────────────────│
│    country           │    │ PK id                 │
│    languages         │    │ FK owner_id           │
│    gender            │    │    property_name      │
│    profile_picture   │    │    property_type      │
│    created_at        │    │    description        │
│    updated_at        │    │    address            │
└──────────────────────┘    │    city               │
         ▲                  │    state              │
         │                  │    country            │
         │ traveler_id      │    zipcode            │
         │ (FK)             │    bedrooms           │
         │                  │    bathrooms          │
    ┌────┴─────────────┐   │    max_guests         │
    │    BOOKINGS      │   │    price_per_night    │
    │──────────────────│   │    cleaning_fee       │
    │ PK id            │   │    service_fee        │
    │ FK traveler_id   ├───►│    amenities (JSON)   │
    │ FK property_id   │   │    images (JSON)      │
    │ FK owner_id      │   │    available          │
    │    check_in      │   │    created_at         │
    │    check_out     │   │    updated_at         │
    │    number_of_    │   └───────────────────────┘
    │    guests        │         ▲
    │    total_price   │         │ property_id (FK)
    │    status        │         │
    │    party_type    │         │
    │    cancelled_by  │    ┌────┴──────────────────┐
    │    cancelled_at  │    │     FAVORITES         │
    │    cancellation_ │    │───────────────────────│
    │    reason        │    │ PK id                 │
    │    created_at    │    │ FK user_id            │
    │    updated_at    │    │ FK property_id        │
    └──────────────────┘    │    created_at         │
                            └───────────────────────┘
         ▲
         │ session_id
         │
    ┌────┴──────────────────┐
    │     SESSIONS          │
    │───────────────────────│
    │ PK session_id         │
    │    data               │
    │    expires            │
    └───────────────────────┘
```

### Table Schemas

#### 1. **Users Table**

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('traveler', 'owner') NOT NULL,
  phone_number VARCHAR(20),
  about_me TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  country VARCHAR(100),
  languages VARCHAR(255),
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
  profile_picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email)
);
```

**Indexes:**

- Primary key on `id`
- Unique index on `email` (authentication)
- Index on `role` (filtering by user type)

#### 2. **Properties Table**

```sql
CREATE TABLE properties (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  property_name VARCHAR(255) NOT NULL,
  property_type ENUM('apartment','house','condo','villa','cabin','cottage','loft','other'),
  description TEXT,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2),
  country VARCHAR(100) NOT NULL,
  zipcode VARCHAR(20),
  bedrooms INT NOT NULL,
  bathrooms DECIMAL(3,1) NOT NULL,
  max_guests INT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  cleaning_fee DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  amenities JSON,
  images JSON,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_city (city),
  INDEX idx_country (country),
  INDEX idx_price (price_per_night),
  INDEX idx_available (available),
  INDEX idx_owner (owner_id)
);
```

**Indexes:**

- Primary key on `id`
- Foreign key on `owner_id` (owner verification)
- Composite index on `(city, state, country)` (location search)
- Index on `price_per_night` (price filtering)
- Index on `available` (availability filtering)

**JSON Fields:**

- `amenities`: Array of amenity strings (wifi, parking, pool, etc.)
- `images`: Array of image URLs

#### 3. **Bookings Table**

```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  traveler_id INT NOT NULL,
  property_id INT NOT NULL,
  owner_id INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  number_of_guests INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING','ACCEPTED','CANCELLED') DEFAULT 'PENDING',
  party_type ENUM('solo','couple','family','group','business') DEFAULT 'couple',
  cancelled_by ENUM('traveler','owner'),
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_traveler (traveler_id),
  INDEX idx_property (property_id),
  INDEX idx_owner (owner_id),
  INDEX idx_dates (check_in, check_out),
  INDEX idx_status (status)
);
```

**Indexes:**

- Primary key on `id`
- Foreign keys on `traveler_id`, `property_id`, `owner_id`
- Composite index on `(check_in, check_out)` (date range queries)
- Index on `status` (filtering by booking status)

**Booking Status Flow:**

```
PENDING → User creates booking request
ACCEPTED → Owner approves the booking
CANCELLED → Either party cancels (tracked in cancelled_by)
```

#### 4. **Favorites Table**

```sql
CREATE TABLE favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  property_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, property_id),
  INDEX idx_user (user_id)
);
```

**Indexes:**

- Primary key on `id`
- Unique composite index on `(user_id, property_id)` (prevent duplicates)
- Foreign keys on `user_id` and `property_id`

#### 5. **Sessions Table**

```sql
CREATE TABLE sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT,
  INDEX idx_expires (expires)
);
```

**Purpose:**

- Server-side session storage for authentication
- Automatic cleanup of expired sessions
- Secure cookie-based session management

### Database Optimization Strategies

#### 1. **Indexing Strategy**

- **Primary Keys**: Auto-incrementing integers for performance
- **Foreign Keys**: Ensure referential integrity with CASCADE deletes
- **Composite Indexes**: Multi-column searches (location, dates)
- **Selective Indexes**: Frequently filtered columns (status, available)

#### 2. **Query Optimization**

```sql
-- Property search with owner info (single LEFT JOIN)
SELECT p.*, u.name as owner_name, u.email as owner_email,
       u.profile_picture as owner_profile_picture,
       u.created_at as owner_since
FROM properties p
LEFT JOIN users u ON p.owner_id = u.id
WHERE p.city = ? AND p.available = 1
  AND p.price_per_night BETWEEN ? AND ?
LIMIT 20;

-- Booking date availability check
SELECT COUNT(*) FROM bookings
WHERE property_id = ?
  AND status IN ('PENDING', 'ACCEPTED')
  AND (
    (check_in <= ? AND check_out > ?) OR
    (check_in < ? AND check_out >= ?)
  );
```

#### 3. **Data Integrity**

- **Foreign key constraints** with `ON DELETE CASCADE`
- **ENUM types** for predefined value sets (role, status, party_type)
- **NOT NULL constraints** for required fields
- **UNIQUE constraints** on email and favorite pairs
- **Default values** for timestamps and boolean fields

#### 4. **JSON Field Usage**

- **Flexible schema** for variable-length arrays (amenities, images)
- **Indexing limitation**: Cannot index JSON fields directly
- **Trade-off**: Flexibility vs. query performance
- **Best practice**: Use for semi-structured data with infrequent searches

### Scalability Considerations

1. **Connection Pooling**

   - Pool size: 10 concurrent connections
   - Keep-alive: Enabled for persistent connections
   - Queue limit: 0 (unlimited queuing)

2. **Session Management**

   - MySQL-based session store for horizontal scaling
   - Automatic cleanup of expired sessions (15-minute intervals)
   - 7-day session expiration

3. **Future Enhancements**
   - Read replicas for search queries
   - Caching layer (Redis) for hot data
   - Partitioning bookings table by date ranges
   - Full-text search indexes for property descriptions

---

## Summary

This microservices architecture provides:

✅ **Separation of Concerns** - Clear boundaries between presentation, business logic, and data layers  
✅ **Scalability** - Independent scaling of frontend, backend, and AI services  
✅ **Maintainability** - Modular codebase with well-defined interfaces  
✅ **Security** - Session-based auth, password hashing, SQL injection prevention  
✅ **Performance** - Optimized queries, strategic indexing, connection pooling  
✅ **Flexibility** - JSON fields for semi-structured data, microservices for specialized tasks  
✅ **Intelligence** - AI-powered recommendations with RAG and real-time search

The system successfully balances traditional web application architecture with modern AI capabilities while maintaining data integrity and user experience quality.
