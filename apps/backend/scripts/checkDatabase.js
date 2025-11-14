import { promisePool } from '../config/db.js';

async function checkDatabase() {
  try {
    console.log('🔍 Checking Database Configuration...\n');

    // Check current database
    const [dbInfo] = await promisePool.query('SELECT DATABASE() as current_db');
    console.log('📊 Current Database:', dbInfo[0].current_db);
    console.log('─'.repeat(80));

    // Show all tables
    console.log('\n📋 Tables in database:');
    const [tables] = await promisePool.query('SHOW TABLES');
    console.log(tables);
    console.log('─'.repeat(80));

    // Check users table
    console.log('\n👥 Users Table:');
    const [userCount] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    console.log(`Total users: ${userCount[0].count}`);
    const [users] = await promisePool.query('SELECT id, name, email, role, created_at FROM users LIMIT 5');
    console.table(users);

    // Check properties table
    console.log('\n🏠 Properties Table:');
    const [propCount] = await promisePool.query('SELECT COUNT(*) as count FROM properties');
    console.log(`Total properties: ${propCount[0].count}`);
    const [properties] = await promisePool.query(`
      SELECT id, property_name, city, state, price_per_night, available, owner_id 
      FROM properties 
      LIMIT 5
    `);
    console.table(properties);

    // Check bookings table
    console.log('\n📅 Bookings Table:');
    const [bookingCount] = await promisePool.query('SELECT COUNT(*) as count FROM bookings');
    console.log(`Total bookings: ${bookingCount[0].count}`);
    const [bookings] = await promisePool.query(`
      SELECT 
        b.id,
        b.traveler_id,
        b.property_id,
        b.owner_id,
        b.check_in,
        b.check_out,
        b.number_of_guests,
        b.total_price,
        b.status,
        b.party_type,
        b.created_at
      FROM bookings b
      ORDER BY b.created_at DESC
      LIMIT 10
    `);
    console.table(bookings);

    // Check booking status distribution
    console.log('\n📊 Booking Status Distribution:');
    const [statusDist] = await promisePool.query(`
      SELECT status, COUNT(*) as count 
      FROM bookings 
      GROUP BY status
    `);
    console.table(statusDist);

    // Show table structures
    console.log('\n🏗️  Users Table Structure:');
    const [userStruct] = await promisePool.query('DESCRIBE users');
    console.table(userStruct);

    console.log('\n🏗️  Properties Table Structure:');
    const [propStruct] = await promisePool.query('DESCRIBE properties');
    console.table(propStruct);

    console.log('\n🏗️  Bookings Table Structure:');
    const [bookingStruct] = await promisePool.query('DESCRIBE bookings');
    console.table(bookingStruct);

    console.log('\n✅ Database check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
