# 🔧 Booking History Troubleshooting Guide

## ❗ Issue: "Dummy data is not seen in history"

### Common Causes & Solutions

---

## ✅ Step 1: Verify Data Was Inserted

First, check if the dummy data actually exists in your database:

```bash
./verify_bookings.sh
```

**What this shows:**
- Total number of bookings in database
- Bookings by status (PENDING, ACCEPTED, CANCELLED)
- List of users in the system
- Recent bookings

**Expected Results:**
- Should show **30+** bookings
- Should show **7+** users
- Should display recent booking records

---

## ⚠️ Most Common Issue: **Wrong Login Account**

### The Problem
**The booking system only shows bookings where YOU are either the traveler or the owner.**

If you log in with an account that's NOT in the dummy data, you won't see ANY bookings!

### The Solution

**You MUST log in with one of these test accounts:**

#### For Travelers (To see "My Bookings"):
| Email | Password | Has Bookings? |
|-------|----------|---------------|
| traveler@test.com | password123 | ✅ Yes (multiple) |
| alice@test.com | password123 | ✅ Yes (multiple) |
| michael@test.com | password123 | ✅ Yes (multiple) |
| david@test.com | password123 | ✅ Yes (multiple) |

#### For Owners (To see "Owner Bookings"):
| Email | Password | Has Bookings? |
|-------|----------|---------------|
| owner@test.com | password123 | ✅ Yes (many bookings) |
| bob@test.com | password123 | ✅ Yes (many bookings) |

---

## 🔍 Detailed Troubleshooting Steps

### 1. Check if Data Exists

```bash
# Run verification script
./verify_bookings.sh
```

**If it shows 0 bookings:**
```bash
# Insert the dummy data
./insert_booking_data.sh
```

### 2. Verify You're Logged In with Correct Account

**Current login check:**
- Look at the top-right corner of your app
- Check which email you're logged in as

**If you're NOT logged in as one of the test accounts above:**
1. **Logout** from your current account
2. **Login** with `traveler@test.com` / `password123`
3. Go to **"My Bookings"** page
4. You should now see multiple bookings!

### 3. Check Browser Console for Errors

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Look for any red error messages
4. Common errors:
   - `401 Unauthorized` → You're not logged in
   - `403 Forbidden` → You're logged in but with wrong account
   - `500 Server Error` → Backend issue

### 4. Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Navigate to **My Bookings** page
4. Look for request to `/api/bookings`
5. Click on it and check:
   - **Status:** Should be 200 OK
   - **Response:** Should contain array of bookings
   - **Preview:** Should show booking data

**If response is empty array `[]`:**
- You're logged in with wrong account (not a test user)
- OR the dummy data wasn't inserted

---

## 📋 Quick Diagnosis Checklist

- [ ] I ran `./insert_booking_data.sh` successfully
- [ ] I ran `./verify_bookings.sh` and it shows 30+ bookings
- [ ] I'm logged in as one of the test accounts (see table above)
- [ ] I'm on the correct page (My Bookings for travelers, Owner Bookings for owners)
- [ ] I see no errors in browser console
- [ ] The API request to `/api/bookings` returns 200 OK

---

## 🎯 Step-by-Step Test Process

### For Travelers:

1. **Insert Data** (if not done yet):
   ```bash
   ./insert_booking_data.sh
   ```

2. **Logout** from any current session

3. **Login** with test account:
   - Email: `traveler@test.com`
   - Password: `password123`

4. **Navigate** to "My Bookings" page (click on your profile → Bookings)

5. **You should see:**
   - Multiple booking cards
   - Tabs for: All, Pending, Accepted, Cancelled, History
   - Booking details with dates, property names, prices

### For Owners:

1. **Login** with owner account:
   - Email: `owner@test.com`
   - Password: `password123`

2. **Navigate** to "Owner Bookings" page

3. **You should see:**
   - Stats cards (Pending, Confirmed, Revenue)
   - List of bookings from various travelers
   - Action buttons (Approve/Reject for pending)

---

## 🔧 Manual Database Check

If verification script doesn't work, check manually:

