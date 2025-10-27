# API Route Fix Summary

## 🐛 Issue Found
The frontend was calling `/agent/plan` instead of `/api/agent/plan`, causing a **404 Not Found** error.

## ✅ Fixes Applied

### 1. **Frontend Service Route Fix** (`apps/frontend/src/services/agentService.ts`)
- ❌ **Before**: `'/agent/plan'`
- ✅ **After**: `'/api/agent/plan'`
- Also fixed: `/agent/query` → `/api/agent/query`
- Added comprehensive logging for debugging

### 2. **Backend Debugging** (`apps/backend/controllers/agentController.js`)
Added two-step verification:
- **Step 1**: Check if booking exists at all
- **Step 2**: Verify booking belongs to the logged-in user
- Detailed logging to identify traveler_id mismatch issues

### 3. **SQL Verification Script** (`apps/backend/mysql queries/verify_booking_23.sql`)
Created a SQL script to directly verify:
- Booking 23 details
- Which user owns the booking
- All bookings for that traveler

## 🔍 How to Debug

### 1. Frontend Logs (Browser Console)
Look for:
```
📡 [Frontend] Calling API: /api/agent/plan
📦 [Frontend] Request payload: {...}
✅ [Frontend] API response: {...}
```

### 2. Backend Logs (Terminal)
Look for:
```
🔵 [Backend] POST /api/agent/plan - Request received
🔍 [Backend] Step 1: Check if booking exists...
✅ [Backend] Booking exists: {...}
🔍 [Backend] Step 2: Verify booking belongs to user...
📊 [Backend] Checking: booking.traveler_id = X vs session.userId = Y
```

### 3. Verify Database Directly
```bash
# Connect to MySQL
mysql -u root -p airbnb_db

# Run the verification script
source apps/backend/mysql\ queries/verify_booking_23.sql
```

Or manually check:
```sql
SELECT b.*, p.property_name 
FROM bookings b 
JOIN properties p ON b.property_id = p.id 
WHERE b.id = 23;
```

## 🚨 Common Issues

### Issue 1: Booking ID Mismatch
**Symptom**: "Booking does not exist with ID: 23"
**Solution**: The booking doesn't exist. Check if you're logged in as the right user or if the booking was deleted.

### Issue 2: Traveler ID Mismatch
**Symptom**: "Booking exists but does NOT belong to this user"
**Solution**: You're logged in as a different user than the one who created the booking. The backend logs will show:
```
🔍 [Backend] Booking traveler_id: 5
🔍 [Backend] Session user_id: 3
```

### Issue 3: Session Expired
**Symptom**: "Unauthorized - Please login"
**Solution**: Your session has expired. Log out and log back in.

## 📋 Testing Steps

1. **Restart all services**:
   ```bash
   # Kill all servers first
   lsof -ti:5173 -ti:5001 -ti:8000 | xargs kill -9
   
   # Start backend
   cd apps/backend
   npm start
   
   # Start frontend (new terminal)
   cd apps/frontend
   npm run dev
   
   # Start agent service (new terminal)
   cd apps/agent-service
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Test the flow**:
   - Open browser to `http://localhost:5173`
   - Log in as a traveler who has bookings
   - Click the AI Travel Planner button (bottom right)
   - Enter a query and click "Generate Travel Plan"

3. **Check logs**:
   - Open browser console (F12 → Console)
   - Check backend terminal for detailed logs
   - Look for the step-by-step verification messages

## 🎯 Expected Behavior

**Successful Flow:**
```
Frontend: 📡 Calling API: /api/agent/plan
Frontend: 📦 Request with booking_id: 23
Backend: 🔵 POST /api/agent/plan - Request received
Backend: ✅ Booking exists
Backend: ✅ Booking belongs to user!
Backend: 🚀 Forwarding to agent service
Agent: Processing booking 23...
Backend: ✅ Agent service responded successfully
Frontend: ✅ API response received
UI: Display itinerary, activities, restaurants, packing list
```

## 📞 Next Steps

If you're still getting errors after these fixes:
1. Check the backend terminal logs - they will tell you exactly what's wrong
2. Run the SQL verification script to check booking ownership
3. Verify you're logged in as the correct user (traveler role)
4. Check that the booking status is 'PENDING' or 'ACCEPTED'

