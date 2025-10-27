# Conversational AI Chatbot Implementation

## Overview
Successfully transformed the AI Travel Planner from a booking-specific trip planner into a conversational AI assistant that can handle various queries including showing bookings, planning trips, and general travel questions.

## Features Implemented

### 1. **Conversational Chat Interface**
- **Message History**: Full chat conversation history with user and assistant messages
- **Modern UI**: Bubble-style chat interface with avatars and timestamps
- **Auto-scroll**: Automatically scrolls to the latest message
- **Loading States**: Visual feedback while the AI is thinking

### 2. **Intent Recognition**
The chatbot can understand and respond to:

#### a) **Booking Queries**
Keywords: booking, bookings, reservation, my trips, my trip, upcoming trip, my travel

Example queries:
- "Show me my bookings"
- "Tell me about my bookings"
- "What trips do I have?"
- "My upcoming reservations"

Response: Displays all active bookings with property name, location, dates, and status

#### b) **Trip Planning**
Keywords: plan, itinerary, schedule, activities, what to do, where to go, recommend

Example queries:
- "Plan my trip to Austin"
- "What should I do in my destination?"
- "Help me plan activities"

Response: 
- If booking_id is provided: Generates full travel itinerary
- If no booking specified: Asks user to specify which booking or shows booking list

#### c) **General Conversation**
Any other queries use the LLM for friendly, helpful responses

Example queries:
- "Hello"
- "Help me"
- "What can you do?"

## Technical Implementation

### Frontend Changes

#### 1. **AIAgentSidebar.tsx**
- Added `ChatMessage` interface for message history
- Replaced form-based UI with chat interface
- Added `handleSendMessage()` for processing user messages
- Added `handleKeyPress()` for Enter key support
- Removed trip planning form (now handled conversationally)

#### 2. **agentService.ts**
- Added `chat()` method to send conversational messages
- Endpoint: `POST /api/agent/chat`
- Parameters:
  ```typescript
  {
    message: string;
    booking_id?: number;
  }
  ```

### Backend Changes

#### 1. **agentController.js**
- Added `chat()` function to handle conversational requests
- Validates user session
- Forwards requests to Python agent service
- Handles errors and timeouts

#### 2. **agentRoutes.js**
- Added `POST /api/agent/chat` route
- Requires authentication

### Agent Service Changes

#### 1. **agent_routes.py**
- Added `POST /agent/chat` endpoint
- Verifies secret token
- Calls `agent_service.process_chat()`

#### 2. **agent_service.py**
- Added `process_chat()` method with intent detection
- Four intent categories:
  1. **Show bookings** - Fetches user bookings from database
  2. **Plan trip** - Generates full itinerary
  3. **Need booking context** - Guides user to specify booking
  4. **General conversation** - Uses LLM for responses

#### 3. **mysql_client.py**
- Added `get_user_bookings()` method
- Fetches all bookings for a user with property details
- Returns booking ID, dates, status, property info

#### 4. **llm_client.py**
- Added `chat()` method for general conversation
- Handles simple prompts without full itinerary context

## Data Flow

```
User Message
    ↓
Frontend (AIAgentSidebar)
    ↓
Backend (/api/agent/chat)
    ↓
Agent Service (/agent/chat)
    ↓
process_chat() - Intent Detection
    ↓
┌──────────────┬────────────────┬──────────────┬───────────────┐
│ Show Bookings│  Plan Trip     │ Need Context │  General      │
│              │                │              │               │
│ MySQL Query  │ generate_plan()│ MySQL Query  │ LLM Chat      │
└──────────────┴────────────────┴──────────────┴───────────────┘
    ↓
Response with message + data
    ↓
Frontend displays in chat
```

## Example Conversations

### Example 1: Show Bookings
```
User: "Show me my bookings"

AI: "You have 2 active bookings! 🎉

✅ Luxury Downtown Loft in Austin, Texas
✅ Cozy Beach House in Miami, Florida

Would you like me to help you plan any of these trips?"

[Shows booking cards with property details, dates, and status]
```

### Example 2: Plan a Trip
```
User: "Plan my trip"

AI: "You have 2 accepted bookings. Which trip would you like me to help you plan?"

[Shows list of bookings]

User: "The Austin one"

AI: "🎉 I've created a personalized travel plan for your trip to Austin, Texas! 
Check out the itinerary below."

[Displays full itinerary with daily activities, restaurants, packing list, etc.]
```

### Example 3: General Question
```
User: "What's the weather like?"

AI: "To check the weather, I'll need to know which trip you're asking about! 
You can ask me 'show my bookings' to see your upcoming trips, 
or tell me which city you're visiting."
```

## Response Format

The chatbot returns structured responses:

