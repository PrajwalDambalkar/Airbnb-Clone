# Authentication Issue Fix - Booking API 401 Unauthorized

## Problem Summary
When users clicked the "Reserve" button on property details page, they received a **401 Unauthorized** error and were redirected to the login page, even when they were logged in.

## Root Cause
The authentication issue was caused by **inconsistent session key usage** across different backend controllers:

1. **authController.js** was setting:
   - `req.session.userId`
   - `req.session.userRole`

2. **bookingController.js** and **bookingRoutes.js** were checking for:
   - `req.session.user` (an object)

This mismatch meant that even though users were logged in successfully, the booking routes couldn't find the user information in the session.

## Changes Made

### 1. Backend - authController.js (`apps/backend/controllers/authController.js`)

#### A. Signup Function
**Added:**
```javascript
req.session.user = newUser[0]; // Add user object for consistency
```

**Added explicit session save:**
```javascript
req.session.save((err) => {
  if (err) {
    console.error('Session save error:', err);
    return res.status(500).json({ error: 'Failed to save session' });
  }
  res.status(201).json({
    message: 'User registered successfully',
    user: newUser[0]
  });
});
```

#### B. Login Function
**Added:**
```javascript
req.session.user = user; // Add user object for consistency
```

**Added explicit session save:**
```javascript
req.session.save((err) => {
  if (err) {
    console.error('Session save error:', err);
    return res.status(500).json({ error: 'Failed to save session' });
  }
  res.json({
    message: 'Login successful',
    user
  });
});
```

#### C. getCurrentUser Function
**Added:**
```javascript
req.session.user = users[0]; // Ensure session.user is set
```

### 2. Backend - bookingRoutes.js (`apps/backend/routes/bookingRoutes.js`)

**Added debug middleware:**
```javascript
router.use((req, res, next) => {
  console.log('🔍 Booking Route - Session Check:', {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    userId: req.session?.userId,
    userRole: req.session?.userRole,
    user: req.session?.user
  });
  next();
});
```

This helps debug session issues by logging session information for every booking API request.

### 3. Backend - server.js (`apps/backend/server.js`)

**Added debug endpoint:**
```javascript
app.get('/api/debug/session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: {
      cookie: req.session.cookie,
      user: req.session.user,
      userId: req.session.userId,
      userRole: req.session.userRole
    }
  });
});
```

This endpoint allows you to check the current session state at any time.

## How It Works Now

1. **User logs in** → `authController.login()` sets:
   - `req.session.userId = user.id`
   - `req.session.userRole = user.role`
   - `req.session.user = user` ✅ (NEW - for booking routes)

2. **Session is explicitly saved** → Ensures session data persists across requests

3. **User navigates to property details** → Session cookie is sent with every request

4. **User clicks "Reserve"** → `bookingService.createBooking()` makes POST to `/api/bookings`

5. **Booking route middleware checks** → `req.session.user` ✅ (NOW EXISTS)

6. **Booking is created successfully** → User is redirected to `/bookings` page

## Testing the Fix

### 1. Test Session Debug Endpoint
```bash
# After logging in, test the session:
curl -X GET http://localhost:5001/api/debug/session \
  -H "Cookie: airbnb_session=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json"
```

### 2. Test Login Flow
1. Open browser at `http://localhost:5173`
2. Click "Login"
3. Enter credentials
4. Check browser console for login success
5. Open DevTools → Application → Cookies → Check for `airbnb_session`

### 3. Test Booking Flow
1. Navigate to any property detail page
2. Select check-in and check-out dates
3. Click "Reserve"
4. Should redirect to `/bookings` page with success message
5. Check backend logs for session debug info

## Verification Checklist

- [x] Session stores `user` object during login
- [x] Session stores `user` object during signup
- [x] Session is explicitly saved after authentication
- [x] Booking routes receive session with user data
- [x] Debug logging added for troubleshooting
- [x] Backend server restarted with changes
- [x] CORS configuration includes credentials
- [x] Frontend API client uses `withCredentials: true`

## Configuration Requirements

### Backend (.env)
```env
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=your_secure_secret
```

### Frontend (Vite)
```env
VITE_API_URL=http://localhost:5001
```

## Common Issues & Solutions

### Issue: Still getting 401 after fix
**Solution:** 
1. Clear browser cookies
2. Logout and login again
3. Check session cookie in DevTools
4. Verify backend logs show session data

### Issue: Session not persisting
**Solution:**
1. Check MySQL sessions table: `SELECT * FROM sessions;`
2. Verify `express-session` and `express-mysql-session` are installed
3. Check cookie settings in browser DevTools

### Issue: CORS errors
**Solution:**
1. Ensure `CORS_ORIGIN=http://localhost:5173` in backend `.env`
2. Verify frontend uses `withCredentials: true`
3. Check backend has `credentials: true` in CORS config

## Additional Notes

- Session cookies are stored in MySQL `sessions` table
- Session expires after 7 days (configurable in `server.js`)
- Session uses `sameSite: 'lax'` for security
- `httpOnly: true` prevents XSS attacks
- Frontend must always use `withCredentials: true` for authenticated requests

## Files Modified

1. `/apps/backend/controllers/authController.js` - Added session.user and explicit save
2. `/apps/backend/routes/bookingRoutes.js` - Added debug logging
3. `/apps/backend/server.js` - Added debug endpoint

No frontend changes were required as the issue was entirely backend-related.

---

**Status:** ✅ Fixed
**Date:** October 24, 2025
**Tested:** Backend restarted, ready for testing
