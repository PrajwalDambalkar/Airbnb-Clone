// scripts/create_jmeter_test_users.js
// Create test users for JMeter performance testing

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

async function createTestUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let created = 0;
    let skipped = 0;

    // Create traveler users (traveler1@test.com through traveler10@test.com)
    console.log('👥 Creating traveler users...');
    const travelerNames = [
      'John Traveler', 'Jane Traveler', 'Bob Traveler', 'Alice Traveler',
      'Charlie Traveler', 'Diana Traveler', 'Edward Traveler', 'Fiona Traveler',
      'George Traveler', 'Helen Traveler'
    ];

    for (let i = 1; i <= 10; i++) {
      const email = `traveler${i}@test.com`;
      const name = travelerNames[i - 1] || `Traveler ${i}`;
      
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.log(`  ⏭️  Skipped: ${email} (already exists)`);
          skipped++;
        } else {
          await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'traveler'
          });
          console.log(`  ✅ Created: ${email}`);
          created++;
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`  ⏭️  Skipped: ${email} (duplicate)`);
          skipped++;
        } else {
          console.error(`  ❌ Error creating ${email}:`, error.message);
        }
      }
    }

    // Create owner users (owner1@test.com through owner5@test.com)
    console.log('\n🏠 Creating owner users...');
    const ownerNames = [
      'Owner One', 'Owner Two', 'Owner Three', 'Owner Four', 'Owner Five'
    ];

    for (let i = 1; i <= 5; i++) {
      const email = `owner${i}@test.com`;
      const name = ownerNames[i - 1] || `Owner ${i}`;
      
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          console.log(`  ⏭️  Skipped: ${email} (already exists)`);
          skipped++;
        } else {
          await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'owner'
          });
          console.log(`  ✅ Created: ${email}`);
          created++;
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`  ⏭️  Skipped: ${email} (duplicate)`);
          skipped++;
        } else {
          console.error(`  ❌ Error creating ${email}:`, error.message);
        }
      }
    }

    console.log('\n========================================');
    console.log(`✅ Created: ${created} users`);
    console.log(`⏭️  Skipped: ${skipped} users (already exist)`);
    console.log('========================================');
    console.log('\n📝 Test users are ready for JMeter testing!');
    console.log('   All users have password: password123\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestUsers();

