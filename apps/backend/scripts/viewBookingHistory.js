// scripts/viewBookingHistory.js
// View booking history from the database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root
dotenv.config({ path: join(__dirname, '../../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'airbnb_db',
  port: process.env.DB_PORT || 3306,
};

async function viewBookingHistory() {
  let connection;
  
  try {
    console.log('\n🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');

    // 1. All Bookings Overview
    console.log('========================================');
    console.log('📋 ALL BOOKINGS OVERVIEW');
    console.log('========================================\n');
    
    const [bookings] = await connection.query(`
      SELECT 
        b.id,
        b.status,
        b.party_type,
        DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
        DATE_FORMAT(b.check_out, '%Y-%m-%d') as check_out,
        DATEDIFF(b.check_out, b.check_in) as nights,
        b.number_of_guests as guests,
        b.total_price,
        t.name as traveler,
        t.email as traveler_email,
        p.property_name,
        p.city,
        o.name as owner,
        DATE_FORMAT(b.created_at, '%b %d, %Y') as booking_date
      FROM bookings b
      JOIN users t ON b.traveler_id = t.id
      JOIN properties p ON b.property_id = p.id
      JOIN users o ON b.owner_id = o.id
      ORDER BY b.created_at DESC
    `);

    console.table(bookings.map(b => ({
      ID: b.id,
      Status: b.status,
      'Check-In': b.check_in,
      'Check-Out': b.check_out,
      Nights: b.nights,
      Guests: b.guests,
      Price: `$${b.total_price}`,
      Traveler: b.traveler,
      Property: `${b.property_name} (${b.city})`,
      Owner: b.owner,
      'Booked On': b.booking_date
    })));

    // 2. Bookings by Status
    console.log('\n========================================');
    console.log('📊 BOOKINGS BY STATUS');
    console.log('========================================\n');
    
    const [statusStats] = await connection.query(`
      SELECT 
        status,
        COUNT(*) as total_count,
        SUM(total_price) as total_value,
        AVG(total_price) as avg_value
      FROM bookings
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'PENDING' THEN 1
          WHEN 'ACCEPTED' THEN 2
          WHEN 'CANCELLED' THEN 3
        END
    `);

    console.table(statusStats.map(s => ({
      Status: s.status,
      Count: s.total_count,
      'Total Value': `$${s.total_value.toFixed(2)}`,
      'Avg Value': `$${s.avg_value.toFixed(2)}`
    })));

    // 3. Traveler Statistics
    console.log('\n========================================');
    console.log('👤 TRAVELER BOOKING STATISTICS');
    console.log('========================================\n');
    
    const [travelerStats] = await connection.query(`
      SELECT 
        t.id,
        t.name,
        t.email,
        CONCAT(t.city, ', ', t.state) as location,
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN b.status = 'ACCEPTED' THEN b.total_price ELSE 0 END) as total_spent
      FROM users t
      LEFT JOIN bookings b ON t.id = b.traveler_id
      WHERE t.role = 'traveler'
      GROUP BY t.id, t.name, t.email, t.city, t.state
      HAVING total_bookings > 0
      ORDER BY total_bookings DESC
    `);

    console.table(travelerStats.map(t => ({
      ID: t.id,
      Name: t.name,
      Email: t.email,
      Location: t.location,
      'Total Bookings': t.total_bookings,
      Accepted: t.accepted,
      Pending: t.pending,
      Cancelled: t.cancelled,
      'Total Spent': `$${t.total_spent.toFixed(2)}`
    })));

    // 4. Owner Statistics
    console.log('\n========================================');
    console.log('🏠 OWNER BOOKING STATISTICS');
    console.log('========================================\n');
    
    const [ownerStats] = await connection.query(`
      SELECT 
        o.id,
        o.name,
        o.email,
        CONCAT(o.city, ', ', o.state) as location,
        COUNT(DISTINCT p.id) as properties_count,
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN b.status = 'ACCEPTED' THEN b.total_price ELSE 0 END) as total_revenue
      FROM users o
      LEFT JOIN properties p ON o.id = p.owner_id
      LEFT JOIN bookings b ON o.id = b.owner_id
      WHERE o.role = 'owner'
      GROUP BY o.id, o.name, o.email, o.city, o.state
      HAVING total_bookings > 0
      ORDER BY total_revenue DESC
    `);

    console.table(ownerStats.map(o => ({
      ID: o.id,
      Name: o.name,
      Email: o.email,
      Location: o.location,
      Properties: o.properties_count,
      'Total Bookings': o.total_bookings,
      Accepted: o.accepted,
      Pending: o.pending_requests,
      Cancelled: o.cancelled,
      'Total Revenue': `$${o.total_revenue.toFixed(2)}`
    })));

    // 5. Upcoming Bookings
    console.log('\n========================================');
    console.log('📅 UPCOMING BOOKINGS (Next 30 Days)');
    console.log('========================================\n');
    
    const [upcoming] = await connection.query(`
      SELECT 
        b.id,
        b.status,
        DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
        DATE_FORMAT(b.check_out, '%Y-%m-%d') as check_out,
        DATEDIFF(b.check_in, CURDATE()) as days_away,
        t.name as traveler,
        p.property_name,
        p.city,
        o.name as owner,
        b.total_price
      FROM bookings b
      JOIN users t ON b.traveler_id = t.id
      JOIN properties p ON b.property_id = p.id
      JOIN users o ON b.owner_id = o.id
      WHERE b.check_in >= CURDATE() 
        AND b.check_in <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND b.status IN ('PENDING', 'ACCEPTED')
      ORDER BY b.check_in ASC
    `);

    if (upcoming.length > 0) {
      console.table(upcoming.map(u => ({
        ID: u.id,
        Status: u.status,
        'Check-In': u.check_in,
        'Check-Out': u.check_out,
        'Days Away': u.days_away,
        Traveler: u.traveler,
        Property: `${u.property_name} (${u.city})`,
        Owner: u.owner,
        Price: `$${u.total_price}`
      })));
    } else {
      console.log('No upcoming bookings in the next 30 days.\n');
    }

    // 6. Pending Bookings
    console.log('\n========================================');
    console.log('⏳ PENDING BOOKINGS REQUIRING ACTION');
    console.log('========================================\n');
    
    const [pending] = await connection.query(`
      SELECT 
        b.id,
        DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
        DATE_FORMAT(b.check_out, '%Y-%m-%d') as check_out,
        DATEDIFF(b.check_in, CURDATE()) as days_until_checkin,
        t.name as traveler,
        t.email as traveler_email,
        p.property_name,
        p.city,
        o.name as owner,
        b.number_of_guests as guests,
        b.total_price,
        DATE_FORMAT(b.created_at, '%b %d, %Y %H:%i') as requested_on
      FROM bookings b
      JOIN users t ON b.traveler_id = t.id
      JOIN properties p ON b.property_id = p.id
      JOIN users o ON b.owner_id = o.id
      WHERE b.status = 'PENDING'
      ORDER BY b.check_in ASC
    `);

    if (pending.length > 0) {
      console.table(pending.map(p => ({
        ID: p.id,
        'Check-In': p.check_in,
        'Check-Out': p.check_out,
        'Days Until': p.days_until_checkin,
        Traveler: p.traveler,
        Property: `${p.property_name} (${p.city})`,
        Owner: p.owner,
        Guests: p.guests,
        Price: `$${p.total_price}`,
        'Requested On': p.requested_on
      })));
    } else {
      console.log('No pending bookings.\n');
    }

    // 7. Overall Statistics
    console.log('\n========================================');
    console.log('📈 OVERALL STATISTICS');
    console.log('========================================\n');
    
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(DISTINCT traveler_id) as unique_travelers,
        COUNT(DISTINCT property_id) as booked_properties,
        COUNT(DISTINCT owner_id) as owners_with_bookings,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'ACCEPTED' THEN total_price ELSE 0 END) as total_revenue,
        AVG(total_price) as avg_booking_value,
        AVG(number_of_guests) as avg_guests,
        AVG(DATEDIFF(check_out, check_in)) as avg_nights
      FROM bookings
    `);

    const summary = stats[0];
    console.log(`📊 Total Bookings: ${summary.total_bookings}`);
    console.log(`👥 Unique Travelers: ${summary.unique_travelers}`);
    console.log(`🏠 Booked Properties: ${summary.booked_properties}`);
    console.log(`🏡 Owners with Bookings: ${summary.owners_with_bookings}`);
    console.log(`⏳ Pending: ${summary.pending}`);
    console.log(`✅ Accepted: ${summary.accepted}`);
    console.log(`❌ Cancelled: ${summary.cancelled}`);
    console.log(`💰 Total Revenue: $${summary.total_revenue.toFixed(2)}`);
    console.log(`💵 Avg Booking Value: $${summary.avg_booking_value.toFixed(2)}`);
    console.log(`👨‍👩‍👧‍👦 Avg Guests: ${summary.avg_guests.toFixed(1)}`);
    console.log(`🌙 Avg Nights: ${summary.avg_nights.toFixed(1)}`);

    console.log('\n✅ Booking history view complete!\n');

  } catch (error) {
    console.error('❌ Error viewing booking history:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.\n');
    }
  }
}

// Run the script
viewBookingHistory();

