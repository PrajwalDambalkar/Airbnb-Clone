# 📋 Booking History & Dummy Data Guide

This guide explains how to insert dummy booking data and view booking history for your Airbnb Clone application.

## 📁 Files Created

1. **`apps/backend/mysql queries/insert_dummy_bookings.sql`** - Insert comprehensive dummy booking data
2. **`apps/backend/mysql queries/check_booking_history.sql`** - View booking history with SQL queries
3. **`apps/backend/scripts/viewBookingHistory.js`** - View booking history with a Node.js script

---

## 🚀 Quick Start

### Option 1: Using MySQL Command Line (Recommended)

#### Step 1: Insert Dummy Booking Data

```bash
# Navigate to the mysql queries directory
cd apps/backend/mysql\ queries/

# Run the insert script
mysql -u root -p airbnb_db < insert_dummy_bookings.sql
```

**What this does:**
- Inserts 7 additional test users (4 travelers, 3 owners)
- Adds 30+ diverse bookings including:
  - ✅ Past completed bookings (ACCEPTED)
  - ⏳ Pending bookings awaiting approval
  - 📅 Upcoming confirmed bookings
  - ❌ Cancelled bookings
  - 💼 Business, family, couple, solo, and group bookings
- Shows comprehensive statistics and summaries

#### Step 2: View Booking History

```bash
# View detailed booking history
mysql -u root -p airbnb_db < check_booking_history.sql
```

**This displays:**
- All bookings overview
- Bookings by status (PENDING, ACCEPTED, CANCELLED)
- Traveler statistics and spending
- Owner statistics and revenue
- Property performance metrics
- Upcoming bookings (next 30 days)
- Pending bookings requiring action
- Overall system statistics

---

### Option 2: Using Node.js Script

```bash
# Navigate to the backend directory
cd apps/backend

# Run the booking history viewer
node scripts/viewBookingHistory.js
```

**Features:**
- 🎨 Beautiful console table format
- 📊 Real-time statistics
- 👥 Traveler and owner breakdowns
- 📅 Upcoming and pending bookings
- 💰 Revenue and pricing analytics

---

## 📊 Sample Data Included

### Users Added
- **Travelers:** Alice Johnson, Michael Chen, Sarah Martinez, David Wilson, Emma Davis
- **Owners:** Robert Taylor, Linda Anderson
- All users have password: `password123` (hashed with bcrypt)

### Booking Scenarios

#### Past Bookings (Completed)
- Various dates from July - September 2025
- Different party types: family, couple, solo, group
- Mix of properties and locations
- Total spent varies by user

#### Current Bookings
- Active bookings for October 26-30, 2025
- In-progress stays

#### Upcoming Bookings
- Future confirmed bookings (November 2025 - January 2026)
- Mix of all property types
- Various durations and guest counts

#### Pending Bookings
- 5+ bookings awaiting owner approval
- Include business, couple, family, and group types
- Various check-in dates

#### Cancelled Bookings
- Examples of traveler-cancelled bookings
- Examples of owner-rejected bookings

---

## 🔍 Viewing Specific Data

### Check All Bookings for a Specific User

```sql
-- Traveler's bookings
SELECT * FROM bookings WHERE traveler_id = 1;

-- Owner's bookings
SELECT * FROM bookings WHERE owner_id = 2;
```

### Check Bookings by Status

```sql
-- All pending bookings
SELECT * FROM bookings WHERE status = 'PENDING';

-- All accepted bookings
SELECT * FROM bookings WHERE status = 'ACCEPTED';

-- All cancelled bookings
SELECT * FROM bookings WHERE status = 'CANCELLED';
```

### Check Bookings for a Property

```sql
SELECT 
    b.*,
    t.name as traveler_name,
    p.property_name
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
WHERE property_id = 1;
```

---

## 🧪 Testing in the Application

### Test Traveler Accounts

