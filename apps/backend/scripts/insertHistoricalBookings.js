import { promisePool } from '../config/db.js';

async function insertHistoricalBookings() {
  try {
    console.log('🕐 Inserting historical booking data...\n');

    // Get some users and properties
    const [travelers] = await promisePool.query(`
      SELECT id, name FROM users WHERE role = 'traveler' LIMIT 3
    `);
    const [owners] = await promisePool.query(`
      SELECT id FROM users WHERE role = 'owner' LIMIT 2
    `);
    const [properties] = await promisePool.query(`
      SELECT id, owner_id, price_per_night FROM properties LIMIT 20
    `);

    console.log(`Found ${travelers.length} travelers, ${owners.length} owners, ${properties.length} properties\n`);

    // Historical bookings data (past dates)
    const historicalBookings = [
      // Completed bookings (2-6 months ago)
      {
        traveler_id: travelers[0]?.id,
        property_id: properties[0]?.id,
        owner_id: properties[0]?.owner_id,
        check_in: '2024-05-10',
        check_out: '2024-05-15',
        number_of_guests: 2,
        total_price: 750.00,
        status: 'ACCEPTED',
        party_type: 'couple'
      },
      {
        traveler_id: travelers[0]?.id,
        property_id: properties[2]?.id,
        owner_id: properties[2]?.owner_id,
        check_in: '2024-07-20',
        check_out: '2024-07-25',
        number_of_guests: 4,
        total_price: 1200.00,
        status: 'ACCEPTED',
        party_type: 'family'
      },
      {
        traveler_id: travelers[1]?.id,
        property_id: properties[1]?.id,
        owner_id: properties[1]?.owner_id,
        check_in: '2024-06-01',
        check_out: '2024-06-05',
        number_of_guests: 2,
        total_price: 900.00,
        status: 'ACCEPTED',
        party_type: 'couple'
      },
      {
        traveler_id: travelers[1]?.id,
        property_id: properties[4]?.id,
        owner_id: properties[4]?.owner_id,
        check_in: '2024-08-15',
        check_out: '2024-08-20',
        number_of_guests: 6,
        total_price: 1500.00,
        status: 'ACCEPTED',
        party_type: 'family'
      },
      {
        traveler_id: travelers[2]?.id,
        property_id: properties[3]?.id,
        owner_id: properties[3]?.owner_id,
        check_in: '2024-04-10',
        check_out: '2024-04-12',
        number_of_guests: 1,
        total_price: 400.00,
        status: 'ACCEPTED',
        party_type: 'solo'
      },
      // More recent completed bookings (last 2 months)
      {
        traveler_id: travelers[0]?.id,
        property_id: properties[5]?.id,
        owner_id: properties[5]?.owner_id,
        check_in: '2025-09-05',
        check_out: '2025-09-10',
        number_of_guests: 2,
        total_price: 850.00,
        status: 'ACCEPTED',
        party_type: 'couple'
      },
      {
        traveler_id: travelers[1]?.id,
        property_id: properties[6]?.id,
        owner_id: properties[6]?.owner_id,
        check_in: '2025-09-15',
        check_out: '2025-09-18',
        number_of_guests: 3,
        total_price: 600.00,
        status: 'ACCEPTED',
        party_type: 'family'
      },
      {
        traveler_id: travelers[2]?.id,
        property_id: properties[7]?.id,
        owner_id: properties[7]?.owner_id,
        check_in: '2025-10-01',
        check_out: '2025-10-05',
        number_of_guests: 4,
        total_price: 1100.00,
        status: 'ACCEPTED',
        party_type: 'family'
      },
      // Cancelled bookings (past)
      {
        traveler_id: travelers[0]?.id,
        property_id: properties[8]?.id,
        owner_id: properties[8]?.owner_id,
        check_in: '2024-06-20',
        check_out: '2024-06-25',
        number_of_guests: 2,
        total_price: 700.00,
        status: 'CANCELLED',
        party_type: 'couple',
        cancelled_by: 'traveler',
        cancelled_at: '2024-06-18 10:30:00',
        cancellation_reason: 'Change of plans'
      },
      {
        traveler_id: travelers[1]?.id,
        property_id: properties[9]?.id,
        owner_id: properties[9]?.owner_id,
        check_in: '2025-08-10',
        check_out: '2025-08-15',
        number_of_guests: 4,
        total_price: 950.00,
        status: 'CANCELLED',
        party_type: 'family',
        cancelled_by: 'owner',
        cancelled_at: '2025-08-05 14:20:00',
        cancellation_reason: 'Property maintenance required'
      },
      // Upcoming bookings (near future - next 2 weeks)
      {
        traveler_id: travelers[0]?.id,
        property_id: properties[10]?.id,
        owner_id: properties[10]?.owner_id,
        check_in: '2025-11-05',
        check_out: '2025-11-10',
        number_of_guests: 2,
        total_price: 1000.00,
        status: 'ACCEPTED',
        party_type: 'couple'
      },
      {
        traveler_id: travelers[1]?.id,
        property_id: properties[11]?.id,
        owner_id: properties[11]?.owner_id,
        check_in: '2025-11-12',
        check_out: '2025-11-15',
        number_of_guests: 3,
        total_price: 750.00,
        status: 'PENDING',
        party_type: 'family'
      },
      {
        traveler_id: travelers[2]?.id,
        property_id: properties[12]?.id,
        owner_id: properties[12]?.owner_id,
        check_in: '2025-11-20',
        check_out: '2025-11-25',
        number_of_guests: 2,
        total_price: 1200.00,
        status: 'PENDING',
        party_type: 'couple'
      }
    ];

    console.log(`Inserting ${historicalBookings.length} historical bookings...\n`);

    let insertedCount = 0;
    let errorCount = 0;

    for (const booking of historicalBookings) {
      try {
        const query = `
          INSERT INTO bookings (
            traveler_id, property_id, owner_id, check_in, check_out,
            number_of_guests, total_price, status, party_type,
            cancelled_by, cancelled_at, cancellation_reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          booking.traveler_id,
          booking.property_id,
          booking.owner_id,
          booking.check_in,
          booking.check_out,
          booking.number_of_guests,
          booking.total_price,
          booking.status,
          booking.party_type,
          booking.cancelled_by || null,
          booking.cancelled_at || null,
          booking.cancellation_reason || null
        ];

        await promisePool.query(query, values);
        insertedCount++;
        console.log(`✅ Inserted: ${booking.check_in} to ${booking.check_out} (${booking.status})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error inserting booking: ${error.message}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Successfully inserted: ${insertedCount} bookings`);
    console.log(`   Errors: ${errorCount}`);

    // Show updated booking statistics
    console.log('\n📈 Updated Booking Statistics:');
    const [stats] = await promisePool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_price) as total_revenue
      FROM bookings
      GROUP BY status
    `);
    console.table(stats);

    // Show bookings by time period
    console.log('\n📅 Bookings by Time Period:');
    const [periods] = await promisePool.query(`
      SELECT 
        CASE 
          WHEN check_in < CURDATE() THEN 'Past'
          WHEN check_in = CURDATE() THEN 'Today'
          WHEN check_in > CURDATE() THEN 'Future'
        END as period,
        COUNT(*) as count,
        SUM(total_price) as total_value
      FROM bookings
      GROUP BY period
      ORDER BY 
        CASE period
          WHEN 'Past' THEN 1
          WHEN 'Today' THEN 2
          WHEN 'Future' THEN 3
        END
    `);
    console.table(periods);

    // Show traveler booking history
    console.log('\n👥 Traveler Booking Counts:');
    const [travelerStats] = await promisePool.query(`
      SELECT 
        u.id,
        u.name,
        COUNT(b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(b.total_price) as total_spent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.traveler_id
      WHERE u.role = 'traveler'
      GROUP BY u.id, u.name
      HAVING total_bookings > 0
      ORDER BY total_bookings DESC
    `);
    console.table(travelerStats);

    console.log('\n✅ Historical bookings inserted successfully!');
    console.log('💡 You can now test booking history features with past, present, and future bookings.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

insertHistoricalBookings();