```bash
# Connect to MySQL
mysql -u root -p

# Switch to database
USE airbnb_db;

# Check total bookings
SELECT COUNT(*) FROM bookings;

# Check bookings by user
SELECT 
    u.name, 
    u.email,
    COUNT(b.id) as booking_count
FROM users u
LEFT JOIN bookings b ON u.id = b.traveler_id
WHERE u.role = 'traveler'
GROUP BY u.id;

# Check specific user's bookings (replace 1 with user ID)
SELECT * FROM bookings WHERE traveler_id = 1 OR owner_id = 1;
```

---

## 💡 Understanding the System

### How Booking Visibility Works:

**Traveler View (`/bookings`):**
- Shows bookings where **you are the traveler**
- Query: `WHERE traveler_id = YOUR_USER_ID`

**Owner View (`/owner/bookings`):**
- Shows bookings for **your properties**
- Query: `WHERE owner_id = YOUR_USER_ID`

**This means:**
- ✅ Test users see their bookings
- ❌ New users see nothing (they have no bookings yet)
- ❌ Random accounts see nothing (not in dummy data)

---

## 🚨 Still Not Working?

### Check Backend is Running

```bash
# Check if backend server is running
curl http://localhost:5000/api/health

# Should return: {"status":"ok"}
```

### Check Database Connection

```bash
# Test database connection
mysql -u root -p airbnb_db -e "SHOW TABLES;"
```

### Restart Backend Server

```bash
# Go to backend directory
cd apps/backend

# Restart server
npm run dev
```

### Clear Browser Cache

1. Open DevTools (F12)
2. Right-click on refresh button
3. Select "Empty Cache and Hard Reload"

### Check Session/Authentication

```bash
# In browser console, check:
console.log(document.cookie);

# Should show session cookie
```

---

## 📊 Expected Data After Insert

After running `./insert_booking_data.sh`, you should have:

```
Total Bookings:       30+
├─ PENDING:           5-8
├─ ACCEPTED:          18-22
└─ CANCELLED:         4-6

Users:
├─ Travelers:         6+
└─ Owners:            3+

Revenue (ACCEPTED):   $25,000+
```

---

## 🆘 Quick Fixes

### Fix 1: Reset and Reinstall Data

```bash
# Delete all bookings
mysql -u root -p airbnb_db -e "DELETE FROM bookings; ALTER TABLE bookings AUTO_INCREMENT = 1;"

# Reinstall dummy data
./insert_booking_data.sh

# Verify
./verify_bookings.sh
```

### Fix 2: Create Bookings for Your Account

If you want to see bookings for your OWN account (not test accounts):

```sql
-- Replace YOUR_USER_ID with your actual user ID
INSERT INTO bookings (traveler_id, property_id, owner_id, check_in, check_out, number_of_guests, total_price, status)
SELECT 
    YOUR_USER_ID,  -- Your user ID
    id,            -- Property ID
    owner_id,      -- Property owner ID
    DATE_ADD(CURDATE(), INTERVAL 7 DAY),   -- Check-in (1 week from now)
    DATE_ADD(CURDATE(), INTERVAL 10 DAY),  -- Check-out (10 days from now)
    2,             -- 2 guests
    500.00,        -- $500 total
    'PENDING'      -- Status
FROM properties 
LIMIT 1;
```

---

## 📧 Need More Help?

Check these files:
- `START_HERE_BOOKINGS.md` - Quick start guide
- `BOOKING_DATA_QUICKSTART.md` - Command reference
- `BOOKING_HISTORY_GUIDE.md` - Complete documentation

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Verification script shows 30+ bookings
2. ✅ You're logged in as test user (check top-right corner)
3. ✅ My Bookings page shows multiple booking cards
4. ✅ Tabs show correct counts (All, Pending, Accepted, etc.)
5. ✅ You can see booking details (dates, prices, properties)
6. ✅ Browser console shows no errors
7. ✅ Network tab shows successful API response

---

**Remember: The KEY is to log in with one of the test accounts that have bookings!**

**Test Accounts:**
- `traveler@test.com` / `password123`
- `alice@test.com` / `password123`
- `owner@test.com` / `password123`

