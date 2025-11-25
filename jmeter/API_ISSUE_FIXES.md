# JMeter API Issues - Fixed

## Issues Found and Fixed

### ✅ Issue 1: Incorrect URL Configuration
**Problem:** The JMeter test plan was using `${BASE_URL}` (e.g., `http://localhost:5001`) as the domain field, but JMeter expects domain and port to be separate.

**Fix Applied:**
- Added `DOMAIN` and `PORT` variables to the test plan
- Updated HTTP Request Defaults to use `${DOMAIN}` and `${PORT}` separately
- Removed `${BASE_URL}` from individual HTTP samplers (they now use the defaults)
- Updated `run_tests_and_generate_reports.sh` to pass `-JDOMAIN=localhost` and `-JPORT=${BACKEND_PORT}`

### ✅ Issue 2: THREADS Variable Default
**Problem:** The THREADS variable had no default value, which could cause issues if not passed.

**Fix Applied:**
- Changed `${__P(THREADS)}` to `${__P(THREADS,1)}` to provide a default value of 1

### ❌ Issue 3: Test Users Don't Exist in Database
**Problem:** The CSV files (`traveler_users.csv` and `owner_users.csv`) reference users that don't exist in the MongoDB database:
- `traveler1@test.com` through `traveler10@test.com`
- `owner1@test.com` through `owner5@test.com`

**Current Status:** Login requests return `401 Unauthorized` because these users don't exist.

**Solution Options:**
1. **Create test users in MongoDB** - Run a script to create the test users with password `password123`
2. **Update CSV files** - Change the CSV files to use existing users from the database
3. **Use signup endpoint** - Modify the test plan to create users first (not recommended for performance testing)

## Next Steps

To make the tests work, you need to create the test users in MongoDB. You can:

1. **Check existing users:**
   ```bash
   # Connect to MongoDB and check existing users
   mongosh "your_mongodb_connection_string"
   use airbnb_backend
   db.users.find({}, {email: 1, role: 1})
   ```

2. **Create test users script** (create a new file):
   ```javascript
   // create_test_users.js
   import mongoose from 'mongoose';
   import bcrypt from 'bcryptjs';
   import User from './models/User.js';
   import dotenv from 'dotenv';
   
   dotenv.config();
   
   async function createTestUsers() {
     await mongoose.connect(process.env.MONGODB_URI);
     
     // Create traveler users
     for (let i = 1; i <= 10; i++) {
       const hashedPassword = await bcrypt.hash('password123', 10);
       await User.create({
         name: `Traveler ${i}`,
         email: `traveler${i}@test.com`,
         password: hashedPassword,
         role: 'traveler'
       });
       console.log(`Created traveler${i}@test.com`);
     }
     
     // Create owner users
     for (let i = 1; i <= 5; i++) {
       const hashedPassword = await bcrypt.hash('password123', 10);
       await User.create({
         name: `Owner ${i}`,
         email: `owner${i}@test.com`,
         password: hashedPassword,
         role: 'owner'
       });
       console.log(`Created owner${i}@test.com`);
     }
     
     await mongoose.disconnect();
   }
   
   createTestUsers();
   ```

3. **Or update CSV files** to use existing users from your database.

## Files Modified

1. `JMeter_Airbnb_Performance_Test.jmx` - Fixed URL configuration and THREADS variable
2. `run_tests_and_generate_reports.sh` - Added DOMAIN and PORT parameters

## Testing

After creating the test users, run:
```bash
cd /Users/spartan/finaldemo/Airbnb-Clone/jmeter
./run_tests_and_generate_reports.sh
```

The tests should now:
- ✅ Connect to the correct API endpoint
- ✅ Start the correct number of threads
- ⚠️ Still fail authentication until test users are created

