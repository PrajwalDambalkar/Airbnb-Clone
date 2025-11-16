# 🏠 Airbnb Clone - Backend API Guide

**Base URL:** `http://localhost:5000`

**Authentication:** Session-based authentication using cookies (7-day expiration)

---

## 📋 Table of Contents

1. [Authentication API](#1-authentication-api-apiauth)
2. [User Management API](#2-user-management-api-apiprofile)
3. [Property Management API](#3-property-management-api-apiproperties)
4. [Booking Management API](#4-booking-management-api-apibookings)
5. [Favorites API](#5-favorites-api-apifavorites)
6. [AI Agent Proxy API](#6-ai-agent-proxy-api-apiagent)
7. [Testing Workflow](#testing-workflow)

---

## 1. Authentication API (/api/auth)

### 1.1 User Registration
**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/signup`  
**Description:** Register a new user with bcrypt password hashing (10 salt rounds)

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_traveler",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "role": "traveler"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | ✅ Yes | Unique username (3-50 chars) |
| `email` | string | ✅ Yes | Valid email address |
| `password` | string | ✅ Yes | Password (min 6 chars) |
| `full_name` | string | ✅ Yes | User's full name |
| `role` | string | ✅ Yes | `traveler` or `owner` |

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_traveler",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "traveler"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

### 1.2 User Login
**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/login`  
**Description:** Create session with role-based access control (7-day expiration)

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ Yes | User's email address |
| `password` | string | ✅ Yes | User's password |

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_traveler",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "traveler",
    "profile_picture": null
  }
}
```

**Note:** Sets session cookie automatically

---

### 1.3 User Logout
**Method:** `POST`  
**URL:** `http://localhost:5000/api/auth/logout`  
**Description:** Destroy session and cleanup MySQL store

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Request Body:** None

**Response (Success):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.4 Get Session
**Method:** `GET`  
**URL:** `http://localhost:5000/api/auth/session`  
**Description:** Validate session and retrieve user information

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Request Body:** None

**Response (Success):**
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "john_traveler",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "traveler",
    "profile_picture": "/uploads/profile_1234567890.jpg"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

---

## 2. User Management API (/api/profile)

### 2.1 Get User Profile
**Method:** `GET`  
**URL:** `http://localhost:5000/api/profile`  
**Description:** Get current user profile with completeness tracking

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Request Body:** None

**Response (Success):**
```json
{
  "success": true,
  "profile": {
    "id": 1,
    "username": "john_traveler",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "bio": "Adventure seeker and travel enthusiast",
    "profile_picture": "/uploads/profile_1234567890.jpg",
    "role": "traveler",
    "created_at": "2025-10-27T10:00:00.000Z",
    "profile_completeness": 85
  }
}
```

---

### 2.2 Update User Profile
**Method:** `PUT`  
**URL:** `http://localhost:5000/api/profile`  
**Description:** Update profile information with validation

**Headers:**
```
Content-Type: application/json
Cookie: connect.sid=<session_id>
```

**Request Body:**
```json
{
  "full_name": "John Michael Doe",
  "phone": "+1234567890",
  "bio": "Adventure seeker, foodie, and travel photographer. Love exploring new cultures!",
  "location": "San Francisco, CA"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `full_name` | string | ❌ No | User's full name |
| `phone` | string | ❌ No | Phone number |
| `bio` | string | ❌ No | User biography |
| `location` | string | ❌ No | User location |

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {
    "id": 1,
    "username": "john_traveler",
    "full_name": "John Michael Doe",
    "phone": "+1234567890",
    "bio": "Adventure seeker, foodie, and travel photographer...",
    "location": "San Francisco, CA"
  }
}
```

---

### 2.3 Upload Profile Picture
**Method:** `POST`  
**URL:** `http://localhost:5000/api/profile/picture`  
**Description:** Secure file upload with multer and image validation

**Headers:**
```
Content-Type: multipart/form-data
Cookie: connect.sid=<session_id>
```

**Request Body (Form Data):**
```
profile_picture: [FILE] (jpg, jpeg, png, max 5MB)
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "profile_picture": "/uploads/profile_1234567890.jpg"
}
```

**Postman Setup:**
1. Select `POST` method
2. Select `Body` → `form-data`
3. Key: `profile_picture`, Type: `File`
4. Choose image file

---

## 3. Property Management API (/api/properties)

### 3.1 Get All Properties (with Filters)
**Method:** `GET`  
**URL:** `http://localhost:5000/api/properties`  
**Description:** Multi-parameter filtering for property search

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `city` | string | ❌ No | Filter by city | `Los Angeles` |
| `state` | string | ❌ No | Filter by state | `CA` |
| `country` | string | ❌ No | Filter by country | `USA` |
| `min_price` | number | ❌ No | Minimum price per night | `50` |
| `max_price` | number | ❌ No | Maximum price per night | `300` |
| `guests` | number | ❌ No | Number of guests | `4` |
| `property_type` | string | ❌ No | Type of property | `Villa,Apartment` |

**Example URLs:**
```
GET http://localhost:5000/api/properties
GET http://localhost:5000/api/properties?city=Los Angeles&state=CA
GET http://localhost:5000/api/properties?min_price=100&max_price=500&guests=2
GET http://localhost:5000/api/properties?property_type=Villa,Beach House
```

**Response (Success):**
```json
{
  "success": true,
  "properties": [
    {
      "id": 1,
      "title": "Luxury Beachfront Villa",
      "description": "Stunning ocean views with private beach access",
      "property_type": "Villa",
      "price_per_night": 350.00,
      "address": "123 Pacific Coast Highway",
      "city": "Los Angeles",
      "state": "CA",
      "country": "USA",
      "bedrooms": 4,
      "bathrooms": 3,
      "max_guests": 8,
      "amenities": ["WiFi", "Pool", "Beach Access", "Kitchen"],
      "images": [
        "/uploads/property1_img1.jpg",
        "/uploads/property1_img2.jpg"
      ],
      "owner_id": 5,
      "owner_name": "Jane Smith",
      "available": true,
      "created_at": "2025-10-01T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3.2 Get Property Details
**Method:** `GET`  
**URL:** `http://localhost:5000/api/properties/:id`  
**Description:** Property details with owner info using optimized LEFT JOIN

**Example:**
```
GET http://localhost:5000/api/properties/1
```

**Response (Success):**
```json
{
  "success": true,
  "property": {
    "id": 1,
    "title": "Luxury Beachfront Villa",
    "description": "Stunning ocean views with private beach access. Perfect for family vacations.",
    "property_type": "Villa",
    "price_per_night": 350.00,
    "address": "123 Pacific Coast Highway",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "zipcode": "90265",
    "bedrooms": 4,
    "bathrooms": 3,
    "max_guests": 8,
    "amenities": ["WiFi", "Pool", "Beach Access", "Kitchen", "Parking"],
    "images": [
      "/uploads/property1_img1.jpg",
      "/uploads/property1_img2.jpg",
      "/uploads/property1_img3.jpg"
    ],
    "available": true,
    "owner": {
      "id": 5,
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "profile_picture": "/uploads/owner_5.jpg"
    },
    "created_at": "2025-10-01T10:00:00.000Z"
  }
}
```

---

### 3.3 Create Property
**Method:** `POST`  
**URL:** `http://localhost:5000/api/properties`  
**Description:** Create property with JSON fields for amenities and images arrays

**Headers:**
```
Content-Type: application/json
Cookie: connect.sid=<session_id>
```

**Request Body:**
```json
{
  "title": "Cozy Mountain Cabin",
  "description": "Peaceful retreat in the mountains with stunning views",
  "property_type": "Cabin",
  "price_per_night": 150,
  "address": "456 Mountain Road",
  "city": "Aspen",
  "state": "CO",
  "country": "USA",
  "zipcode": "81611",
  "bedrooms": 2,
  "bathrooms": 1,
  "max_guests": 4,
  "amenities": ["WiFi", "Fireplace", "Kitchen", "Hiking Trails"],
  "images": [
    "/uploads/cabin_1.jpg",
    "/uploads/cabin_2.jpg"
  ]
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | ✅ Yes | Property title |
| `description` | string | ✅ Yes | Detailed description |
| `property_type` | string | ✅ Yes | Villa, Apartment, Cabin, etc. |
| `price_per_night` | number | ✅ Yes | Price per night |
| `address` | string | ✅ Yes | Street address |
| `city` | string | ✅ Yes | City |
| `state` | string | ✅ Yes | State/Province |
| `country` | string | ✅ Yes | Country |
| `zipcode` | string | ❌ No | Postal code |
| `bedrooms` | number | ✅ Yes | Number of bedrooms |
| `bathrooms` | number | ✅ Yes | Number of bathrooms |
| `max_guests` | number | ✅ Yes | Maximum guests |
| `amenities` | array | ❌ No | List of amenities |
| `images` | array | ❌ No | List of image URLs |

**Response (Success):**
```json
{
  "success": true,
  "message": "Property created successfully",
  "property": {
    "id": 25,
    "title": "Cozy Mountain Cabin",
    "price_per_night": 150,
    "city": "Aspen",
    "state": "CO"
  }
}
```

---

### 3.4 Update Property
**Method:** `PUT`  
**URL:** `http://localhost:5000/api/properties/:id`  
**Description:** Update with owner verification and availability management

**Headers:**
```
Content-Type: application/json
Cookie: connect.sid=<session_id>
```

**Example:**
```
PUT http://localhost:5000/api/properties/25
```

**Request Body:**
```json
{
  "title": "Cozy Mountain Cabin - Updated",
  "price_per_night": 175,
  "description": "Peaceful retreat in the mountains with stunning views and hot tub",
  "amenities": ["WiFi", "Fireplace", "Kitchen", "Hiking Trails", "Hot Tub"],
  "available": true
}
```

**Note:** Only property owner can update their properties

**Response (Success):**
```json
{
  "success": true,
  "message": "Property updated successfully"
}
```

---

### 3.5 Get Booked Dates
**Method:** `GET`  
**URL:** `http://localhost:5000/api/properties/:id/booked-dates`  
**Description:** Availability check for booking date validation

**Example:**
```
GET http://localhost:5000/api/properties/1/booked-dates
```

**Response (Success):**
```json
{
  "success": true,
  "booked_dates": [
    {
      "check_in": "2025-11-15",
      "check_out": "2025-11-18",
      "status": "ACCEPTED"
    },
    {
      "check_in": "2025-11-20",
      "check_out": "2025-11-25",
      "status": "PENDING"
    }
  ]
}
```

---

## 4. Booking Management API (/api/bookings)

### 4.1 Create Booking
**Method:** `POST`  
**URL:** `http://localhost:5000/api/bookings`  
**Description:** Create booking with date overlap validation and party type classification

**Headers:**
```
Content-Type: application/json
Cookie: connect.sid=<session_id>
```

**Request Body:**
```json
{
  "property_id": 1,
  "check_in": "2025-12-01",
  "check_out": "2025-12-05",
  "number_of_guests": 4,
  "party_type": "family",
  "special_requests": "Late check-in preferred, need high chair for toddler"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `property_id` | number | ✅ Yes | Property ID |
| `check_in` | string | ✅ Yes | Check-in date (YYYY-MM-DD) |
| `check_out` | string | ✅ Yes | Check-out date (YYYY-MM-DD) |
| `number_of_guests` | number | ✅ Yes | Number of guests |
| `party_type` | string | ❌ No | solo, couple, family, group |
| `special_requests` | string | ❌ No | Special requests |

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking request created successfully",
  "booking": {
    "id": 23,
    "property_id": 1,
    "user_id": 1,
    "check_in": "2025-12-01",
    "check_out": "2025-12-05",
    "number_of_guests": 4,
    "total_price": 1400.00,
    "status": "PENDING",
    "party_type": "family"
  }
}
```

**Response (Error - Date Overlap):**
```json
{
  "success": false,
  "message": "Property is already booked for selected dates"
}
```

---

### 4.2 Get Traveler Bookings
**Method:** `GET`  
**URL:** `http://localhost:5000/api/bookings`  
**Description:** Traveler view with status filtering (PENDING/ACCEPTED/CANCELLED)

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ❌ No | PENDING, ACCEPTED, CANCELLED |

**Examples:**
```
GET http://localhost:5000/api/bookings
GET http://localhost:5000/api/bookings?status=ACCEPTED
GET http://localhost:5000/api/bookings?status=PENDING
```

**Response (Success):**
```json
{
  "success": true,
  "bookings": [
    {
      "booking_id": 23,
      "property_id": 1,
      "property_name": "Luxury Beachfront Villa",
      "property_city": "Los Angeles",
      "property_state": "CA",
      "check_in": "2025-12-01",
      "check_out": "2025-12-05",
      "number_of_guests": 4,
      "total_price": 1400.00,
      "status": "ACCEPTED",
      "party_type": "family",
      "special_requests": "Late check-in preferred",
      "created_at": "2025-10-27T10:00:00.000Z",
      "property_image": "/uploads/property1_img1.jpg"
    }
  ],
  "count": 1
}
```

---

### 4.3 Get Owner Bookings
**Method:** `GET`  
**URL:** `http://localhost:5000/api/bookings/owner`  
**Description:** Owner dashboard with property booking management

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `property_id` | number | ❌ No | Filter by specific property |
| `status` | string | ❌ No | PENDING, ACCEPTED, CANCELLED |

**Examples:**
```
GET http://localhost:5000/api/bookings/owner
GET http://localhost:5000/api/bookings/owner?property_id=1
GET http://localhost:5000/api/bookings/owner?status=PENDING
```

**Response (Success):**
```json
{
  "success": true,
  "bookings": [
    {
      "booking_id": 23,
      "property_id": 1,
      "property_name": "Luxury Beachfront Villa",
      "traveler_id": 1,
      "traveler_name": "John Doe",
      "traveler_email": "john@example.com",
      "check_in": "2025-12-01",
      "check_out": "2025-12-05",
      "number_of_guests": 4,
      "total_price": 1400.00,
      "status": "PENDING",
      "party_type": "family",
      "special_requests": "Late check-in preferred",
      "created_at": "2025-10-27T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 4.4 Update Booking Status
**Method:** `PUT`  
**URL:** `http://localhost:5000/api/bookings/:id/status`  
**Description:** State machine updates (PENDING → ACCEPTED/CANCELLED)

**Headers:**
```
Content-Type: application/json
Cookie: connect.sid=<session_id>
```

**Example:**
```
PUT http://localhost:5000/api/bookings/23/status
```

**Request Body (Accept Booking):**
```json
{
  "status": "ACCEPTED"
}
```

**Request Body (Cancel Booking):**
```json
{
  "status": "CANCELLED",
  "cancellation_reason": "Guest requested cancellation due to change in plans"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | ✅ Yes | ACCEPTED or CANCELLED |
| `cancellation_reason` | string | ⚠️ If Cancelled | Reason for cancellation |

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "booking": {
    "id": 23,
    "status": "ACCEPTED"
  }
}
```

---

### 4.5 Get Booking History
**Method:** `GET`  
**URL:** `http://localhost:5000/api/bookings/history`  
**Description:** Historical data with cancellation reason tracking

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Response (Success):**
```json
{
  "success": true,
  "history": [
    {
      "booking_id": 15,
      "property_name": "Mountain Cabin",
      "city": "Aspen",
      "state": "CO",
      "check_in": "2025-09-15",
      "check_out": "2025-09-20",
      "status": "CANCELLED",
      "cancellation_reason": "Weather conditions",
      "total_price": 750.00,
      "created_at": "2025-09-01T10:00:00.000Z",
      "cancelled_at": "2025-09-10T14:30:00.000Z"
    },
    {
      "booking_id": 12,
      "property_name": "Beach House",
      "city": "Miami",
      "state": "FL",
      "check_in": "2025-08-01",
      "check_out": "2025-08-07",
      "status": "ACCEPTED",
      "total_price": 2100.00,
      "created_at": "2025-07-15T10:00:00.000Z"
    }
  ],
  "count": 2
}
```

---

## 5. Favorites API (/api/favorites)

### 5.1 Add to Favorites
**Method:** `POST`  
**URL:** `http://localhost:5000/api/favorites`  
**Description:** Add property to favorites with duplicate prevention

**Headers:**
```
Content-Type: application/json
Cookie: connect.sid=<session_id>
```

**Request Body:**
```json
{
  "property_id": 1
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Property added to favorites",
  "favorite_id": 45
}
```

**Response (Already Exists):**
```json
{
  "success": false,
  "message": "Property already in favorites"
}
```

---

### 5.2 Remove from Favorites
**Method:** `DELETE`  
**URL:** `http://localhost:5000/api/favorites/:id`  
**Description:** Remove from favorites with proper cleanup

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Example:**
```
DELETE http://localhost:5000/api/favorites/45
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Property removed from favorites"
}
```

---

### 5.3 Get Favorites
**Method:** `GET`  
**URL:** `http://localhost:5000/api/favorites`  
**Description:** List user's favorite properties with property details

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Response (Success):**
```json
{
  "success": true,
  "favorites": [
    {
      "favorite_id": 45,
      "property_id": 1,
      "title": "Luxury Beachfront Villa",
      "city": "Los Angeles",
      "state": "CA",
      "price_per_night": 350.00,
      "property_type": "Villa",
      "image": "/uploads/property1_img1.jpg",
      "available": true,
      "added_at": "2025-10-25T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## 6. AI Agent Proxy API (/api/agent)

### 6.1 Chat with AI Agent
**Method:** `POST`  
**URL:** `http://localhost:5000/api/agent/chat`  
**Description:** Proxy requests to Python FastAPI AI service with context injection

**Headers:**
```
Content-Type: application/json
Cookie: connect.sid=<session_id>
```

**Request Body:**
```json
{
  "message": "Show me my bookings",
  "booking_id": null,
  "conversation_history": []
}
```

**Request Body (With Context):**
```json
{
  "message": "Make itinerary for los angeles",
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
  ]
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | ✅ Yes | User's message |
| `booking_id` | number | ❌ No | Optional booking context |
| `conversation_history` | array | ❌ No | Previous messages |

**Response (Success):**
```json
{
  "success": true,
  "response": {
    "message": "You have 1 active booking! 🎉\n✅ Malibu Beach Cottage in Los Angeles, CA",
    "data": {
      "bookings": [...]
    }
  }
}
```

---

### 6.2 Check AI Agent Health
**Method:** `GET`  
**URL:** `http://localhost:5000/api/agent/health`  
**Description:** Monitor AI service availability and response times

**Headers:**
```
Cookie: connect.sid=<session_id>
```

**Response (Success):**
```json
{
  "success": true,
  "agent_status": "healthy",
  "services": {
    "api": "healthy",
    "mysql": "connected",
    "ollama": "connected",
    "tavily": "configured"
  },
  "response_time_ms": 125
}
```

**Response (Agent Down):**
```json
{
  "success": false,
  "message": "AI Agent service is unavailable",
  "error": "Connection refused"
}
```

---

## Testing Workflow

### Step 1: Setup Postman Collection
1. Create new collection: "Airbnb Clone Backend"
2. Set collection variable: `base_url` = `http://localhost:5000`
3. Enable "Automatically follow redirects"
4. Enable "Save cookies"

### Step 2: Authentication Flow
```
1. POST /api/auth/signup (Create account)
2. POST /api/auth/login (Get session cookie)
3. GET /api/auth/session (Verify authentication)
```

### Step 3: Complete User Flow
```
1. PUT /api/profile (Update profile)
2. POST /api/profile/picture (Upload picture)
3. GET /api/properties (Browse properties)
4. GET /api/properties/1 (View details)
5. POST /api/favorites (Add to favorites)
6. POST /api/bookings (Create booking)
7. GET /api/bookings (Check booking status)
8. POST /api/agent/chat (Get AI assistance)
```

### Step 4: Owner Flow
```
1. Login as owner role
2. POST /api/properties (Create property)
3. GET /api/bookings/owner (View booking requests)
4. PUT /api/bookings/23/status (Accept/Cancel booking)
```

---

## Common cURL Examples

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }' \
  -c cookies.txt
```

### Get Properties
```bash
curl -X GET "http://localhost:5000/api/properties?city=Los Angeles&min_price=100" \
  -b cookies.txt
```

### Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "property_id": 1,
    "check_in": "2025-12-01",
    "check_out": "2025-12-05",
    "number_of_guests": 4,
    "party_type": "family"
  }'
```

---

## Error Handling

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input: check_in date cannot be in the past"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Property not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Database connection error"
}
```

---

**Last Updated:** October 27, 2025  
**Version:** 1.0.0  
**Base URL:** http://localhost:5000

**Note:** All authenticated endpoints require a valid session cookie. Use Postman's cookie management or `-c/-b` flags with cURL.
