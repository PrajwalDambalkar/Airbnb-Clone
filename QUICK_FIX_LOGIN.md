# Quick Fix for Login Issue

## The Problem

You're seeing a **401 Unauthorized** error when trying to login because:

1. **You're already logged in as Pukhraj** (hhhhhh@gmail.com)
2. You're trying to login as a different user (owner@test.com) without logging out first
3. The session is conflicting

## Solution: Logout First

### Option 1: Use the Logout Button
1. Look for your profile picture or name "Pukhraj" in the top-right corner
2. Click on it to open the profile menu
3. Click "Logout"
4. Then try logging in with `owner@test.com` / `password123`

### Option 2: Clear Browser Cookies
1. Open Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Application** tab (or **Storage** tab in Firefox)
3. In the left sidebar, expand **Cookies**
4. Click on `http://localhost:5173`
5. Right-click and select "Clear" or delete the `connect.sid` cookie
6. Refresh the page
7. You should now be logged out and can login with different credentials

### Option 3: Use Incognito/Private Window
1. Open a new Incognito/Private browsing window
2. Go to http://localhost:5173
3. Login with `owner@test.com` / `password123`

## Test Credentials

**Traveler Account:**
- Email: `traveler@test.com`
- Password: `password123`

**Owner Account:**
- Email: `owner@test.com`
- Password: `password123`

**Your Account:**
- Email: `hhhhhh@gmail.com`
- Password: (your password)

## Why This Happens

The application uses **session-based authentication** with cookies. When you're logged in:
- A session cookie is stored in your browser
- The backend recognizes you as logged in
- You need to logout (destroy the session) before logging in as a different user

## Verification

After logging out, you should:
1. Be redirected to the login page
2. See "Welcome back" instead of your name
3. Be able to login with any test credentials
4. See properties on the home page

## Current Status

✅ **Backend:** Running on port 5001
✅ **Frontend:** Running on port 5173  
✅ **Database:** 4 users, 10 properties
✅ **Your Session:** Active as Pukhraj

The system is working correctly - you just need to logout first!

