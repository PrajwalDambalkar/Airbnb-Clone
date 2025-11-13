import { promisePool } from '../config/db.js';

/**
 * Cron job to automatically update booking statuses
 * - ACCEPTED → COMPLETED when check_out date has passed
 * Run this daily via cron or scheduler
 */
async function updateBookingStatuses() {
  try {
    console.log('🔄 Checking for bookings to update...\n');

    // Update ACCEPTED bookings where checkout date has passed
    const [result] = await promisePool.query(`
      UPDATE bookings 
      SET status = 'COMPLETED', 
          updated_at = CURRENT_TIMESTAMP
      WHERE status = 'ACCEPTED' 
        AND check_out < CURDATE()
    `);

    if (result.affectedRows > 0) {
      console.log(`✅ Updated ${result.affectedRows} booking(s) to COMPLETED status`);
      
      // Show updated bookings
      const [updated] = await promisePool.query(`
        SELECT 
          b.id,
          b.check_in,
          b.check_out,
          b.status,
          p.property_name,
          t.name as traveler_name
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        JOIN users t ON b.traveler_id = t.id
        WHERE b.status = 'COMPLETED'
          AND DATE(b.updated_at) = CURDATE()
        ORDER BY b.updated_at DESC
      `);

      console.log('\n📋 Recently completed bookings:');
      console.table(updated);
    } else {
      console.log('✅ No bookings need status update');
    }

    // Show current distribution
    const [stats] = await promisePool.query(`
      SELECT status, COUNT(*) as count
      FROM bookings
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'PENDING' THEN 1
          WHEN 'ACCEPTED' THEN 2
          WHEN 'COMPLETED' THEN 3
          WHEN 'CANCELLED' THEN 4
        END
    `);

    console.log('\n📊 Current Booking Status Distribution:');
    console.table(stats);

    console.log('\n✅ Status update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating booking statuses:', error);
    process.exit(1);
  }
}

updateBookingStatuses();