| Name | Email | Password | Bookings |
|------|-------|----------|----------|
| John Traveler | traveler@test.com | password123 | Multiple |
| Alice Johnson | alice@test.com | password123 | Multiple |
| Michael Chen | michael@test.com | password123 | Multiple |
| Sarah Martinez | sarah@test.com | password123 | Multiple |
| David Wilson | david@test.com | password123 | Multiple |
| Emma Davis | emma@test.com | password123 | Multiple |

### Test Owner Accounts

| Name | Email | Password | Properties | Bookings Received |
|------|-------|----------|------------|-------------------|
| Jane Owner | owner@test.com | password123 | Multiple | Many |
| Bob Smith | bob@test.com | password123 | Multiple | Many |
| Robert Taylor | robert@test.com | password123 | 0 (new) | 0 |
| Linda Anderson | linda@test.com | password123 | 0 (new) | 0 |

---

## 📈 Statistics Overview

After inserting dummy data, you'll have:

- **30+** total bookings
- **6+** unique travelers with booking history
- **2-3** owners with active bookings
- **Multiple** properties with booking history
- **Various** booking statuses for testing workflows
- **Diverse** party types (solo, couple, family, group, business)
- **Mixed** time periods (past, current, upcoming)

---

## 🔧 Common Operations

### Reset All Bookings (WARNING: Deletes all booking data)

```sql
USE airbnb_db;
DELETE FROM bookings;
ALTER TABLE bookings AUTO_INCREMENT = 1;
```

### Delete Only Dummy Data (Keep Original 2 Bookings)

```sql
USE airbnb_db;
DELETE FROM bookings WHERE id > 2;
```

### Add More Properties for New Owners

```sql
-- Add properties for Robert Taylor (owner_id = 7)
INSERT INTO properties (owner_id, property_name, property_type, description, address, city, state, country, zipcode, bedrooms, bathrooms, max_guests, price_per_night, cleaning_fee, amenities, images, available) VALUES
(7, 'Miami Beach Condo', 'condo', 'Beautiful oceanfront condo', '123 Beach Dr', 'Miami', 'FL', 'United States', '33139', 2, 2.0, 4, 250.00, 50.00, '["wifi", "parking", "pool", "beach_access"]', '["/uploads/property_miami.jpg"]', TRUE);
```

---

## 📱 Testing Workflows

### Traveler Workflow
1. Login as `traveler@test.com`
2. Navigate to **Bookings** page
3. View booking history (past, upcoming, pending)
4. Check booking statuses
5. Test cancellation

### Owner Workflow
1. Login as `owner@test.com`
2. Navigate to **Owner Bookings** page
3. View pending booking requests
4. Accept or reject bookings
5. View revenue statistics

---

## 🐛 Troubleshooting

### MySQL Connection Error
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Or on macOS
brew services list
```

### Node.js Script Error
```bash
# Make sure you're in the backend directory
cd apps/backend

# Check if .env file exists with correct DB credentials
cat .env | grep DB_

# Install dependencies if needed
npm install
```

### No Data Showing
```bash
# Verify bookings were inserted
mysql -u root -p -e "SELECT COUNT(*) FROM bookings;" airbnb_db

# Check users exist
mysql -u root -p -e "SELECT id, name, role FROM users;" airbnb_db
```

---

## 📝 Notes

- All dummy bookings use realistic dates relative to October 27, 2025
- Passwords for all test users are hashed with bcrypt: `password123`
- Total price includes nights + cleaning fees + service fees
- Party types help with AI agent recommendations
- Booking statuses follow the application workflow: PENDING → ACCEPTED/CANCELLED

---

## ✅ Success Indicators

After inserting dummy data, you should see:

- ✅ Multiple bookings in different statuses
- ✅ Travelers with varied booking history
- ✅ Owners with pending requests
- ✅ Revenue statistics calculated
- ✅ Upcoming bookings calendar populated
- ✅ Past booking history for reference

---

## 🎯 Next Steps

1. ✅ Insert dummy booking data
2. ✅ View booking history
3. 🧪 Test the application with various user accounts
4. 📊 Verify booking workflows (create, accept, reject, cancel)
5. 🎨 Check UI displays booking data correctly
6. 🤖 Test AI agent with booking-related queries

---

**Happy Testing! 🚀**

