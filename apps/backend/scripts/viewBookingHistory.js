import { promisePool } from '../config/db.js';

async function viewBookingHistory(userId = null, userType = 'traveler') {
  try {
    console.log('📚 Booking History Report\n');
    console.log('═'.repeat(100));

    if (userId) {
      // Show specific user's history
      if (userType === 'traveler') {
        await showTravelerHistory(userId);
      } else {
        await showOwnerHistory(userId);
      }
    } else {
      // Show all users
      await showAllTravelersHistory();
      console.log('\n' + '═'.repeat(100) + '\n');
      await showAllOwnersHistory();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

async function showTravelerHistory(travelerId) {
  console.log(`\n🧳 TRAVELER BOOKING HISTORY (ID: ${travelerId})\n`);

  // Get traveler info
  const [traveler] = await promisePool.query(
    'SELECT id, name, email FROM users WHERE id = ? AND role = "traveler"',
    [travelerId]
  );

  if (!traveler[0]) {
    console.log('❌ Traveler not found');
    return;
  }

  console.log(`👤 Name: ${traveler[0].name}`);
  console.log(`📧 Email: ${traveler[0].email}\n`);

  // Get all bookings
  const [bookings] = await promisePool.query(`
    SELECT 
      b.id,
      b.check_in,
      b.check_out,
      b.number_of_guests,
      b.total_price,
      b.status,
      b.party_type,
      b.created_at,
      p.property_name,
      p.city,
      p.state,
      u.name as owner_name,
      CASE 
        WHEN b.check_in < CURDATE() THEN 'Completed'
        WHEN b.check_in = CURDATE() THEN 'Today'
        WHEN b.check_in > CURDATE() THEN 'Upcoming'
      END as booking_period
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users u ON b.owner_id = u.id
    WHERE b.traveler_id = ?
    ORDER BY b.check_in DESC
  `, [travelerId]);

  if (bookings.length === 0) {
    console.log('📭 No bookings found');
    return;
  }

  // Group by period
  const past = bookings.filter(b => b.booking_period === 'Completed');
  const today = bookings.filter(b => b.booking_period === 'Today');
  const upcoming = bookings.filter(b => b.booking_period === 'Upcoming');

  console.log(`📊 Total Bookings: ${bookings.length}`);
  console.log(`   ✅ Completed: ${past.length}`);
  console.log(`   📅 Today: ${today.length}`);
  console.log(`   🔜 Upcoming: ${upcoming.length}\n`);

  if (past.length > 0) {
    console.log('📜 PAST BOOKINGS (Completed):');
    console.log('─'.repeat(100));
    console.table(past.map(b => ({
      ID: b.id,
      Property: b.property_name,
      Location: `${b.city}, ${b.state}`,
      'Check-in': b.check_in.toISOString().split('T')[0],
      'Check-out': b.check_out.toISOString().split('T')[0],
      Guests: b.number_of_guests,
      Price: `$${b.total_price}`,
      Status: b.status,
      Owner: b.owner_name
    })));
  }

  if (today.length > 0) {
    console.log('\n📅 TODAY\'S BOOKINGS:');
    console.log('─'.repeat(100));
    console.table(today.map(b => ({
      ID: b.id,
      Property: b.property_name,
      Location: `${b.city}, ${b.state}`,
      Guests: b.number_of_guests,
      Price: `$${b.total_price}`,
      Status: b.status
    })));
  }

  if (upcoming.length > 0) {
    console.log('\n🔜 UPCOMING BOOKINGS:');
    console.log('─'.repeat(100));
    console.table(upcoming.map(b => ({
      ID: b.id,
      Property: b.property_name,
      Location: `${b.city}, ${b.state}`,
      'Check-in': b.check_in.toISOString().split('T')[0],
      'Check-out': b.check_out.toISOString().split('T')[0],
      Guests: b.number_of_guests,
      Price: `$${b.total_price}`,
      Status: b.status
    })));
  }

  // Summary stats
  const totalSpent = bookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0);
  const acceptedCount = bookings.filter(b => b.status === 'ACCEPTED').length;
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length;

  console.log('\n💰 SPENDING SUMMARY:');
  console.log(`   Total Spent: $${totalSpent.toFixed(2)}`);
  console.log(`   Accepted Bookings: ${acceptedCount}`);
  console.log(`   Cancelled Bookings: ${cancelledCount}`);
}

async function showOwnerHistory(ownerId) {
  console.log(`\n🏠 OWNER BOOKING HISTORY (ID: ${ownerId})\n`);

  // Get owner info
  const [owner] = await promisePool.query(
    'SELECT id, name, email FROM users WHERE id = ? AND role = "owner"',
    [ownerId]
  );

  if (!owner[0]) {
    console.log('❌ Owner not found');
    return;
  }

  console.log(`👤 Name: ${owner[0].name}`);
  console.log(`📧 Email: ${owner[0].email}\n`);

  // Get all bookings for owner's properties
  const [bookings] = await promisePool.query(`
    SELECT 
      b.id,
      b.check_in,
      b.check_out,
      b.number_of_guests,
      b.total_price,
      b.status,
      b.party_type,
      b.created_at,
      p.property_name,
      p.city,
      p.state,
      u.name as traveler_name,
      u.email as traveler_email,
      CASE 
        WHEN b.check_in < CURDATE() THEN 'Completed'
        WHEN b.check_in = CURDATE() THEN 'Today'
        WHEN b.check_in > CURDATE() THEN 'Upcoming'
      END as booking_period
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN users u ON b.traveler_id = u.id
    WHERE b.owner_id = ?
    ORDER BY b.check_in DESC
  `, [ownerId]);

  if (bookings.length === 0) {
    console.log('📭 No bookings found');
    return;
  }

  // Group by period
  const past = bookings.filter(b => b.booking_period === 'Completed');
  const today = bookings.filter(b => b.booking_period === 'Today');
  const upcoming = bookings.filter(b => b.booking_period === 'Upcoming');

  console.log(`📊 Total Bookings: ${bookings.length}`);
  console.log(`   ✅ Completed: ${past.length}`);
  console.log(`   📅 Today: ${today.length}`);
  console.log(`   🔜 Upcoming: ${upcoming.length}\n`);

  if (past.length > 0) {
    console.log('📜 PAST BOOKINGS (Completed):');
    console.log('─'.repeat(100));
    console.table(past.map(b => ({
      ID: b.id,
      Property: b.property_name,
      'Check-in': b.check_in.toISOString().split('T')[0],
      'Check-out': b.check_out.toISOString().split('T')[0],
      Guests: b.number_of_guests,
      Price: `$${b.total_price}`,
      Status: b.status,
      Traveler: b.traveler_name
    })));
  }

  if (today.length > 0) {
    console.log('\n📅 TODAY\'S BOOKINGS:');
    console.log('─'.repeat(100));
    console.table(today.map(b => ({
      ID: b.id,
      Property: b.property_name,
      Guests: b.number_of_guests,
      Price: `$${b.total_price}`,
      Status: b.status,
      Traveler: b.traveler_name
    })));
  }

  if (upcoming.length > 0) {
    console.log('\n🔜 UPCOMING BOOKINGS:');
    console.log('─'.repeat(100));
    console.table(upcoming.map(b => ({
      ID: b.id,
      Property: b.property_name,
      'Check-in': b.check_in.toISOString().split('T')[0],
      'Check-out': b.check_out.toISOString().split('T')[0],
      Guests: b.number_of_guests,
      Price: `$${b.total_price}`,
      Status: b.status,
      Traveler: b.traveler_name
    })));
  }

  // Revenue summary
  const totalRevenue = bookings
    .filter(b => b.status === 'ACCEPTED')
    .reduce((sum, b) => sum + parseFloat(b.total_price), 0);
  const acceptedCount = bookings.filter(b => b.status === 'ACCEPTED').length;
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

  console.log('\n💰 REVENUE SUMMARY:');
  console.log(`   Total Revenue (Accepted): $${totalRevenue.toFixed(2)}`);
  console.log(`   Accepted Bookings: ${acceptedCount}`);
  console.log(`   Pending Requests: ${pendingCount}`);
}

async function showAllTravelersHistory() {
  console.log('\n👥 ALL TRAVELERS - BOOKING SUMMARY\n');

  const [travelers] = await promisePool.query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      COUNT(b.id) as total_bookings,
      SUM(CASE WHEN b.check_in < CURDATE() THEN 1 ELSE 0 END) as past_bookings,
      SUM(CASE WHEN b.check_in >= CURDATE() THEN 1 ELSE 0 END) as future_bookings,
      SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
      SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
      SUM(b.total_price) as total_spent
    FROM users u
    LEFT JOIN bookings b ON u.id = b.traveler_id
    WHERE u.role = 'traveler'
    GROUP BY u.id, u.name, u.email
    HAVING total_bookings > 0
    ORDER BY total_bookings DESC
  `);

  console.table(travelers.map(t => ({
    ID: t.id,
    Name: t.name,
    Email: t.email,
    'Total': t.total_bookings,
    'Past': t.past_bookings,
    'Upcoming': t.future_bookings,
    'Accepted': t.accepted,
    'Cancelled': t.cancelled,
    'Total Spent': `$${parseFloat(t.total_spent || 0).toFixed(2)}`
  })));
}

async function showAllOwnersHistory() {
  console.log('\n🏠 ALL OWNERS - BOOKING SUMMARY\n');

  const [owners] = await promisePool.query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      COUNT(DISTINCT p.id) as total_properties,
      COUNT(b.id) as total_bookings,
      SUM(CASE WHEN b.check_in < CURDATE() THEN 1 ELSE 0 END) as past_bookings,
      SUM(CASE WHEN b.check_in >= CURDATE() THEN 1 ELSE 0 END) as future_bookings,
      SUM(CASE WHEN b.status = 'ACCEPTED' THEN b.total_price ELSE 0 END) as total_revenue,
      SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending_requests
    FROM users u
    LEFT JOIN properties p ON u.id = p.owner_id
    LEFT JOIN bookings b ON u.id = b.owner_id
    WHERE u.role = 'owner'
    GROUP BY u.id, u.name, u.email
    HAVING total_bookings > 0
    ORDER BY total_revenue DESC
  `);

  console.table(owners.map(o => ({
    ID: o.id,
    Name: o.name,
    Email: o.email,
    'Properties': o.total_properties,
    'Total Bookings': o.total_bookings,
    'Past': o.past_bookings,
    'Upcoming': o.future_bookings,
    'Pending': o.pending_requests,
    'Revenue': `$${parseFloat(o.total_revenue || 0).toFixed(2)}`
  })));
}

// Parse command line arguments
const args = process.argv.slice(2);
const userId = args[0] ? parseInt(args[0]) : null;
const userType = args[1] || 'traveler';

viewBookingHistory(userId, userType);
