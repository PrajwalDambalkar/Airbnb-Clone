# Booking Visibility Fix - "Booked Properties Not Showing"

## Problem
Users with "owner" role could not see bookings they made as travelers. The Bookings page showed "No bookings found" even after successfully booking properties.

## Root Cause

The `getBookings` function in `bookingController.js` filtered bookings based on user role:

**Before (❌ Incorrect Logic):**
```javascript
// If user role is 'owner', only show bookings where they are the property owner
if (userRole === 'owner') {
  query += 'b.owner_id = ?';
  params.push(userId);
}
// If user role is 'traveler', only show bookings where they are the traveler
else if (userRole === 'traveler') {
  query += 'b.traveler_id = ?';
  params.push(userId);
}
```

**The Issue:**
- When Pukhraj (user_id: 28, role: "owner") books a property
- The booking is created with `traveler_id = 28` and `owner_id = 2` (property owner)
- But when viewing bookings, the system only shows bookings where `owner_id = 28`
- Result: Bookings don't appear because Pukhraj is the TRAVELER, not the OWNER

## Solution Applied

Updated `getBookings` to **always** show bookings where user is EITHER traveler OR owner:

**After (✅ Correct Logic):**
```javascript
// Always show bookings where user is EITHER traveler OR owner
// This allows owners to also make bookings as travelers
query += '(b.traveler_id = ? OR b.owner_id = ?)';
params.push(userId, userId);
```

**File Modified:**
- `apps/backend/controllers/bookingController.js`

## What This Fixes

### Before:
- ❌ Owner accounts could book properties, but bookings wouldn't show in their Bookings page
- ❌ Users had to have separate traveler accounts to see their bookings
- ❌ Confusing user experience - "Where did my booking go?"

### After:
- ✅ Owners can book properties AND see their bookings
- ✅ Travelers can own properties AND see bookings for their properties
- ✅ Users see ALL bookings where they are involved (as traveler OR property owner)

## Database Examples

**User ID 28 (Pukhraj, role: owner) bookings:**

| Booking ID | Traveler ID | Owner ID | Property | Status |
|------------|-------------|----------|----------|---------|
| 32 | **28** (Pukhraj) | 2 | Pacific Beach Condo | PENDING |
| 31 | **28** (Pukhraj) | 2 | Pacific Beach Condo | PENDING |
| 30 | **28** (Pukhraj) | 2 | Point Loma Ocean View | PENDING |

**Before Fix:** Pukhraj sees **0 bookings** (looking for owner_id = 28)  
**After Fix:** Pukhraj sees **3 bookings** (found by traveler_id = 28)

## How to Test

1. **Refresh the browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Click "Bookings"** in the navigation
3. **You should now see your bookings!**

## Additional Benefits

This fix also enables:
- **Dual-role accounts**: Users can be both property owners AND travelers
- **Complete booking history**: See all bookings you're involved in
- **Better user experience**: No need for multiple accounts

## Technical Details

### Query Comparison

**Old Query (role-based filtering):**
```sql
SELECT b.* FROM bookings b
WHERE b.owner_id = 28  -- Only shows if user owns the property
```

**New Query (comprehensive filtering):**
```sql
SELECT b.* FROM bookings b
WHERE (b.traveler_id = 28 OR b.owner_id = 28)  -- Shows all involvement
```

### Added Logging

Added detailed console logs for debugging:
```javascript
console.log('📋 [getBookings] User:', { userId, userRole, statusFilter });
console.log('📋 [getBookings] Query:', query);
console.log('📋 [getBookings] Params:', params);
console.log('📋 [getBookings] Found bookings:', bookings.length);
```

## Rollout Status

- ✅ Backend updated
- ✅ Backend restarted
- ✅ Frontend already supports this (no changes needed)
- ✅ Ready to test

---

**Fixed**: October 26, 2025  
**Issue**: Booked properties not showing for owner accounts  
**Resolution**: Show bookings where user is EITHER traveler OR owner  
**Impact**: All users can now see their complete booking history