```typescript
{
  message: string;  // Human-readable response
  data?: {          // Optional structured data
    bookings?: Booking[];  // For booking queries
    plan?: TravelPlan;     // For trip planning
  }
}
```

### Booking Data Structure
```typescript
{
  id: number;
  property_name: string;
  city: string;
  state: string;
  check_in: string;      // YYYY-MM-DD
  check_out: string;     // YYYY-MM-DD
  status: string;        // PENDING, ACCEPTED, CANCELLED, REJECTED
  number_of_guests: number;
  total_price: number;
  images: string[];
}
```

## UI Components

### Chat Message
- **User messages**: Right-aligned, pink background
- **AI messages**: Left-aligned, gray/white background
- **Timestamps**: Small, gray text below each message
- **Avatars**: Bot icon for AI, User icon for traveler

### Booking Cards (within messages)
When the AI shows bookings, they appear as interactive cards with:
- Property name (bold)
- Location with map pin icon
- Dates with calendar icon
- Status badge (color-coded)

### Input Area
- Multi-line textarea
- Send button (disabled when empty)
- Enter to send, Shift+Enter for new line

## Testing the Feature

### Prerequisites
1. Backend server running on port 5000
2. Agent service running on port 8000
3. MySQL database with bookings
4. User logged in as traveler

### Test Cases

1. **Open chatbot without booking context**
   - Click floating chat button on Home page
   - Should show welcome message

2. **Ask for bookings**
   - Type: "Tell me my bookings"
   - Should display all user bookings

3. **Plan a trip**
   - Type: "Plan my trip to [city]"
   - Should generate itinerary (if booking exists)

4. **General conversation**
   - Type: "Hello"
   - Should get friendly LLM response

5. **Follow-up questions**
   - Ask for bookings, then ask to plan trip
   - Context should be maintained

## Configuration

### Environment Variables
```bash
# Backend (.env)
AGENT_SERVICE_URL=http://localhost:8000
AGENT_SERVICE_SECRET=your-secret-key

# Agent Service (.env)
AGENT_SERVICE_SECRET=your-secret-key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=airbnb_db
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434
```

## Error Handling

The chatbot handles various error scenarios:

1. **Service unavailable**: "AI service is not available. Please start the agent service."
2. **Timeout**: "Request timed out. Please try again."
3. **No bookings**: "You don't have any bookings yet. Browse our properties..."
4. **LLM error**: "I'm having trouble responding right now. Please try rephrasing..."

## Future Enhancements

Potential improvements:
1. **Session persistence**: Save chat history to database
2. **Rich media**: Display property images in chat
3. **Quick actions**: Buttons for common queries
4. **Multi-language**: Support for multiple languages
5. **Voice input**: Speech-to-text for queries
6. **Booking modifications**: Handle booking changes via chat
7. **Payment inquiries**: Answer questions about pricing
8. **Review integration**: Show and collect reviews

## Known Limitations

1. **No conversation history**: Chat resets when sidebar closes
2. **Limited context**: Doesn't remember previous conversations
3. **Booking ID needed for planning**: Trip planning requires specific booking
4. **LLM dependency**: General conversation requires Ollama running
5. **No real-time updates**: Doesn't auto-refresh booking status

## API Endpoints

### Frontend → Backend
```
POST /api/agent/chat
Body: {
  message: string;
  booking_id?: number;
}
Headers: {
  Cookie: session_id
}
```

### Backend → Agent Service
```
POST http://localhost:8000/agent/chat
Body: {
  user_id: number;
  message: string;
  booking_id?: number;
  secret: string;
}
```

## Files Modified

### Frontend
- `apps/frontend/src/components/AIAgentSidebar.tsx` - Complete redesign
- `apps/frontend/src/services/agentService.ts` - Added chat method

### Backend
- `apps/backend/controllers/agentController.js` - Added chat endpoint
- `apps/backend/routes/agentRoutes.js` - Added chat route

### Agent Service
- `apps/agent-service/routes/agent_routes.py` - Added /chat endpoint
- `apps/agent-service/services/agent_service.py` - Added process_chat
- `apps/agent-service/utils/mysql_client.py` - Added get_user_bookings
- `apps/agent-service/utils/llm_client.py` - Added chat method

## Summary

The conversational chatbot successfully transforms the AI Travel Planner into an intelligent assistant that can:
- ✅ Show user bookings on request
- ✅ Plan trips for specific bookings
- ✅ Answer general travel questions
- ✅ Provide a natural, chat-based interface
- ✅ Maintain context within a session
- ✅ Handle errors gracefully

The implementation uses intent detection to route queries to the appropriate handler (bookings, planning, or general conversation), providing a seamless and intuitive user experience.
