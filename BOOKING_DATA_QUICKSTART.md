# 📋 Booking Data Quick Start

Quick guide to insert dummy booking data and view booking history.

## 🚀 Quick Commands

### Insert Dummy Booking Data
```bash
./insert_booking_data.sh
```

### View Booking History
```bash
./view_booking_history.sh
```

---

## 📊 What Gets Inserted

### Users (7 new accounts)
- **4 Travelers:** Alice, Michael, Sarah, David, Emma
- **3 Owners:** Robert, Linda (+ existing Jane & Bob)

### Bookings (30+ records)
- ✅ **Past Bookings** - Completed stays (July-Sept 2025)
- ⏳ **Pending Bookings** - Awaiting owner approval
- 📅 **Upcoming Bookings** - Confirmed future stays
- ❌ **Cancelled Bookings** - Examples of cancellations
- 💼 **Various Types** - Solo, couple, family, group, business

---

## 🧪 Test Accounts

### Traveler Accounts
| Email | Password | Has Bookings |
|-------|----------|--------------|
| traveler@test.com | password123 | ✅ Yes |
| alice@test.com | password123 | ✅ Yes |
| michael@test.com | password123 | ✅ Yes |
| sarah@test.com | password123 | ✅ Yes |
| david@test.com | password123 | ✅ Yes |
| emma@test.com | password123 | ✅ Yes |

### Owner Accounts
| Email | Password | Has Properties | Bookings Received |
|-------|----------|----------------|-------------------|
| owner@test.com | password123 | ✅ Yes | ✅ Many |
| bob@test.com | password123 | ✅ Yes | ✅ Many |
| robert@test.com | password123 | ❌ No | ❌ None |
| linda@test.com | password123 | ❌ No | ❌ None |

---

## 📈 Expected Results

After running the insert script:
- **30+** total bookings across all users
- **Multiple** bookings in each status (PENDING, ACCEPTED, CANCELLED)
- **Various** party types for AI agent testing
- **Realistic** date ranges (past, present, future)
- **Revenue data** for owner dashboards

---

## 🔍 Manual MySQL Queries

If you prefer direct MySQL access:

```bash
# Insert data
mysql -u root -p airbnb_db < apps/backend/mysql\ queries/insert_dummy_bookings.sql

# View history
mysql -u root -p airbnb_db < apps/backend/mysql\ queries/check_booking_history.sql
```

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `insert_booking_data.sh` | Interactive script to insert dummy data |
| `view_booking_history.sh` | Interactive script to view booking history |
| `apps/backend/mysql queries/insert_dummy_bookings.sql` | SQL script with all dummy data |
| `apps/backend/mysql queries/check_booking_history.sql` | SQL queries to view booking statistics |
| `apps/backend/scripts/viewBookingHistory.js` | Node.js script to view bookings (requires .env) |
| `BOOKING_HISTORY_GUIDE.md` | Complete documentation |

---

## ⚡ One-Liner Commands

```bash
# Complete setup (insert + view)
./insert_booking_data.sh && ./view_booking_history.sh

# Just view current bookings
./view_booking_history.sh

# Reset and start fresh (⚠️ WARNING: Deletes all bookings)
mysql -u root -p airbnb_db -e "DELETE FROM bookings; ALTER TABLE bookings AUTO_INCREMENT = 1;"
```

---

## 🎯 Next Steps

1. ✅ Run `./insert_booking_data.sh`
2. ✅ Run `./view_booking_history.sh` to verify
3. 🧪 Test the web application:
   - Login as `traveler@test.com`
   - Check "My Bookings" page
   - Login as `owner@test.com`
   - Check "Owner Bookings" page
4. 🤖 Test AI Agent with booking queries

---

## 💡 Tips

- All test users have the same password: `password123`
- Bookings span multiple time periods for realistic testing
- Various party types help test AI agent recommendations
- Owner accounts can see pending requests immediately
- Traveler accounts can see their complete booking history

---

## 🐛 Troubleshooting

**Script won't run:**
```bash
chmod +x insert_booking_data.sh view_booking_history.sh
```

**MySQL connection error:**
- Verify MySQL is running: `brew services list` (macOS) or `systemctl status mysql` (Linux)
- Check your username and password
- Ensure database `airbnb_db` exists

**No data visible in app:**
- Clear browser cache and reload
- Check browser console for errors
- Verify you're logged in with correct test account

---

**Ready to test your booking system! 🚀**

